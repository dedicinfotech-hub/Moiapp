import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_BASE, getToken, request } from './client';

export async function exportCSV(eventId: number, eventName?: string): Promise<void> {
  const token = await getToken();
  const url = `${API_BASE}/export.php?event_id=${eventId}&format=csv&_t=${Date.now()}`;
  const fileName = `moi-export-${eventId}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers: token ? { 'X-Auth-Token': `Bearer ${token}` } : {},
  });

  if (result.status !== 200) {
    throw new Error('Failed to export CSV');
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'text/csv',
      dialogTitle: eventName ? `Export ${eventName}` : 'Export Moi CSV',
    });
  }
}

export async function emailPDF(eventId: number): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/pdf.php?event_id=${eventId}`);
}
