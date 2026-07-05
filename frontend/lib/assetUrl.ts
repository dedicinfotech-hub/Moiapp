/** Public-folder and static asset paths with optional basePath prefix. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function assetUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}

/** Cover/upload URLs from API — use same-host /uploads path (avoids www vs apex 403). */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const match = url.match(/\/uploads\/.+$/i);
  if (match) return `${BASE_PATH}${match[0]}`;
  return url.replace('://www.moipassbook.com', '://moipassbook.com');
}
