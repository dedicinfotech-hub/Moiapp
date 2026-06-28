'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { eventsApi, Event } from '@/lib/api';

export default function EventsListingPage() {
  const [events,  setEvents]  = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<'all' | 'upcoming' | 'past'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    eventsApi.listPublic()
      .then((evs) => {
        // Ensure we always have an array
        const eventList = Array.isArray(evs) ? evs : [];
        setEvents(eventList);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const today = new Date().toISOString().split('T')[0];

  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = (e.bride_name || '').toLowerCase().includes(q) ||
                        (e.groom_name || '').toLowerCase().includes(q) ||
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

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-tn-light text-tn-text min-h-screen pb-20 lg:pb-0">

      {/* ── Header banner ── */}
      <div className="bg-white border-b border-tn-border">
        <div className="max-w-[88%] mx-auto py-10">
          <div className="text-center mb-7">
            <p className="text-xs font-bold text-tn-yellow uppercase tracking-widest mb-2">MoiApp</p>
            <h1 className="text-2xl lg:text-4xl font-extrabold text-tn-text mb-2">Wedding Events</h1>
            <p className="text-tn-muted text-sm">Browse weddings · Give Moi · Celebrate together</p>
          </div>

          {/* Search */}
          <div className="relative max-w-lg mx-auto mb-5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tn-text-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="2"/><path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or venue…"
              className="w-full border-2 border-tn-border bg-white rounded-2xl pl-11 pr-4 py-3 text-sm text-tn-text placeholder-tn-text-secondary focus:outline-none focus:border-tn-yellow transition-colors font-medium"
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
                    ? 'bg-tn-yellow text-black'
                    : 'bg-tn-light-alt text-tn-muted hover:bg-tn-border transition-colors'
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
            <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
            <p className="text-tn-muted text-sm">Loading events…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="mb-4 text-tn-gold">
              <Icon name="wedding" size={44} />
            </div>
            <h2 className="text-lg font-bold text-tn-text mb-2">No events found</h2>
            <p className="text-tn-muted text-sm mb-6">Be the first to list your wedding!</p>
            <Link href="/register" className="bg-tn-yellow text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-tn-yellow-2 transition-colors">
              List Your Event
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedEvents.map((ev) => (
                <EventCard key={ev.id} event={ev} isPast={ev.wedding_date < today} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-tn-border px-4 py-4 bg-white mt-8 rounded-2xl shadow-sm">
                <div className="text-xs text-tn-text-secondary font-medium">
                  Showing <span className="font-semibold text-tn-text">{startIndex + 1}</span> to <span className="font-semibold text-tn-text">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-semibold text-tn-text">{totalItems}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-xl border border-tn-border text-xs font-semibold hover:bg-tn-light disabled:opacity-40 transition-colors text-tn-text-secondary bg-white disabled:pointer-events-none"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          currentPage === pageNum
                            ? 'bg-tn-yellow text-black border border-tn-yellow shadow-sm'
                            : 'border border-tn-border hover:bg-tn-light text-tn-text-secondary bg-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-xl border border-tn-border text-xs font-semibold hover:bg-tn-light disabled:opacity-40 transition-colors text-tn-text-secondary bg-white disabled:pointer-events-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
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
      <div className={`bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${isPast ? 'border-tn-border opacity-80' : 'border-tn-border hover:border-tn-yellow'}`}>

        {/* Cover image */}
        <div className="relative h-44 bg-gradient-to-br from-tn-gold-bg to-tn-yellow-bg overflow-hidden">
          {event.cover_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.cover_photo}
              alt={`${event.bride_name} & ${event.groom_name}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <span className="text-5xl text-tn-gold">
                <Icon name={event.event_type === 'birthday' ? 'gift' : 'wedding'} size={40} />
              </span>
              <p className="text-tn-gold text-xs font-semibold">
                {event.event_type === 'birthday' ? 'Birthday Event' : 'Wedding Event'}
              </p>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Date badge */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl shadow px-2.5 py-1.5 text-center min-w-[46px]">
            <p className="text-tn-yellow text-[10px] font-extrabold leading-none">{mon}</p>
            <p className="text-tn-text text-lg font-extrabold leading-tight">{day}</p>
            <p className="text-tn-muted text-[10px] leading-none">{year}</p>
          </div>

          {/* Status badge */}
          {!isPast && daysLeft >= 0 && daysLeft <= 7 && (
            <div className="absolute top-3 right-3 bg-tn-yellow text-black text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow">
              {daysLeft === 0 ? 'Today!' : `${daysLeft}d left`}
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
            <p className="text-tn-muted text-xs flex items-center gap-1.5 mb-3 truncate">
              <Icon name="map" size={11} />
              {event.venue}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-tn-muted">
              <Icon name="users" size={14} />
              <span className="font-medium"><strong className="font-bold text-tn-text">{event.guest_count || 0}</strong> guests registered</span>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
              isPast
                ? 'bg-tn-light-alt text-tn-muted'
                : 'bg-tn-yellow-bg text-tn-gold border border-tn-gold-border group-hover:bg-tn-yellow group-hover:text-black group-hover:border-tn-yellow'
            }`}>
              {isPast ? 'View →' : 'Give Moi →'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
