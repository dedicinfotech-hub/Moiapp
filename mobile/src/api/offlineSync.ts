import { request } from './client';
import type { OfflineMoiEntry } from '../store/offlineQueue';

export const offlineSyncApi = {
  sync: (entries: OfflineMoiEntry[]) =>
    request<{
      success: boolean;
      synced_count: number;
      failed_count: number;
      synced: Array<{ id: number; guest_name: string; client_id?: string | null }>;
      failed: Array<{ entry: unknown; reason: string }>;
    }>('/offline-sync.php', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    }),
};
