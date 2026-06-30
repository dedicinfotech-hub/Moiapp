import { Alert } from 'react-native';
import { moiApi } from '../api';
import type { MoiEntry } from '../api/types';
import { enqueueOfflineEntry } from '../store/offlineQueue';
import { isOnline } from './network';

type OfflinePayload = Parameters<typeof enqueueOfflineEntry>[0];

function isNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('network') ||
    m.includes('fetch') ||
    m.includes('timeout') ||
    m.includes('failed to fetch') ||
    m.includes('connection')
  );
}

export async function saveMoiWithOfflineFallback(
  onlinePayload: Partial<MoiEntry>,
  offlinePayload: OfflinePayload,
  onOfflineSaved?: () => void
): Promise<'online' | 'offline'> {
  const online = await isOnline();
  if (!online) {
    await enqueueOfflineEntry(offlinePayload);
    Alert.alert(
      'Saved offline',
      'No connection. Entry queued and will sync when you are back online.'
    );
    onOfflineSaved?.();
    return 'offline';
  }

  try {
    await moiApi.add(onlinePayload);
    return 'online';
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save';
    if (isNetworkError(msg)) {
      await enqueueOfflineEntry(offlinePayload);
      Alert.alert(
        'Saved offline',
        'Connection lost. Entry queued and will sync when you are back online.'
      );
      onOfflineSaved?.();
      return 'offline';
    }
    throw e;
  }
}
