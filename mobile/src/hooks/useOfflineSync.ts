import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { offlineSyncApi } from '../api/offlineSync';
import { getOfflineQueue, getOfflineQueueCount, removeOfflineEntries } from '../store/offlineQueue';
import { isOnline } from '../utils/network';

export function useOfflineSync(enabled = true) {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const refreshCount = useCallback(async () => {
    setPendingCount(await getOfflineQueueCount());
  }, []);

  const syncNow = useCallback(async () => {
    if (syncing) return { synced: 0 };
    const online = await isOnline();
    if (!online) return { synced: 0 };

    const queue = await getOfflineQueue();
    if (!queue.length) {
      setPendingCount(0);
      return { synced: 0 };
    }

    setSyncing(true);
    try {
      const res = await offlineSyncApi.sync(queue);
      const syncedIds = (res.synced || [])
        .map((s) => s.client_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
      if (syncedIds.length) {
        await removeOfflineEntries(syncedIds);
      } else if (res.failed_count === 0 && res.synced_count > 0) {
        await removeOfflineEntries(queue.map((e) => e.id));
      }
      await refreshCount();
      const msg =
        res.synced_count > 0
          ? `Synced ${res.synced_count} offline entr${res.synced_count === 1 ? 'y' : 'ies'}`
          : null;
      setLastMessage(msg);
      return { synced: res.synced_count };
    } catch {
      return { synced: 0 };
    } finally {
      setSyncing(false);
    }
  }, [syncing, refreshCount]);

  useEffect(() => {
    if (!enabled) return;
    refreshCount();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshCount();
        syncNow();
      }
    });
    syncNow();
    return () => sub.remove();
  }, [enabled, refreshCount, syncNow]);

  return { pendingCount, syncing, lastMessage, syncNow, refreshCount };
}
