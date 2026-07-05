import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type AppLanguage = 'en' | 'ta' | 'hi';
export type AppFontSize = 'small' | 'medium' | 'large';

export interface AppSettings {
  notificationsEnabled: boolean;
  notifFunctionReminder: boolean;
  notifFunctionToday: boolean;
  notifReturnGift: boolean;
  notifEntrySaved: boolean;
  notifTime: string;
  language: AppLanguage;
  fontSize: AppFontSize;
}

const SETTINGS_KEY = 'moi_settings';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  notifFunctionReminder: true,
  notifFunctionToday: true,
  notifReturnGift: true,
  notifEntrySaved: true,
  notifTime: '09:00',
  language: 'en',
  fontSize: 'medium',
};

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(SETTINGS_KEY) ?? null;
  }
  try {
    return await SecureStore.getItemAsync(SETTINGS_KEY);
  } catch {
    return null;
  }
}

async function writeRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(SETTINGS_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(SETTINGS_KEY, value);
}

export async function loadAppSettings(): Promise<AppSettings> {
  const raw = await readRaw();
  if (!raw) return { ...DEFAULT_APP_SETTINGS };
  try {
    const parsed = { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) };
    if (!['en', 'ta', 'hi'].includes(parsed.language)) {
      parsed.language = DEFAULT_APP_SETTINGS.language;
    }
    return parsed;
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export async function saveAppSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadAppSettings();
  const next = { ...current, ...partial };
  await writeRaw(JSON.stringify(next));
  return next;
}
