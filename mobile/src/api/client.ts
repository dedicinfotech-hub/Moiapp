import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'moi_token';
const isWeb = Platform.OS === 'web';

export const API_BASE: string =
  (Constants.expoConfig?.extra?.apiUrl as string) || 'https://dsitesai.com/moiapp/api';

/** Web app base URL (no /api suffix) */
export const APP_BASE_URL = API_BASE.replace(/\/api\/?$/, '');

export async function getToken(): Promise<string | null> {
  try {
    if (isWeb) {
      return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['X-Auth-Token'] = `Bearer ${token}`;

  const url = `${API_BASE}${path}${path.includes('?') ? '&' : '?'}_t=${Date.now()}`;
  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg =
      isJson && typeof data === 'object' && data !== null && 'error' in data
        ? (data as { error?: string }).error || 'Request failed'
        : typeof data === 'string'
          ? data
          : 'Request failed';
    throw new Error(errorMsg);
  }

  return (isJson ? data : { raw: data }) as T;
}
