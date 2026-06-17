'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon, { type IconName } from '@/components/ui/Icon';
import { Event, eventsApi, exportCSV, emailPDF, showSuccess, showError } from '@/lib/api';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import EventStatusBadges from '@/components/EventStatusBadges';
import { canAddMoi, showEventQr } from '@/lib/eventHelpers';

interface ModuleEventsProps {
  events: Event[];
  onRefresh: () => void;
  onNewEvent: () => void;
  onEdit: (ev: Event) => void;
}

export default function ModuleEvents({
  events, onRefresh, onNewEvent, onEdit,
}: ModuleEventsProps) {
  const [search,   setSearch]   = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);
  const itemsPerPage = 10;

  const getEventIcon = (eventType: string): IconName => {
    const icons: Record<string, IconName> = {
      wedding: 'venue',
      birthday: 'gift',
      engagement: 'wedding',
      valakaappu: 'sparkle',
      housewarming: 'venue',
      graduation: 'sparkle',
      custom: 'sparkle',
    };
    return icons[eventType] || 'sparkle';
  };

  const getEventDisplayName = (ev: Event) => {
    const typeLabels: Record<string, string> = {
      wedding: 'Wedding',
      birthday: 'Birthday',
      engagement: 'Engagement',
      valakaappu: 'Valakaappu',
      housewarming: 'Housewarming',
      graduation: 'Graduation',
      custom: ev.custom_title || 'Custom Event',
    };
    const typeName = typeLabels[ev.event_type] || 'Event';
    const dateStr = ev.wedding_date
      ? new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    return `${typeName} - ${dateStr}`.trim();
  };

  const filtered = events.filter((ev) =>
    `${ev.bride_name} ${ev.groom_name} ${ev.venue} ${ev.city || ''} ${ev.custom_title || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try { await eventsApi.delete(id); onRefresh(); }
    finally { setDeleting(null); setShowConfirmDelete(null); }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="w-full sm:w-60 border border-tn-border rounded-lg pl-9 pr-3 py-2 text-sm text-tn-text placeholder-tn-muted focus:outline-none focus:border-tn-yellow transition-colors"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tn-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="2"/>
              <path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
        </div>
        <button
          onClick={onNewEvent}
          className="flex items-center gap-1.5 bg-tn-yellow text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-tn-yellow-2 transition-colors whitespace-nowrap"
        >
          <Icon name="plus" size={14} />
          New Event
        </button>
      </div>


      {/* Table card */}
      <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-tn-muted text-sm">
            {events.length === 0 ? (
              <>No events yet.{' '}<button onClick={onNewEvent} className="text-tn-yellow font-semibold hover:underline">Create one →</button></>
            ) : 'No results found.'}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-tn-border bg-tn-light text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-tn-muted uppercase tracking-wide">Event</th>
                    <th className="px-4 py-3 text-xs font-semibold text-tn-muted uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-tn-muted uppercase tracking-wide hidden lg:table-cell">Venue</th>
                    <th className="px-4 py-3 text-xs font-semibold text-tn-muted uppercase tracking-wide text-center">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-tn-muted uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tn-border">
                  {paginatedEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-tn-light transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-tn-yellow-bg border border-tn-yellow-border flex items-center justify-center text-tn-gold shrink-0">
                            <Icon name={getEventIcon(ev.event_type)} size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-tn-text">
                              {getEventDisplayName(ev)}
                            </p>
                            <p className="text-xs text-tn-muted">/{ev.slug}</p>
                            {showEventQr(ev) && (
                              <p className="text-[10px] text-tn-gold font-semibold mt-0.5 flex items-center gap-1">
                                <Icon name="wallet" size={12} /> {Number(ev.qr_payment_count ?? 0)} QR payment{Number(ev.qr_payment_count ?? 0) !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-tn-muted hidden md:table-cell whitespace-nowrap">
                        {new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 text-tn-muted hidden lg:table-cell max-w-[160px] truncate">{ev.venue || '—'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <EventStatusBadges event={ev} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={canAddMoi(ev) ? `/events/${ev.slug}` : '#'}
                            onClick={(e) => { if (!canAddMoi(ev)) e.preventDefault(); }}
                            title={canAddMoi(ev) ? 'Add manual moi entry' : 'Awaiting admin approval'}
                            className={`p-1.5 transition-colors rounded ${canAddMoi(ev) ? 'text-tn-muted hover:text-tn-yellow' : 'text-tn-border cursor-not-allowed'}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <line x1="19" y1="8" x2="19" y2="14" />
                              <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                          </Link>
                          <Link href={`/e/${ev.slug}`} target="_blank" title="View public page"
                            className="p-1.5 text-tn-muted hover:text-tn-text transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </Link>
                          <button
                            onClick={() => onEdit(ev)}
                            title="Edit event"
                            className="p-1.5 text-tn-muted hover:text-tn-text transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => exportCSV(ev.id)} title="Export CSV"
                            className="p-1.5 text-tn-muted hover:text-tn-text transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          </button>
                          <button onClick={async () => { try { const res = await emailPDF(ev.id); showSuccess(res.message); } catch { showError('Failed to email PDF'); } }} title="Email PDF Report"
                            className="p-1.5 text-tn-muted hover:text-tn-text transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          </button>
                          <button onClick={() => setShowConfirmDelete(ev.id)} disabled={deleting === ev.id} title="Delete"
                            className="p-1.5 text-tn-border hover:text-red-400 transition-colors disabled:opacity-40">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Grid View */}
            <div className="block sm:hidden divide-y divide-tn-border">
              {paginatedEvents.map((ev) => (
                <div key={ev.id} className="p-4 space-y-3 bg-white transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-tn-yellow-bg border border-tn-yellow-border flex items-center justify-center text-tn-gold shrink-0">
                          <Icon name={getEventIcon(ev.event_type)} size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-tn-text text-sm">
                            {getEventDisplayName(ev)}
                          </p>
                          <p className="text-xs text-tn-muted">/{ev.slug}</p>
                        </div>
                    </div>
                    <EventStatusBadges event={ev} />
                  </div>

                  <div className="text-xs text-tn-muted space-y-1 pl-11">
                    <p className="flex items-center gap-1"><Icon name="calendar" size={12} /> {new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {ev.venue && <p className="flex items-center gap-1"><Icon name="map" size={12} /> {ev.venue}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-tn-border pl-11">
                    <span className="text-[10px] text-tn-muted">Actions:</span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={canAddMoi(ev) ? `/events/${ev.slug}` : '#'}
                        onClick={(e) => { if (!canAddMoi(ev)) e.preventDefault(); }}
                        title={canAddMoi(ev) ? 'Add manual moi entry' : 'Awaiting admin approval'}
                        className={`p-1.5 transition-colors rounded ${canAddMoi(ev) ? 'text-tn-muted hover:text-tn-yellow' : 'text-tn-border cursor-not-allowed'}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <line x1="19" y1="8" x2="19" y2="14" />
                          <line x1="22" y1="11" x2="16" y2="11" />
                        </svg>
                      </Link>
                      <Link href={`/e/${ev.slug}`} target="_blank" title="View public page"
                        className="p-1.5 text-tn-muted hover:text-tn-text transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </Link>
                      <button
                        onClick={() => onEdit(ev)}
                        title="Edit event"
                        className="p-1.5 text-tn-muted hover:text-tn-text transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => exportCSV(ev.id)} title="Export CSV"
                        className="p-1.5 text-tn-muted hover:text-tn-text transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                      <button onClick={async () => { try { const res = await emailPDF(ev.id); showSuccess(res.message); } catch { showError('Failed'); } }} title="Email PDF"
                        className="p-1.5 text-tn-muted hover:text-tn-text transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </button>
                      <button onClick={() => setShowConfirmDelete(ev.id)} disabled={deleting === ev.id} title="Delete"
                        className="p-1.5 text-tn-border hover:text-red-400 transition-colors disabled:opacity-40">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-tn-border px-5 py-3.5 bg-white">
                <div className="text-xs text-tn-muted font-medium">
                  Showing <span className="font-semibold text-tn-text">{startIndex + 1}</span> to <span className="font-semibold text-tn-text">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-semibold text-tn-text">{totalItems}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-tn-border text-xs font-semibold hover:bg-tn-light disabled:opacity-40 transition-colors text-tn-muted bg-white disabled:pointer-events-none"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentPage === pageNum
                            ? 'bg-tn-yellow text-black border border-tn-yellow shadow-sm'
                            : 'border border-tn-border hover:bg-tn-light text-tn-muted bg-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-tn-border text-xs font-semibold hover:bg-tn-light disabled:opacity-40 transition-colors text-tn-muted bg-white disabled:pointer-events-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <p className="text-xs text-tn-muted">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</p>

      {showConfirmDelete !== null && (
        <ConfirmDeleteModal
          isOpen={showConfirmDelete !== null}
          title="Delete Wedding Event"
          message="Are you sure you want to delete this event and all its entries? This cannot be undone."
          onConfirm={() => handleDelete(showConfirmDelete)}
          onCancel={() => setShowConfirmDelete(null)}
          isLoading={deleting === showConfirmDelete}
        />
      )}
    </div>
  );
}