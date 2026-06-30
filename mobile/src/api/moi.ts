import { request } from './client';
import type { MoiEntry, BreakdownItem } from './types';

export const moiApi = {
  list: (eventId: number) =>
    request<{ entries: MoiEntry[]; breakdown: BreakdownItem[] }>(
      `/moi.php?event_id=${eventId}`
    ),
  add: (body: Partial<MoiEntry> & { slug?: string; event_id?: number; guest_token?: string }) =>
    request<{ id: number }>('/moi.php', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<MoiEntry>) =>
    request<{ success: boolean }>(`/moi.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: (id: number) =>
    request<{ success: boolean }>(`/moi.php?id=${id}`, { method: 'DELETE' }),
};
