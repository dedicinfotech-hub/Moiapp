// In production (static export) NEXT_PUBLIC_API_URL is the full PHP backend URL.
// In local dev it's empty and we use the Next.js rewrite proxy (/api/*).
const BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL          // e.g. https://dsitesai.com/moiapp/api
  : (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/api'; // e.g. /api (proxied by Next.js)

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
}

export interface Event {
  id: number;
  user_id: number;
  slug: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  venue: string;
  cover_photo: string | null;
  description: string;
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
  amount: number;
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
