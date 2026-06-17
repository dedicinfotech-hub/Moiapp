import { NextRequest, NextResponse } from 'next/server';
import { API_BASE } from '@/lib/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get('event_id') || '';
  const phpUrl = `${API_BASE}/organizers.php?event_id=${eventId}`;

  try {
    const token = request.headers.get('x-auth-token') || request.headers.get('authorization') || '';
    
    const phpRes = await fetch(phpUrl, {
      headers: {
        'X-Auth-Token': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await phpRes.json();
    return NextResponse.json(data, { status: phpRes.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch organizers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || '';
  const phpUrl = `${API_BASE}/organizers.php?action=${action}`;

  try {
    const body = await request.json();
    const token = request.headers.get('x-auth-token') || request.headers.get('authorization') || '';
    
    const phpRes = await fetch(phpUrl, {
      method: 'POST',
      headers: {
        'X-Auth-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await phpRes.json();
    return NextResponse.json(data, { status: phpRes.status });
  } catch {
    return NextResponse.json({ error: 'Failed to add organizer' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id') || '';
  const phpUrl = `${API_BASE}/organizers.php?id=${id}`;

  try {
    const token = request.headers.get('x-auth-token') || request.headers.get('authorization') || '';
    
    const phpRes = await fetch(phpUrl, {
      method: 'DELETE',
      headers: {
        'X-Auth-Token': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await phpRes.json();
    return NextResponse.json(data, { status: phpRes.status });
  } catch {
    return NextResponse.json({ error: 'Failed to remove organizer' }, { status: 500 });
  }
}
