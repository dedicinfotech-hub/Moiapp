import { Platform } from 'react-native';

export function isPublicEventPath(pathname: string): boolean {
  return /\/e\/[^/]+/.test(pathname);
}

export function isPublicEventsListPath(pathname: string): boolean {
  return /\/events\/?$/.test(pathname);
}

/** True when opened via /e/:slug or /events (public browse URLs). */
export function useIsPublicLink(): boolean {
  if (Platform.OS === 'web' && typeof globalThis.location !== 'undefined') {
    const path = globalThis.location.pathname;
    return isPublicEventPath(path) || isPublicEventsListPath(path);
  }
  return false;
}
