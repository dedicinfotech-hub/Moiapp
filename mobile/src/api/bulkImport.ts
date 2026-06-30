import { multipartUpload } from './upload';

export async function bulkImportCSV(
  eventId: number,
  file: { uri: string; name: string; type: string }
): Promise<{ success: boolean; imported: number; errors?: string[]; message?: string }> {
  return multipartUpload(
    '/bulk-import.php?action=csv',
    { event_id: String(eventId) },
    'csv_file',
    file
  ) as Promise<{ success: boolean; imported: number; errors?: string[]; message?: string }>;
}
