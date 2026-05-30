'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { eventsApi, Event } from '@/lib/api';

export default function EventsListingPage() {
  const [events,  setEvents]  = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    eventsApi.listPublic().then(setEvents).finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = e.bride_name.toLowerCase().includes(q) ||
                        e.groom_name.toLowerCase().includes(q) ||
                        (e.venue || '').toLowerCase().includes(q);
    const matchFilter = filter === 'all'
      ? true
      : filter === 'upcoming'
      ? e.wedding_date >= today
      : e.wedding_date < today;
    return matchSearch && matchFilter;
  });

  const upcoming = events.filter((e) => e.wedding_date >= today).length;
  const past     = events.filter((e) => e.wedding_date <  today).length;

  return (
    <div className="bg-[#FAFAFA] text-[#101010] min-h-screen">

      {/* ── Header banner ── */}
      <div className="bg-white border-b border-[#E8E8E8]">
        <div className="max-w-[88%] mx-auto py-10">
          <div className="text-center mb-7">
            <p className="text-xs font-bold text-[#FFC107] uppercase tracking-widest mb-2">MoiApp</p>
            <h1 className="text-2xl lg:text-4xl font-extrabold text-[#101010] mb-2">Wedding Events</h1>
            <p className="text-[#666] text-sm">Browse weddings · Give Moi · Celebrate together</p>
          </div>

          {/* Search */}
          <div className="relative max-w-lg mx-auto mb-5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="2"/><path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or venue…"
              className="w-full border-2 border-[#E8E8E8] bg-white rounded-2xl pl-11 pr-4 py-3 text-sm text-[#101010] placeholder-[#bbb] focus:outline-none focus:border-[#FFC107] transition-colors font-medium"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center justify-center gap-2">
            {([
              { id: 'all',      label: `All (${events.length})` },
              { id: 'upcoming', label: `Upcoming (${upcoming})` },
              { id: 'past',     label: `Past (${past})` },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  filter === t.id
                    ? 'bg-[#FFC107] text-black'
                    : 'bg-[#F5F5F5] text-[#666] hover:bg-[#EEEEEE]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-[88%] mx-auto py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
            <p className="text-[#666] text-sm">Loading events…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">💍</div>
            <h2 className="text-lg font-bold text-[#444] mb-2">No events found</h2>
            <p className="text-[#666] text-sm mb-6">Be the first to list your wedding!</p>
            <Link href="/register" className="bg-[#FFC107] text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#E6AC00] transition-colors">
              List Your Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((ev) => (
              <EventCard key={ev.id} event={ev} isPast={ev.wedding_date < today} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, isPast }: { event: Event; isPast: boolean }) {
  const date     = new Date(event.wedding_date);
  const day      = date.toLocaleDateString('en-IN', { day: '2-digit' });
  const mon      = date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
  const year     = date.getFullYear();
  const dow      = date.toLocaleDateString('en-IN', { weekday: 'long' });
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Link href={`/e/${event.slug}`} className="group block">
      <div className={`bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${isPast ? 'border-[#E8E8E8] opacity-80' : 'border-[#E8E8E8] hover:border-[#FFC107]'}`}>

        {/* Cover image */}
        <div className="relative h-44 bg-gradient-to-br from-[#FFF8E1] to-[#FFFCF5] overflow-hidden">
          {event.cover_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.cover_photo}
              alt={`${event.bride_name} & ${event.groom_name}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <span className="text-5xl">💍</span>
              <p className="text-[#B8860B] text-xs font-semibold">Wedding Event</p>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Date badge */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl shadow px-2.5 py-1.5 text-center min-w-[46px]">
            <p className="text-[#FFC107] text-[10px] font-extrabold leading-none">{mon}</p>
            <p className="text-[#101010] text-lg font-extrabold leading-tight">{day}</p>
            <p className="text-[#666] text-[10px] leading-none">{year}</p>
          </div>

          {/* Status badge */}
          {!isPast && daysLeft >= 0 && daysLeft <= 7 && (
            <div className="absolute top-3 right-3 bg-[#FFC107] text-black text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow">
              {daysLeft === 0 ? '🎉 Today!' : `${daysLeft}d left`}
            </div>
          )}
          {isPast && (
            <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
              Completed
            </div>
          )}

          {/* Name overlay */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-extrabold text-white text-base leading-tight drop-shadow">
              {event.bride_name} &amp; {event.groom_name}
            </h3>
            <p className="text-white/75 text-xs mt-0.5">{dow}</p>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          {event.venue && (
            <p className="text-[#555] text-xs flex items-center gap-1.5 mb-3 truncate">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#888"/></svg>
              {event.venue}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-[#666]">
                <span>👥</span>
                <span className="font-semibold">{event.guest_count || 0}</span>
              </div>
              {Number(event.total_moi) > 0 && (
                <div className="text-xs font-bold text-[#101010]">
                  ₹{Number(event.total_moi).toLocaleString('en-IN')}
                </div>
              )}
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
              isPast
                ? 'bg-[#F5F5F5] text-[#666]'
                : 'bg-[#FFFCF5] text-[#B8860B] border border-[#FFE082] group-hover:bg-[#FFC107] group-hover:text-black group-hover:border-[#FFC107]'
            }`}>
              {isPast ? 'View →' : 'Give Moi →'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
