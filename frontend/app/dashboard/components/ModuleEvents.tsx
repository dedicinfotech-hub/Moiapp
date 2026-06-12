'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Event, eventsApi, exportCSV, emailPDF } from '@/lib/api';
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

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, string> = {
      wedding: '💒',
      birthday: '🎂',
      engagement: '💍',
      valakaappu: '🌺',
      housewarming: '🏠',
      graduation: '🎓',
      custom: '🎉',
    };
    return icons[eventType] || '🎉';
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
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="border border-[#E8E8E8] rounded-lg pl-9 pr-3 py-2 text-sm text-[#101010] placeholder-[#bbb] focus:outline-none focus:border-[#FFC107] transition-colors w-60"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="2"/>
              <path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
        </div>
        <button
          onClick={onNewEvent}
          className="flex items-center gap-1.5 bg-[#FFC107] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors whitespace-nowrap"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Event
        </button>
      </div>


      {/* Table card */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[#bbb] text-sm">
            {events.length === 0 ? (
              <>No events yet.{' '}<button onClick={onNewEvent} className="text-[#FFC107] font-semibold hover:underline">Create one →</button></>
            ) : 'No results found.'}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F5F5F5] bg-[#fafafa] text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide">Event</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide hidden lg:table-cell">Venue</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide text-center">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8F8F8]">
                  {paginatedEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#FFFCF5] border border-[#FFE082] flex items-center justify-center text-base shrink-0">
                            {getEventIcon(ev.event_type)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#101010]">
                              {getEventDisplayName(ev)}
                            </p>
                            <p className="text-xs text-[#bbb]">/{ev.slug}</p>
                            {showEventQr(ev) && (
                              <p className="text-[10px] text-[#B8860B] font-semibold mt-0.5">
                                📱 {Number(ev.qr_payment_count ?? 0)} QR payment{Number(ev.qr_payment_count ?? 0) !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[#666] hidden md:table-cell whitespace-nowrap">
                        {new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 text-[#666] hidden lg:table-cell max-w-[160px] truncate">{ev.venue || '—'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <EventStatusBadges event={ev} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {/* 👤 Add Moi (manual entry) */}
                          <Link
                            href={canAddMoi(ev) ? `/events/${ev.slug}` : '#'}
                            onClick={(e) => { if (!canAddMoi(ev)) e.preventDefault(); }}
                            title={canAddMoi(ev) ? 'Add manual moi entry' : 'Awaiting admin approval'}
                            className={`p-1.5 transition-colors rounded ${canAddMoi(ev) ? 'text-[#bbb] hover:text-[#FFC107]' : 'text-[#ddd] cursor-not-allowed'}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <line x1="19" y1="8" x2="19" y2="14" />
                              <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                          </Link>
                          <Link href={`/e/${ev.slug}`} target="_blank" title="View public page"
                            className="p-1.5 text-[#bbb] hover:text-[#101010] transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </Link>
                          <button
                            onClick={() => onEdit(ev)}
                            title="Edit event"
                            className="p-1.5 text-[#bbb] hover:text-[#101010] transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => exportCSV(ev.id)} title="Export CSV"
                            className="p-1.5 text-[#bbb] hover:text-[#101010] transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          </button>
                          <button onClick={async () => { try { await emailPDF(ev.id); alert('PDF report emailed successfully!'); } catch { alert('Failed to email PDF'); } }} title="Email PDF Report"
                            className="p-1.5 text-[#bbb] hover:text-[#101010] transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          </button>
                          <button onClick={() => setShowConfirmDelete(ev.id)} disabled={deleting === ev.id} title="Delete"
                            className="p-1.5 text-[#ddd] hover:text-red-400 transition-colors disabled:opacity-40">
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
            <div className="block sm:hidden divide-y divide-[#F8F8F8]">
              {paginatedEvents.map((ev) => (
                <div key={ev.id} className="p-4 space-y-3 bg-white transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFFCF5] border border-[#FFE082] flex items-center justify-center text-base shrink-0">
                          {getEventIcon(ev.event_type)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#101010] text-sm">
                            {getEventDisplayName(ev)}
                          </p>
                          <p className="text-xs text-[#bbb]">/{ev.slug}</p>
                        </div>
                    </div>
                    <EventStatusBadges event={ev} />
                  </div>

                  <div className="text-xs text-[#666] space-y-1 pl-11">
                    <p>📅 {new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {ev.venue && <p>📍 {ev.venue}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F8F8F8] pl-11">
                    <span className="text-[10px] text-[#999]">Actions:</span>
                    <div className="flex items-center gap-2">
                      {/* 👤 Add Moi (manual entry) */}
                      <Link
                        href={canAddMoi(ev) ? `/events/${ev.slug}` : '#'}
                        onClick={(e) => { if (!canAddMoi(ev)) e.preventDefault(); }}
                        title={canAddMoi(ev) ? 'Add manual moi entry' : 'Awaiting admin approval'}
                        className={`p-1.5 transition-colors rounded ${canAddMoi(ev) ? 'text-[#bbb] hover:text-[#FFC107]' : 'text-[#ddd] cursor-not-allowed'}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <line x1="19" y1="8" x2="19" y2="14" />
                          <line x1="22" y1="11" x2="16" y2="11" />
                        </svg>
                      </Link>
                      <Link href={`/e/${ev.slug}`} target="_blank" title="View public page"
                        className="p-1.5 text-[#bbb] hover:text-[#101010] transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </Link>
                      <button
                        onClick={() => onEdit(ev)}
                        title="Edit event"
                        className="p-1.5 text-[#bbb] hover:text-[#101010] transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => exportCSV(ev.id)} title="Export CSV"
                        className="p-1.5 text-[#bbb] hover:text-[#101010] transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                      <button onClick={async () => { try { await emailPDF(ev.id); alert('PDF report emailed!'); } catch { alert('Failed'); } }} title="Email PDF"
                        className="p-1.5 text-[#bbb] hover:text-[#101010] transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </button>
                      <button onClick={() => setShowConfirmDelete(ev.id)} disabled={deleting === ev.id} title="Delete"
                        className="p-1.5 text-[#ddd] hover:text-red-400 transition-colors disabled:opacity-40">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8E8E8] px-5 py-3.5 bg-white">
                <div className="text-xs text-[#999] font-medium">
                  Showing <span className="font-semibold text-[#101010]">{startIndex + 1}</span> to <span className="font-semibold text-[#101010]">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-semibold text-[#101010]">{totalItems}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E8E8E8] text-xs font-semibold hover:bg-[#fafafa] disabled:opacity-40 transition-colors text-[#555] bg-white disabled:pointer-events-none"
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
                            ? 'bg-[#FFC107] text-black border border-[#FFC107] shadow-sm'
                            : 'border border-[#E8E8E8] hover:bg-[#fafafa] text-[#555] bg-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E8E8E8] text-xs font-semibold hover:bg-[#fafafa] disabled:opacity-40 transition-colors text-[#555] bg-white disabled:pointer-events-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <p className="text-xs text-[#bbb]">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</p>

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