import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { pushApi } from '../api/push';
import { requestNotificationPermissions } from './localNotifications';

let cachedToken: string | null = null;

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  try {
    const result = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    cachedToken = result.data;
    return cachedToken;
  } catch {
    return null;
  }
}

export async function registerPushTokenWithServer(): Promise<void> {
  const token = await getExpoPushToken();
  if (!token) return;
  await pushApi.register(token, Platform.OS);
}

export async function unregisterPushTokenFromServer(): Promise<void> {
  try {
    await pushApi.unregister(cachedToken || undefined);
  } catch {
    // ignore
  }
  cachedToken = null;
}
