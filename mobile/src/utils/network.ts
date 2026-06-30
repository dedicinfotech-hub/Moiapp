import { API_BASE } from '../api/client';

export async function isOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE}/events.php`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.status > 0;
  } catch {
    return false;
  }
}
