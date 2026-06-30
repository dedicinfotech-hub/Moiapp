import { request } from './client';
import type { Notification } from './types';

export const notificationsApi = {
  list: () =>
    request<{ notifications: Notification[]; unread_count: number }>('/notifications.php'),

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
