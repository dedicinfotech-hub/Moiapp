import { useEffect } from 'react';
import { eventsApi, returnGiftsApi } from '../api';
import { useAppSettings } from '../context/AppSettingsContext';
import { scheduleEventReminders } from '../services/localNotifications';

export function useEventReminders(enabled = true) {
  const { settings } = useAppSettings();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const [events, overdueRes] = await Promise.all([
          eventsApi.list(),
          returnGiftsApi.listOverdue().catch(() => ({ overdue: [] })),
        ]);
        if (!cancelled) {
          await scheduleEventReminders(events, settings, overdueRes.overdue || []);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    settings.notificationsEnabled,
    settings.notifFunctionReminder,
    settings.notifFunctionToday,
    settings.notifReturnGift,
    settings.notifTime,
  ]);
}
