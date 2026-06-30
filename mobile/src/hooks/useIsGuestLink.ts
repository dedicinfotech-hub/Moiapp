import { Platform } from 'react-native';

export function isGuestLinkPath(pathname: string): boolean {
  return /\/g\/[^/]+/.test(pathname);
}

/** True when the app was opened via a /g/:token guest payment URL. */
export function useIsGuestLink(): boolean {
  if (Platform.OS === 'web' && typeof globalThis.location !== 'undefined') {
    return isGuestLinkPath(globalThis.location.pathname);
  }
  return false;
}
