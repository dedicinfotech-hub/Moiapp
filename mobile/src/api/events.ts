import { request } from './client';
import { multipartUpload } from './upload';
import type { Event } from './types';

export const eventsApi = {
  listPublic: () => request<Event[]>('/events.php?public=1'),
  list: () => request<Event[]>('/events.php'),
  get: (slug: string) => request<Event>(`/events.php?slug=${slug}`),
  getByGuestToken: (token: string) =>
    request<Event>(`/events.php?guest_token=${encodeURIComponent(token)}`),

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

  create: (body: Partial<Event> & { approval_status?: string }) =>
    request<{ id: number; slug: string; event_mode?: string; approval_status?: string }>(
      '/events.php',
      { method: 'POST', body: JSON.stringify(body) }
    ),

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

  uploadCover: (eventId: number, file: { uri: string; name: string; type: string }) =>
    multipartUpload('/events.php?action=cover', { event_id: String(eventId) }, 'cover', file) as Promise<{
      success: boolean;
      url: string;
    }>,
};
