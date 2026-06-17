import { NextResponse } from 'next/server';
import { API_BASE } from '@/lib/api';

export async function GET() {
  try {
    const [eventsRes, guestsRes] = await Promise.all([
      fetch(`${API_BASE}/events.php?public=1`),
      fetch(`${API_BASE}/moi.php?action=guest_tokens`),
    ]);

    const events = await eventsRes.json();
    const guests = await guestsRes.json();

    const slugs: string[] = Array.isArray(events) ? events
      .map((e: { slug?: string }) => e.slug)
      .filter((slug): slug is string => Boolean(slug))
  : [];

  const tokens: string[] = Array.isArray(guests) ? guests
      .map((g: { token?: string }) => g.token)
      .filter((token): token is string => !!token)
  : [];

    return NextResponse.json({ slugs, tokens });
  } catch {
    return NextResponse.json({ slugs: [], tokens: [] }, { status: 500 });
  }
}
