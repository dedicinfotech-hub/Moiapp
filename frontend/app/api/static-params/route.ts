import { NextResponse } from 'next/server';

const PHP_BACKEND = 'http://localhost:8888/MoiApp/api';

export async function GET() {
  try {
    const [eventsRes, guestsRes] = await Promise.all([
      fetch(`${PHP_BACKEND}/events.php?public=1`),
      fetch(`${PHP_BACKEND}/moi.php?action=guest_tokens`),
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
