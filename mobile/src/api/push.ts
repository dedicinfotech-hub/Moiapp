import { request } from './client';

export const pushApi = {
  register: (token: string, platform: string) =>
    request<{ success: boolean }>('/push.php', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    }),

  unregister: (token?: string) =>
    request<{ success: boolean }>('/push.php', {
      method: 'DELETE',
      body: JSON.stringify(token ? { token } : {}),
    }),
};
