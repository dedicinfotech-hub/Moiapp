/** Remember last email login (convenience only — not auto-login). */
export const LAST_EMAIL_KEY = 'moi_last_email';

export function getRememberedEmail(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LAST_EMAIL_KEY)?.trim() ?? '';
}

export function rememberEmail(email: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = email.trim();
  if (trimmed) localStorage.setItem(LAST_EMAIL_KEY, trimmed);
}

const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/otp-verification',
  '/profile-setup',
  '/splash',
  '/g/',
  '/e/',
  '/help-center',
  '/privacy-policy',
  '/terms-of-service',
  '/contact',
];

/** Redirect to login when session expires on protected pages only. */
export function shouldRedirectToLogin(pathname: string): boolean {
  if (pathname === '/') return false;
  return !PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

/** Login/register attempts return 401 normally — do not treat as session expiry. */
export function isAuthAttemptPath(path: string): boolean {
  return (
    path.includes('action=login') ||
    path.includes('action=register') ||
    path.includes('action=verify-otp') ||
    path.includes('action=send-otp') ||
    path.includes('action=forgot-password') ||
    path.includes('action=reset-password')
  );
}
