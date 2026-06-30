import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Event } from '../api/types';
import type { ReturnGift } from '../api/returnGifts';
import type { AppSettings } from '../utils/settingsStorage';
import { getEventDisplayName } from '../utils/format';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function parseTime(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map((v) => parseInt(v, 10));
  return { hour: Number.isFinite(h) ? h : 9, minute: Number.isFinite(m) ? m : 0 };
}

function eventDateAtTime(isoDate: string, hour: number, minute: number): Date {
  const d = new Date(isoDate);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export async function scheduleEventReminders(
  events: Event[],
  settings: AppSettings,
  overdueReturns: ReturnGift[] = []
): Promise<void> {
  if (Platform.OS === 'web' || !settings.notificationsEnabled) return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  const { hour, minute } = parseTime(settings.notifTime);
  const now = Date.now();

  for (const event of events) {
    if (!event.wedding_date) continue;
    const title = getEventDisplayName(event);

    if (settings.notifFunctionReminder) {
      const threeDays = eventDateAtTime(event.wedding_date, hour, minute);
      threeDays.setDate(threeDays.getDate() - 3);
      if (threeDays.getTime() > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Function in 3 days',
            body: `${title} is coming up in 3 days.`,
            data: { event_id: event.id, type: 'reminder' },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: threeDays },
        });
      }
    }

    if (settings.notifFunctionToday) {
      const today = eventDateAtTime(event.wedding_date, hour, minute);
      if (today.getTime() > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Function today!',
            body: `${title} is today. All the best!`,
            data: { event_id: event.id, type: 'function_date' },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: today },
        });
      }
    }
  }

  if (settings.notifReturnGift && overdueReturns.length > 0) {
    const count = overdueReturns.length;
    const first = overdueReturns[0];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Overdue return gifts',
        body:
          count === 1
            ? `Return gift for ${first.guest_name} is past due. Please follow up.`
            : `You have ${count} overdue return gifts. Please follow up.`,
        data: { type: 'return_gift' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 2,
        hour,
        minute,
      },
    });
  }
}

export async function showEntrySavedNotification(title: string, settings: AppSettings) {
  if (Platform.OS === 'web' || !settings.notificationsEnabled || !settings.notifEntrySaved) return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;
  await Notifications.presentNotificationAsync({
    title: 'Moi entry saved',
    body: title,
  });
}
