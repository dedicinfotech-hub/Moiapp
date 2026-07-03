// ── API base URL ──────────────────────────────────────────────────────────────
// LOCAL DEV  (npm run dev):
//   Both env vars are empty. BASE = '/api'
//   Next.js dev server rewrites /api/* → http://localhost:8888/MoiApp/api/*
//   No CORS issues — browser only talks to localhost:3000.
//
// PRODUCTION (npm run build + static export):
//   NEXT_PUBLIC_API_URL = https://moipassbook.com/api
//   Browser calls the PHP backend directly.
import toast from 'react-hot-toast';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const BASE: string = process.env.NEXT_PUBLIC_API_URL || `${basePath}/api`;
export const API_BASE = BASE;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('moi_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  // Use X-Auth-Token — MAMP's Apache strips the Authorization header
  if (token) headers['X-Auth-Token'] = `Bearer ${token}`;

  // Build the URL. BASE is always an absolute URL in APK/production
  // (NEXT_PUBLIC_API_URL = https://moipassbook.com/api).
  // In local dev BASE = '/api' (relative), so we fall back to window.location.origin.
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = new URL(`${BASE}${path}`, origin);
  url.searchParams.set('_t', Date.now().toString());

  // Debug logging for mobile API troubleshooting
  console.log('[API_REQUEST]', {
    url: url.toString(),
    method: options.method || 'GET',
    headers: { ...headers, 'X-Auth-Token': token ? 'Bearer ***' : 'none' },
    base: BASE,
    path,
  });

  let res: Response;
  try {
    res = await fetch(url.toString(), { ...options, headers, cache: 'no-store' });
  } catch (networkError) {
    console.error('[API_NETWORK_ERROR]', {
      url: url.toString(),
      error: networkError instanceof Error ? networkError.message : String(networkError),
      base: BASE,
    });
    if (typeof window !== 'undefined') {
      toast.error('Network error. Check your internet connection.');
    }
    throw networkError;
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let data: unknown;
  try {
    data = isJson ? await res.json() : await res.text();
  } catch {
    const errorMsg = 'Invalid response from server';
    console.error('[API_PARSE_ERROR]', { url: url.toString(), status: res.status, contentType });
    if (typeof window !== 'undefined') {
      toast.error(errorMsg);
    }
    throw new Error(errorMsg);
  }

  console.log('[API_RESPONSE]', {
    url: url.toString(),
    status: res.status,
    statusText: res.statusText,
    contentType,
    isJson,
    data: isJson ? JSON.stringify(data).slice(0, 500) : String(data).slice(0, 500),
  });

  if (!res.ok) {
    const errorMsg = (isJson && typeof data === 'object' && data !== null && 'error' in data)
      ? (data as { error?: string }).error || 'Request failed'
      : (typeof data === 'string' ? data : 'Request failed');
    console.error('[API_ERROR]', { url: url.toString(), status: res.status, error: errorMsg, data });
    if (typeof window !== 'undefined') {
      toast.error(errorMsg);
    }
    throw new Error(errorMsg);
  }

  return (isJson ? data : { raw: data }) as T;
}

export { request };

// Helper to show success toast
export function showSuccess(message: string) {
  if (typeof window !== 'undefined') {
    toast.success(message);
  }
}

// Helper to show error toast
export function showError(message: string) {
  if (typeof window !== 'undefined') {
    toast.error(message);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    request<{ token: string; user: User }>('/auth.php?action=register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string; otp?: string }) =>
    request<{ token?: string; user?: User; requires_otp?: boolean; message?: string; otp_email?: string }>('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Phone/OTP login
  sendOTP: (phone: string) =>
    request<{ success: boolean; message: string }>('/auth.php?action=send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyOTP: (phone: string, otp: string) =>
    request<{ 
      success: boolean; 
      token: string; 
      user: User; 
      needsProfile: boolean 
    }>('/auth.php?action=verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),

  me: () => request<{ user: User }>('/auth.php?action=me'),

  updateProfile: (body: Partial<User>) =>
    request<{ success: boolean; user: User }>('/auth.php?action=profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/auth.php?action=forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ success: boolean; message: string }>('/auth.php?action=reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  deleteAccount: () =>
    request<{ success: boolean; message: string; grace_period_days?: number }>(
      '/auth.php?action=account',
      { method: 'DELETE' }
    ),
};

// ── Features ───────────────────────────────────────────────────────────────────
export const featuresApi = {
  list: () => request<{ toggles: { feature_key: string; is_enabled: number; description: string }[] }>('/features.php'),
  update: (feature_key: string, is_enabled: number) =>
    request<{ success: boolean }>('/features.php', {
      method: 'PUT',
      body: JSON.stringify({ feature_key, is_enabled }),
    }),
};

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const dashboardApi = {
  summary: () => request<DashboardSummaryResponse>('/dashboard.php?action=summary'),
};

export interface DashboardSummaryResponse {
  success: boolean;
  summary: {
    total_events: number;
    total_guests: number;
    total_cash: number;
    total_gold: number;
    total_gifts: number;
    avg_cash_gift: number;
  };
  recentEntries: DashboardEntry[];
  recentEvents: DashboardEvent[];
}

export interface DashboardEntry {
  id: number;
  event_id: number;
  guest_name: string;
  city?: string | null;
  amount: number;
  gift_type: 'cash' | 'gold' | 'silver' | 'gift';
  gold_weight?: number | null;
  gift_description?: string | null;
  payment_mode: 'cash' | 'upi' | 'card' | 'cheque' | 'other';
  created_at: string;
  event_type?: string;
  custom_title?: string;
  wedding_date?: string;
}

export interface DashboardEvent {
  id: number;
  user_id: number;
  slug: string;
  event_type: Event['event_type'];
  custom_title?: string;
  bride_name?: string;
  groom_name?: string;
  birthday_person_name?: string;
  birthday_person_age?: number;
  parent1_name?: string;
  parent2_name?: string;
  mother_name?: string;
  father_name?: string;
  host_name?: string;
  spouse_name?: string;
  graduate_name?: string;
  wedding_date: string;
  city?: string | null;
  venue?: string | null;
  venue_latitude?: number;
  venue_longitude?: number;
  cover_photo: string | null;
  description?: string;
  is_active: number;
  event_mode?: 'past' | 'new';
  approval_status?: 'pending' | 'approved' | 'rejected';
  approval_reason?: string | null;
  guest_token?: string | null;
  qr_enabled?: number;
  qr_payment_count?: number;
  created_at: string;
  guest_count?: number;
  total_moi?: number;
}

export const eventsApi = {
  listPublic: () => request<Event[]>('/events.php?public=1'),

  list: () => request<Event[]>('/events.php'),

  get: (slug: string) => request<Event>(`/events.php?slug=${slug}`),

  getByGuestToken: (token: string) => request<Event>(`/events.php?guest_token=${encodeURIComponent(token)}`),

  setQrEnabled: (id: number, enabled: boolean) =>
    request<{ success: boolean; qr_enabled: number }>(
      `/events.php?action=${enabled ? 'open-qr' : 'close-qr'}&id=${id}`,
      { method: 'PUT', body: JSON.stringify({}) }
    ),

  regenerateQr: (id: number) =>
    request<{ success: boolean; guest_token: string }>(
      `/events.php?action=regenerate-qr&id=${id}`,
      { method: 'PUT', body: JSON.stringify({}) }
    ),

  create: (body: Partial<Event>) =>
    request<{ id: number; slug: string; event_mode?: string; approval_status?: string }>('/events.php', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  approve: (id: number, body: { status: 'approved' | 'rejected'; reason?: string }) =>
    request<{ success: boolean; message: string }>(`/events.php?action=approve&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  listPending: (status: 'pending' | 'rejected' | 'all' = 'pending') =>
    request<Event[]>(`/events.php?action=pending&status=${status}`),

  resubmit: (id: number) =>
    request<{ success: boolean; message: string }>(`/events.php?action=resubmit&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({}),
    }),

  update: (id: number, body: Partial<Event>) =>
    request<{ success: boolean; resubmitted?: boolean }>(`/events.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/events.php?id=${id}`, { method: 'DELETE' }),
};

// ── Organizers ──────────────────────────────────────────────────────────────────
export interface Organizer {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
  added_at: string;
}

export const organizersApi = {
  list: (eventId: number) =>
    request<{ organizers: Organizer[] }>(`/organizers.php?event_id=${eventId}`),

  add: (body: { event_id: number; email: string; role: string }) =>
    request<{ success: boolean; organizer: Organizer }>('/organizers.php?action=add', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  remove: (id: number) =>
    request<{ success: boolean }>(`/organizers.php?id=${id}`, { method: 'DELETE' }),
};

// ── Moi Entries ───────────────────────────────────────────────────────────────
export const moiApi = {
  list: (eventId: number) =>
    request<{ entries: MoiEntry[]; breakdown: BreakdownItem[] }>(
      `/moi.php?event_id=${eventId}`
    ),

  add: (body: Partial<MoiEntry> & { slug?: string }) =>
    request<{ id: number }>('/moi.php', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: Partial<MoiEntry>) =>
    request<{ success: boolean }>(`/moi.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/moi.php?id=${id}`, { method: 'DELETE' }),
};

// ── Razorpay Payments ────────────────────────────────────────────────────────
export type RazorpayPaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'scan' | 'other';

export interface RazorpayCreateOrderRequest {
  guest_token?: string;
  event_slug?: string;
  payment_method: RazorpayPaymentMethod;
  guest_data: {
    guest_name: string;
    phone?: string;
    email?: string;
    city?: string;
    company?: string;
    occupation?: string;
    relation: 'family' | 'friend' | 'colleague' | 'relative' | 'neighbor' | 'business' | 'other';
    gift_type: 'cash' | 'gold' | 'silver' | 'gift';
    amount: string | number;
    note?: string;
  };
}

export interface RazorpayOrderResponse {
  success: true;
  order_id: number;
  razorpay_key_id: string;
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };
  guest_name: string;
  email?: string | null;
  phone?: string | null;
  amount: number;
  fee: number;
  total_amount: number;
  payment_method: RazorpayPaymentMethod;
  event_title: string;
}

export interface RazorpayVerifyPaymentRequest {
  guest_token?: string;
  event_slug?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  payment_method: RazorpayPaymentMethod;
}

export interface RazorpayPaymentResult {
  success: true;
  already_paid?: boolean;
  id: number;
  order_id: string;
  payment_id: string;
  transaction_id: string;
  status: 'paid';
  payment_method: RazorpayPaymentMethod;
  amount: number;
  fee: number;
  total_amount: number;
  moi_entry_id?: number | null;
}

export interface RazorpayOrderStatus {
  id: number;
  order_id: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';
  payment_id?: string | null;
  transaction_id?: string | null;
  payment_method?: RazorpayPaymentMethod | null;
  guest_name?: string;
  amount?: number;
  fee?: number;
  total_amount?: number;
  created_at?: string;
  expires_at?: string | null;
  paid_at?: string | null;
  event_title?: string;
}

export interface RazorpayReceipt {
  guest_name: string;
  amount: number;
  fee: number;
  total_amount: number;
  gift_type: 'cash' | 'gold' | 'silver' | 'gift';
  payment_method: RazorpayPaymentMethod;
  transaction_id: string;
  created_at: string;
  event_title: string;
}

export const paymentApi = {
  createOrder: (body: RazorpayCreateOrderRequest) =>
    request<RazorpayOrderResponse>('/payment.php?action=create-order', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  verifyPayment: (body: RazorpayVerifyPaymentRequest) =>
    request<RazorpayPaymentResult>('/payment.php?action=verify-payment', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getStatus: (guestToken: string, razorpayOrderId: string) =>
    request<{ success: true; order: RazorpayOrderStatus }>(
      `/payment.php?action=status&guest_token=${encodeURIComponent(guestToken)}&razorpay_order_id=${encodeURIComponent(razorpayOrderId)}`
    ),

  getReceipt: (guestToken: string, razorpayOrderId: string) =>
    request<{ success: true; receipt: RazorpayReceipt }>(
      `/payment.php?action=receipt&guest_token=${encodeURIComponent(guestToken)}&razorpay_order_id=${encodeURIComponent(razorpayOrderId)}`
    ),
};

// ── Photos ────────────────────────────────────────────────────────────────────
export const photosApi = {
  list: (eventId: number) =>
    request<Photo[]>(`/photos.php?event_id=${eventId}`),

  upload: (eventId: number, file: File, caption?: string) => {
    const token = getToken();
    const form = new FormData();
    form.append('event_id', String(eventId));
    form.append('photo', file);
    if (caption) form.append('caption', caption);
    return fetch(`${BASE}/photos.php`, {
      method: 'POST',
      headers: { 'X-Auth-Token': `Bearer ${token}` },
      body: form,
    }).then((r) => r.json());
  },

  delete: (id: number) =>
    request<{ success: boolean }>(`/photos.php?id=${id}`, { method: 'DELETE' }),
};

// ── Invitations ───────────────────────────────────────────────────────────────
export const invitationsApi = {
  list: (eventId: number) =>
    request<{ invitations: Invitation[] }>(`/invitations.php?action=list&event_id=${eventId}`),

  upload: (eventId: number, file: File) => {
    const token = getToken();
    const form = new FormData();
    form.append('event_id', String(eventId));
    form.append('csv_file', file);
    return fetch(`${BASE}/invitations.php?action=csv`, {
      method: 'POST',
      headers: { 'X-Auth-Token': `Bearer ${token}` },
      body: form,
    }).then((r) => r.json());
  },

  update: (id: number, status: string) =>
    request<{ success: boolean }>(`/invitations.php?action=update`, {
      method: 'PUT',
      body: JSON.stringify({ id, status }),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/invitations.php?action=delete&id=${id}`, { method: 'DELETE' }),
};

export interface Invitation {
  id: number;
  event_id: number;
  name: string;
  phone?: string;
  relation: string;
  city?: string;
  status: 'invited' | 'came' | 'gave_moi' | 'no_show';
  created_at: string;
}

// ── Notifications ───────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => request<{ notifications: Notification[]; unread_count: number }>('/notifications.php'),

  create: (body: { title: string; message?: string; type?: string; event_id?: number; scheduled_for?: string }) =>
    request<{ id: number }>('/notifications.php', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  markRead: (id: number) =>
    request<{ success: boolean }>('/notifications.php', {
      method: 'PUT',
      body: JSON.stringify({ id }),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>('/notifications.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

export interface Notification {
  id: number;
  user_id: number;
  event_id?: number;
  title: string;
  message?: string;
  type: 'reminder' | 'entry_saved' | 'return_gift' | 'function_date' | 'approval';
  is_read: number;
  scheduled_for?: string;
  created_at: string;
  event_name?: string;
}

// ── Export ────────────────────────────────────────────────────────────────────
export function exportCSV(eventId: number) {
  const token = getToken();
  const url = `${BASE}/export.php?event_id=${eventId}&format=csv`;
  fetch(url, { headers: { 'X-Auth-Token': `Bearer ${token}` } })
    .then((r) => r.blob())
    .then((blob) => {
      const a = document.createElement('a');
      const blobUrl = URL.createObjectURL(blob);
      a.href = blobUrl;
      a.download = `moi-export-${eventId}.csv`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    });
}

export function emailPDF(eventId: number): Promise<{ success: boolean; message: string }> {
  const token = getToken();
  return request<{ success: boolean; message: string }>(`/pdf.php?event_id=${eventId}`, {
    headers: { 'X-Auth-Token': `Bearer ${token}` },
  });
}

// ── Bulk Import ────────────────────────────────────────────────────────────────
export function bulkImportCSV(eventId: number, file: File): Promise<{ success: boolean; imported: number; errors: string[]; message: string }> {
  const token = getToken();
  const form = new FormData();
  form.append('event_id', String(eventId));
  form.append('csv_file', file);
  return fetch(`${BASE}/bulk-import.php?action=csv`, {
    method: 'POST',
    headers: { 'X-Auth-Token': `Bearer ${token}` },
    body: form,
  }).then((r) => r.json());
}

export function addDigitizedEntry(eventId: number, data: Record<string, unknown>): Promise<{ success: boolean; id: number }> {
  const token = getToken();
  return request<{ success: boolean; id: number }>(`/bulk-import.php?action=add`, {
    method: 'POST',
    headers: { 'X-Auth-Token': `Bearer ${token}` },
    body: JSON.stringify({ event_id: eventId, ...data }),
  });
}

// ── Organizers ─────────────────────────────────────────────────────────────────
export function listOrganizers(eventId: number): Promise<{ organizers: Array<{ id: number; user_id: number; name: string; email: string; role: string; added_at: string }> }> {
  const token = getToken();
  return request(`/organizers.php?event_id=${eventId}`, {
    headers: { 'X-Auth-Token': `Bearer ${token}` },
  });
}

export function addOrganizer(eventId: number, email: string, role: string = 'organizer'): Promise<{ success: boolean; organizer: { id: number; user_id: number; name: string; email: string; role: string } }> {
  const token = getToken();
  return request(`/organizers.php?action=add`, {
    method: 'POST',
    headers: { 'X-Auth-Token': `Bearer ${token}` },
    body: JSON.stringify({ event_id: eventId, email, role }),
  });
}

export function removeOrganizer(organizerId: number): Promise<{ success: boolean }> {
  const token = getToken();
  return request<{ success: boolean }>(`/organizers.php?id=${organizerId}`, {
    method: 'DELETE',
    headers: { 'X-Auth-Token': `Bearer ${token}` },
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  upi_id?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder?: string;
  role?: 'admin' | 'user';
}

export interface Event {
  id: number;
  user_id: number;
  slug: string;
  event_type: 'wedding' | 'birthday' | 'engagement' | 'valakaappu' | 'housewarming' | 'graduation' | 'custom';
  custom_title?: string;
  bride_name?: string;
  groom_name?: string;
  birthday_person_name?: string;
  birthday_person_age?: number;
  parent1_name?: string;
  parent2_name?: string;
  mother_name?: string;
  father_name?: string;
  host_name?: string;
  spouse_name?: string;
  graduate_name?: string;
  wedding_date: string;
  city?: string | null;
  venue?: string | null;
  venue_latitude?: number;
  venue_longitude?: number;
  cover_photo: string | null;
  description?: string;
  is_active: number;
  event_mode?: 'past' | 'new';
  approval_status?: 'pending' | 'approved' | 'rejected';
  approval_reason?: string | null;
  guest_token?: string | null;
  qr_enabled?: number;
  qr_payment_count?: number;
  created_at: string;
  guest_count?: number;
  total_moi?: number;
  stats?: { guest_count: number; total: number; qr_payment_count?: number };
  creator_name?: string;
  creator_phone?: string;
  // Organizer payment details (returned on public event fetch)
  upi_id?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder?: string;
  organizer_phone?: string;
}

export interface MoiEntry {
  id: number;
  event_id: number;
  guest_name: string;
  phone?: string | null;
  city?: string | null;
  company?: string | null;
  occupation?: string | null;
  amount: number;
  gift_type: 'cash' | 'gold' | 'silver' | 'gift';
  guest_token?: string | null;
  gold_weight?: number | null;
  gift_description?: string | null;
  approximate_value?: number | null;
  relation: 'family' | 'friend' | 'colleague' | 'relative' | 'neighbor' | 'business' | 'other';
  payment_mode: 'cash' | 'upi' | 'card' | 'cheque' | 'other';
  upi_ref_id?: string | null;
  other_payment_details?: string | null;
  note: string;
  entered_by: string;
  created_at: string;
}

export interface BreakdownItem {
  count: number;
  total: number;
  relation: string;
  payment_mode: string;
}

export interface Photo {
  id: number;
  event_id: number;
  s3_key: string;
  s3_url: string;
  caption: string;
  uploaded_at: string;
}

// ── Return Gifts ───────────────────────────────────────────────────────────────
export const returnGiftsApi = {
  list: (eventId: number) =>
    request<{ return_gifts: ReturnGift[] }>(`/return-gifts.php?event_id=${eventId}`),

  add: (body: Partial<ReturnGift>) =>
    request<{ id: number }>('/return-gifts.php', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: Partial<ReturnGift>) =>
    request<{ success: boolean }>('/return-gifts.php', {
      method: 'PUT',
      body: JSON.stringify({ id, ...body }),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>('/return-gifts.php', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

export interface ReturnGift {
  id: number;
  event_id: number;
  moi_entry_id?: number;
  guest_name: string;
  return_type: 'cash' | 'gold' | 'gift' | 'none';
  return_amount?: number | null;
  return_gold_weight?: number | null;
  return_gift_description?: string | null;
  return_date?: string | null;
  status: 'pending' | 'returned' | 'not_applicable';
  note?: string;
  created_at: string;
  updated_at: string;
  original_guest?: string;
}

// ── Admin API ───────────────────────────────────────────────────────────────────
// ── Contact / public enquiry ─────────────────────────────────────────────────
export const contactApi = {
  submitEnquiry: (body: { name: string; email: string; phone: string; message: string }) =>
    request<{ success: boolean; message: string }>('/contact.php', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const adminApi = {
  // Get admin dashboard statistics
  getStats: () =>
    request<{
      stats: {
        totalUsers: number;
        newToday: number;
        activeToday: number;
        totalFunctions: number;
        monthlyRevenue: number;
        lastMonthRevenue: number;
        totalRevenue: number;
        openTickets: number;
        pendingApprovals: number;
        activePrivateEvents: number;
      };
    }>('/admin.php?action=stats'),

  // Get all active private events for monitoring
  getPrivateEvents: () =>
    request<{ events: Array<{
      id: number;
      event_type: string;
      wedding_date: string;
      venue: string;
      city: string;
      host_name: string;
      host_email: string;
      host_phone: string;
      guest_count: number;
      total_moi: number;
      qr_enabled: number;
      guest_token: string;
      created_at: string;
    }> }>('/admin.php?action=private-events'),

  // Deactivate a private event
  deactivateEvent: (id: number) =>
    request<{ success: boolean; message: string }>(`/admin.php?action=deactivate-event&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({}),
    }),

  // Get user list for admin
  getUsers: (search?: string, filter?: string) =>
    request<{ users: AdminUser[] }>(`/admin.php?action=users&search=${encodeURIComponent(search || '')}&filter=${filter || 'all'}`),

  // Block user
  blockUser: (userId: number) =>
    request<{ success: boolean; message: string }>('/admin.php?action=block-user', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  // Delete user
  deleteUser: (userId: number) =>
    request<{ success: boolean; message: string }>('/admin.php?action=delete-user', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  // Get analytics data
  getAnalytics: (period?: string) =>
    request<{
      analytics: {
        userGrowth: Array<{ date: string; count: number }>;
        topCities: Array<{ city: string; count: number }>;
        peakMonths: Array<{ month: string; count: number }>;
        featureUsage: Array<{ event_type: string; count: number }>;
        premiumRatio: { premium: number; free: number };
      };
    }>(`/admin.php?action=analytics&period=${period || 'daily'}`),

  // Get support tickets
  getTickets: (status?: string) =>
    request<{ tickets: SupportTicket[] }>(`/admin.php?action=tickets&status=${status || 'open'}`),

  // Resolve ticket
  resolveTicket: (ticketId: number) =>
    request<{ success: boolean; message: string }>('/admin.php?action=resolve-ticket', {
      method: 'POST',
      body: JSON.stringify({ ticket_id: ticketId }),
    }),

  // Get feature toggles
  getFeatures: () =>
    request<{ features: FeatureToggle[] }>('/admin.php?action=features'),

  // Update feature toggle
  updateFeature: (id: number, is_enabled: number) =>
    request<{ success: boolean; message: string }>('/admin.php?action=toggle-feature', {
      method: 'POST',
      body: JSON.stringify({ id, is_enabled }),
    }),

  getLoginLogs: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const q = new URLSearchParams({ action: 'login-logs' });
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    return request<{
      logs: Array<{
        id: number;
        user_id: number | null;
        email: string | null;
        role: string | null;
        ip_address: string | null;
        user_agent: string | null;
        status: 'success' | 'failed' | 'blocked';
        created_at: string;
      }>;
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/admin.php?${q.toString()}`);
  },
};

export interface AdminUser {
  id: number;
  name: string;
  city?: string;
  phone?: string;
  created_at: string;
  function_count: number;
  is_blocked?: number;
}

export interface SupportTicket {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

export interface FeatureToggle {
  id: number;
  feature_key: string;
  is_enabled: number;
  description: string;
}
