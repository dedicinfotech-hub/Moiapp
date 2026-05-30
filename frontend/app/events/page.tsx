'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { eventsApi, Event } from '@/lib/api';

export default function EventsListingPage() {
  const [events, setEvents]   = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    eventsApi.listPublic().then(setEvents).finally(() => setLoading(false));
  }, []);

  const today    = new Date().toISOString().split('T')[0];
  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    return e.bride_name.toLowerCase().includes(q) || e.groom_name.toLowerCase().includes(q) || (e.venue || '').toLowerCase().includes(q);
  });
  const upcoming = filtered.filter((e) => e.wedding_date >= today);
  const past     = filtered.filter((e) => e.wedding_date < today);

  return (
    <div className="bg-white text-[#101010] min-h-screen">

      {/* Banner */}
      <div className="border-b border-[#E8E8E8] py-10 px-4">
        <div className="max-w-[80%] mx-auto text-center">
          <h1 className="text-2xl lg:text-3xl font-bold text-[#101010] mb-2">Wedding Events</h1>
          <p className="text-[#666666] text-sm mb-6">Browse weddings · Give Moi · Celebrate together</p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11.5" cy="11.5" r="9.5" stroke="#666666" strokeWidth="1.5"/><path d="M18.5 18.5L22 22" stroke="#666666" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or venue…"
              className="w-full border border-[#cccccc] bg-[#fafafa] rounded-2xl pl-11 pr-4 py-2.5 text-sm text-[#101010] placeholder-[#666666] focus:outline-none focus:border-[#c3c3c3] font-medium"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[80%] mx-auto py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
            <p className="text-[#666666] text-sm">Loading events…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">💍</div>
            <h2 className="text-lg font-semibold text-[#444444] mb-2">No events found</h2>
            <p className="text-[#666666] text-sm mb-6">Be the first to list your wedding!</p>
            <Link href="/register" className="bg-[#FFC107] text-[#000000] px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#E6AC00] transition-colors">
              List Your Event
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-bold text-[#101010]">Upcoming Weddings</h2>
                  <span className="bg-[#FFFCF5] border border-[#FFE082] text-[#B8860B] text-xs font-semibold px-2.5 py-1 rounded-full">{upcoming.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {upcoming.map((ev) => <EventCard key={ev.id} event={ev} />)}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-bold text-[#666666]">Past Weddings</h2>
                  <span className="bg-[#F5F5F5] text-[#666666] text-xs font-semibold px-2.5 py-1 rounded-full">{past.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-70">
                  {past.map((ev) => <EventCard key={ev.id} event={ev} isPast />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, isPast = false }: { event: Event; isPast?: boolean }) {
  const date     = new Date(event.wedding_date);
  const day      = date.toLocaleDateString('en-IN', { day: '2-digit' });
  const mon      = date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
  const year     = date.getFullYear();
  const dow      = date.toLocaleDateString('en-IN', { weekday: 'short' });
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Link href={`/e/${event.slug}`} className="group block">
      <div className="bg-white border border-[#E8E8E8] rounded-xl overflow-hidden hover:border-[#FFC107] hover:shadow-md transition-all">

        {/* Cover / placeholder */}
        <div className="relative h-36 bg-[#FFFCF5] flex items-center justify-center overflow-hidden">
          {event.cover_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.cover_photo} alt="cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-1">💍</div>
              <p className="text-[#B8860B] text-xs font-semibold">Wedding</p>
            </div>
          )}

          {/* Date badge */}
          <div className="absolute top-3 left-3 bg-white rounded-xl shadow-sm px-3 py-1.5 text-center min-w-[52px] border border-[#E8E8E8]">
            <p className="text-[#FFC107] text-xs font-bold leading-none">{mon}</p>
            <p className="text-[#101010] text-xl font-extrabold leading-tight">{day}</p>
            <p className="text-[#666666] text-xs leading-none">{year}</p>
          </div>

          {/* Status badge */}
          {!isPast && daysLeft >= 0 && daysLeft <= 7 && (
            <div className="absolute top-3 right-3 bg-[#FFC107] text-[#000000] text-xs font-bold px-2.5 py-1 rounded-full">
              {daysLeft === 0 ? 'Today!' : `${daysLeft}d left`}
            </div>
          )}
          {isPast && (
            <div className="absolute top-3 right-3 bg-[#F5F5F5] text-[#666666] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#E8E8E8]">
              Completed
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-[#101010] text-base leading-tight">
            {event.bride_name} &amp; {event.groom_name}
          </h3>
          <p className="text-[#666666] text-xs mt-1">{dow}, {day} {mon} {year}</p>
          {event.venue && (
            <p className="text-[#444444] text-xs mt-1 flex items-center gap-1 truncate">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 11.87C12.5 11.87 12.92 11.69 13.27 11.33C13.62 10.98 13.8 10.55 13.8 10.06C13.8 9.56 13.62 9.13 13.27 8.78C12.91 8.43 12.49 8.25 11.99 8.25C11.49 8.25 11.07 8.43 10.71 8.78C10.36 9.14 10.18 9.56 10.18 10.06C10.18 10.56 10.36 10.98 10.72 11.34C11.07 11.69 11.5 11.87 12 11.87ZM12 19.51C13.95 17.76 15.45 16.08 16.48 14.47C17.52 12.87 18.04 11.46 18.04 10.25C18.04 8.43 17.46 6.93 16.3 5.75C15.14 4.58 13.71 3.99 12 3.99C10.28 3.99 8.84 4.58 7.68 5.75C6.52 6.93 5.94 8.43 5.94 10.25C5.94 11.46 6.46 12.87 7.5 14.47C8.54 16.08 10.04 17.76 12 19.51Z" fill="#444444"/></svg>
              {event.venue}
            </p>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F5F5F5]">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#666666]">👥 {event.guest_count || 0}</span>
              {Number(event.total_moi) > 0 && (
                <span className="text-xs text-[#444444] font-semibold">₹{Number(event.total_moi).toLocaleString('en-IN')}</span>
              )}
            </div>
            <span className="text-xs border border-[#FFC107] text-[#B8860B] bg-[#FFFCF5] px-2.5 py-1 rounded-full font-semibold group-hover:bg-[#FFC107] group-hover:text-[#000000] transition-colors">
              Give Moi →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
