import { multipartUpload } from './upload';
import { request } from './client';

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

export const invitationsApi = {
  list: (eventId: number) =>
    request<{ invitations: Invitation[] }>(`/invitations.php?action=list&event_id=${eventId}`),

  uploadCsv: (eventId: number, file: { uri: string; name: string; type: string }) =>
    multipartUpload('/invitations.php?action=csv', { event_id: String(eventId) }, 'csv_file', file) as Promise<{
      success: boolean;
      count: number;
      valid?: number;
      invalid?: number;
      total?: number;
      errors?: string[];
    }>,

  update: (id: number, status: string) =>
    request<{ success: boolean }>('/invitations.php?action=update', {
      method: 'PUT',
      body: JSON.stringify({ id, status }),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/invitations.php?action=delete&id=${id}`, { method: 'DELETE' }),
};
