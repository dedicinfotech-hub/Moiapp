import { request } from './client';

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
