import * as FileSystem from 'expo-file-system';
import type { MoiEntry } from '../api/types';

export interface OfflineMoiEntry {
  id: string;
  event_id: number;
  event_name?: string;
  guest_name: string;
  phone?: string;
  city?: string;
  company?: string;
  occupation?: string;
  amount: number;
  gift_type: MoiEntry['gift_type'];
  gold_weight?: number;
  gift_description?: string;
  approximate_value?: number;
  relation: MoiEntry['relation'];
  payment_mode: MoiEntry['payment_mode'];
  upi_ref_id?: string;
  other_payment_details?: string;
  note: string;
  entered_by: string;
  created_at: string;
}

const QUEUE_FILE = `${FileSystem.documentDirectory}moi_offline_queue.json`;

async function readQueue(): Promise<OfflineMoiEntry[]> {
  try {
    const info = await FileSystem.getInfoAsync(QUEUE_FILE);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(QUEUE_FILE);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(entries: OfflineMoiEntry[]): Promise<void> {
  await FileSystem.writeAsStringAsync(QUEUE_FILE, JSON.stringify(entries));
}

export async function getOfflineQueue(): Promise<OfflineMoiEntry[]> {
  return readQueue();
}

export async function getOfflineQueueCount(): Promise<number> {
  const q = await readQueue();
  return q.length;
}

export async function enqueueOfflineEntry(
  entry: Omit<OfflineMoiEntry, 'id' | 'created_at'>
): Promise<OfflineMoiEntry> {
  const queue = await readQueue();
  const item: OfflineMoiEntry = {
    ...entry,
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
  };
  queue.push(item);
  await writeQueue(queue);
  return item;
}

export async function removeOfflineEntries(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const set = new Set(ids);
  const queue = await readQueue();
  await writeQueue(queue.filter((e) => !set.has(e.id)));
}
