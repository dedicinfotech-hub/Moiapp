// ── API base URL ──────────────────────────────────────────────────────────────
// LOCAL DEV  (npm run dev):
//   Both env vars are empty. BASE = '/api'
//   Next.js dev server rewrites /api/* → http://localhost:8888/MoiApp/api/*
//   No CORS issues — browser only talks to localhost:3000.
//
// PRODUCTION (npm run build + static export):
//   NEXT_PUBLIC_API_URL = https://dsitesai.com/moiapp/api
//   Browser calls the PHP backend directly.
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
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    request<{ token: string; user: User }>('/auth.php?action=register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => request<{ user: User }>('/auth.php?action=me'),

  updateProfile: (body: Partial<User>) =>
    request<{ success: boolean; user: User }>('/auth.php?action=profile', {
      method: 'PUT',
      body: JSON.stringify(body),
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

  create: (body: Partial<Event>) =>
    request<{ id: number; slug: string }>('/events.php', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: Partial<Event>) =>
    request<{ success: boolean }>(`/events.php?id=${id}`, {
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
  event_type: 'wedding' | 'birthday' | 'engagement' | 'valakaappu' | 'housewarming' | 'custom';
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
  wedding_date: string;
  venue?: string;
  venue_latitude?: number;
  venue_longitude?: number;
  cover_photo: string | null;
  description?: string;
  is_active: number;
  created_at: string;
  guest_count?: number;
  total_moi?: number;
  stats?: { guest_count: number; total: number };
  creator_name?: string;
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
  amount: number;
  gift_type: 'cash' | 'gold' | 'gift';
  gold_weight?: number | null;
  gift_description?: string | null;
  relation: 'family' | 'friend' | 'colleague' | 'other';
  payment_mode: 'cash' | 'upi' | 'card' | 'cheque';
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
