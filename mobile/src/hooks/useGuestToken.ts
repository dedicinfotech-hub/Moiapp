import { useRoute } from '@react-navigation/native';
import { Platform } from 'react-native';

function tokenFromPath(pathname: string): string {
  const match = pathname.match(/\/g\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
}

/** Resolve guest token from route params or the /g/:token URL (web deep links). */
export function useGuestToken(): string {
  const route = useRoute();
  const params = (route.params || {}) as { token?: string };
  if (params.token) return params.token;

  if (Platform.OS === 'web' && typeof globalThis.location !== 'undefined') {
    const fromUrl = tokenFromPath(globalThis.location.pathname);
    if (fromUrl) return fromUrl;
  }

  return '';
}
