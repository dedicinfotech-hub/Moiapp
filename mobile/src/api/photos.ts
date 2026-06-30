import { request } from './client';
import { multipartUpload, type UploadFile } from './upload';

export interface Photo {
  id: number;
  event_id: number;
  s3_key: string;
  s3_url: string;
  caption: string;
  uploaded_at: string;
}

export const photosApi = {
  list: (eventId: number) => request<Photo[]>(`/photos.php?event_id=${eventId}`),

  upload: (eventId: number, file: UploadFile, caption?: string) => {
    const fields: Record<string, string> = { event_id: String(eventId) };
    if (caption) fields.caption = caption;
    return multipartUpload('/photos.php', fields, 'photo', file) as Promise<{ id: number; url: string }>;
  },

  delete: (id: number) =>
    request<{ success: boolean }>(`/photos.php?id=${id}`, { method: 'DELETE' }),
};
