// ── API base URL ──────────────────────────────────────────────────────────────
// LOCAL DEV  (npm run dev):
//   Both env vars are empty. BASE = '/api'
//   Next.js dev server rewrites /api/* → http://localhost:8888/MoiApp/api/*
//   No CORS issues — browser only talks to localhost:3000.
//
// PRODUCTION (npm run build + static export):
//   NEXT_PUBLIC_API_URL = https://dsitesai.com/moiapp/api
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

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error || 'Request failed';
    // Show toast notification for errors (client-side only)
    if (typeof window !== 'undefined') {
      toast.error(errorMsg);
    }
    throw new Error(errorMsg);
  }
  return data as T;
}

// Helper to show success toast
export function showSuccess(message: string) {
  if (typeof window !== 'undefined') {
    toast.success(message);
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
    request<{ token: string; user: User; requires_otp?: boolean }>('/auth.php?action=login', {
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
};

// ── Events ────────────────────────────────────────────────────────────────────
export const featuresApi = {
  list: () => request<{ toggles: { feature_key: string; is_enabled: number; description: string }[] }>('/features.php'),
  update: (feature_key: string, is_enabled: number) =>
    request<{ success: boolean }>('/features.php', {
      method: 'PUT',
      body: JSON.stringify({ feature_key, is_enabled }),
    }),
};

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
  city?: string;
  venue?: string;
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
  city?: string | null;
  company?: string | null;
  occupation?: string | null;
  amount: number;
  gift_type: 'cash' | 'gold' | 'silver' | 'gift';
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
