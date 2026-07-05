export const RETURN_TO_PARAM = 'returnTo';

/** Only allow in-app relative paths as post-login redirects. */
export function sanitizeReturnTo(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  if (raw.startsWith('/login') || raw.startsWith('/register')) return null;
  return raw;
}

export function buildLoginUrl(returnTo?: string): string {
  const safe = sanitizeReturnTo(returnTo);
  if (!safe) return '/login';
  return `/login?${RETURN_TO_PARAM}=${encodeURIComponent(safe)}`;
}

export function postLoginPath(returnTo: string | null | undefined, fallback = '/dashboard'): string {
  return sanitizeReturnTo(returnTo) ?? fallback;
}
