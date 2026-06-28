'use client';

import { useState, useEffect } from 'react';
import Icon, { type IconName } from '@/components/ui/Icon';
import { Event, MoiEntry } from '@/lib/api';

interface ModulePaymentsProps {
  entries: MoiEntry[];
  events: Event[];
}

function getDefaultViewMode(): 'table' | 'cards' {
  if (typeof window === 'undefined') return 'table';
  return window.innerWidth < 640 ? 'cards' : 'table';
}

export default function ModulePayments({ entries, events }: ModulePaymentsProps) {
  const [search,      setSearch]      = useState('');
  const [filterMode,  setFilterMode]  = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(getDefaultViewMode());
  const itemsPerPage = 20;

  const filtered = entries.filter((e) => {
    const ms = e.guest_name.toLowerCase().includes(search.toLowerCase()) ||
               (e.city && e.city.toLowerCase().includes(search.toLowerCase())) ||
               (e.note && e.note.toLowerCase().includes(search.toLowerCase()));
    const mm = filterMode  === 'all' ||
               (filterMode === 'gold' && e.gift_type === 'gold') ||
               (filterMode === 'gift' && e.gift_type === 'gift') ||
               (e.gift_type === 'cash' && e.payment_mode === filterMode);
    const me = filterEvent === 'all' || String(e.event_id) === filterEvent;
    return ms && mm && me;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterMode, filterEvent, viewMode]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = filtered.slice(startIndex, startIndex + itemsPerPage);

  const totalCash = filtered.filter(e => e.gift_type === 'cash' || !e.gift_type).reduce((s, e) => s + Number(e.amount), 0);
  const totalGold = filtered.filter(e => e.gift_type === 'gold').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const totalGifts = filtered.filter(e => e.gift_type === 'gift').length;

  const payIcon: Record<string, IconName> = { cash: 'wallet', upi: 'wallet', card: 'wallet', cheque: 'list' };
  const relIcon: Record<string, IconName> = { family: 'users', friend: 'users', colleague: 'users', relative: 'users', neighbor: 'users', business: 'users', other: 'users' };

  return (
    <div className="space-y-4">
      {/* Mode summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['cash', 'upi', 'card', 'cheque'] as const).map((mode) => {
          const me = entries.filter((e) => (e.gift_type === 'cash' || !e.gift_type) && e.payment_mode === mode);
          const mt = me.reduce((s, e) => s + Number(e.amount), 0);
          return (
            <div key={mode} className="bg-white border border-tn-border rounded-xl p-4">
              <p className="text-xl mb-1 text-tn-gold">
                <Icon name={payIcon[mode] || 'wallet'} size={22} />
              </p>
              <p className="font-bold text-tn-text">₹{mt.toLocaleString('en-IN')}</p>
              <p className="text-xs text-tn-subtle capitalize mt-0.5">{mode} · {me.length}</p>
            </div>
          );
        })}
      </div>

      {/* Filters - Mobile optimized */}
      <div className="bg-white border border-tn-border rounded-xl p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          {/* Search - full width on mobile */}
          <div className="relative w-full">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guest, place, notes…"
              className="w-full border border-tn-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-tn-text placeholder-tn-subtle focus:outline-none focus:border-tn-yellow transition-colors"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tn-subtle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="2"/><path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
          </div>

          {/* Filter selects - stacked on mobile, row on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}
              className="w-full border border-tn-border rounded-lg px-3 py-2.5 text-sm text-tn-muted focus:outline-none focus:border-tn-yellow bg-white">
              <option value="all">All Contribution Types</option>
              <option value="cash">Cash Mode: Cash</option>
              <option value="upi">Cash Mode: UPI</option>
              <option value="card">Cash Mode: Card</option>
              <option value="cheque">Cash Mode: Cheque</option>
              <option value="gold">Gold Only</option>
              <option value="gift">Gifts Only</option>
            </select>
            <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)}
              className="w-full border border-tn-border rounded-lg px-3 py-2.5 text-sm text-tn-muted focus:outline-none focus:border-tn-yellow bg-white">
              <option value="all">All Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={String(ev.id)}>{ev.bride_name} & {ev.groom_name}</option>
              ))}
            </select>
          </div>

          {/* View toggle + count */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-tn-subtle font-medium">
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} found
            </span>
            <div className="flex items-center gap-1 bg-tn-light rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-tn-text shadow-sm'
                    : 'text-tn-subtle hover:text-tn-text'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="inline mr-1"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-tn-text shadow-sm'
                    : 'text-tn-subtle hover:text-tn-text'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="inline mr-1"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-tn-border rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
           <div className="py-16 text-center text-tn-subtle text-sm">No moi entries found.</div>
         ) : viewMode === 'table' ? (
          /* ── Table View ── */
          <div className="overflow-x-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-tn-border bg-tn-light text-left">
                    <th className="px-3 py-3 text-xs font-semibold text-tn-subtle uppercase tracking-wide">Guest / Location / Note</th>
                    <th className="px-3 py-3 text-xs font-semibold text-tn-subtle uppercase tracking-wide hidden md:table-cell">Event</th>
                    <th className="px-3 py-3 text-xs font-semibold text-tn-subtle uppercase tracking-wide hidden sm:table-cell">Relation</th>
                    <th className="px-3 py-3 text-xs font-semibold text-tn-subtle uppercase tracking-wide">Mode / Type</th>
                    <th className="px-3 py-3 text-xs font-semibold text-tn-subtle uppercase tracking-wide text-right">Contribution</th>
                    <th className="px-3 py-3 text-xs font-semibold text-tn-subtle uppercase tracking-wide text-right hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tn-border">
                  {paginatedEntries.map((e) => {
                    const ev = events.find((ev) => ev.id === e.event_id);
                    return (
                      <tr key={e.id} className="hover:bg-tn-light transition-colors">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-tn-yellow-bg border border-tn-gold-border flex items-center justify-center text-tn-gold font-bold text-xs shrink-0">
                              {e.guest_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-tn-text">{e.guest_name}</p>
                              <p className="text-xs text-tn-subtle flex flex-wrap gap-1.5 items-center mt-0.5">
                                {e.city && <span className="bg-tn-light text-tn-muted px-1.5 py-0.5 rounded text-[10px]">📍 {e.city}</span>}
                                {e.note && <span className="text-tn-muted font-medium">({e.note})</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-tn-muted hidden md:table-cell">
                          <p className="truncate max-w-[140px]">{ev ? `${ev.bride_name} & ${ev.groom_name}` : '—'}</p>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="text-xs capitalize text-tn-muted flex items-center gap-1"><Icon name={relIcon[e.relation] || 'users'} size={14} /> {e.relation}</span>
                        </td>
                        <td className="px-3 py-3">
                          {e.gift_type === 'gold' ? (
                            <span className="text-xs bg-tn-gold-bg text-tn-gold border border-tn-gold-border px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                              <Icon name="sparkle" size={12} /> Gold
                            </span>
                          ) : e.gift_type === 'gift' ? (
                            <span className="text-xs bg-tn-error-bg text-tn-error border border-tn-error/20 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                               <Icon name="gift" size={12} /> Gift
                             </span>
                           ) : (
                             <span className="text-xs capitalize bg-tn-light text-tn-muted px-2 py-0.5 rounded-full font-medium">
                               <Icon name={payIcon[e.payment_mode] || 'wallet'} size={12} /> {e.payment_mode}
                             </span>
                           )}
                         </td>
                         <td className="px-3 py-3 text-right font-bold text-tn-text">
                           {e.gift_type === 'gold' ? (
                             <span className="text-tn-gold">{e.gold_weight}g Gold</span>
                           ) : e.gift_type === 'gift' ? (
                             <span className="text-tn-error truncate max-w-[150px] inline-block">{e.gift_description}</span>
                          ) : (
                            <span>₹{Number(e.amount).toLocaleString('en-IN')}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-tn-subtle text-xs hidden lg:table-cell whitespace-nowrap">
                          {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── Card View (Mobile-friendly) ── */
          <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedEntries.map((e) => {
              const ev = events.find((ev) => ev.id === e.event_id);
              return (
                <div key={e.id} className="border border-tn-border rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-tn-yellow-bg border border-tn-gold-border flex items-center justify-center text-tn-gold font-bold text-sm shrink-0">
                        {e.guest_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-tn-text truncate text-sm">{e.guest_name}</p>
                        {ev && (
                          <p className="text-[10px] text-tn-subtle truncate">{ev.bride_name} & {ev.groom_name}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-tn-subtle whitespace-nowrap">
                      {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-xs">
                    {e.city && (
                      <div className="flex items-center gap-1.5 text-tn-muted">
                        <span>📍</span>
                        <span className="truncate">{e.city}</span>
                      </div>
                    )}
                    {e.note && (
                      <p className="text-tn-muted truncate">({e.note})</p>
                    )}
                    <div className="flex items-center gap-1.5 text-tn-muted">
                      <Icon name={relIcon[e.relation] || 'users'} size={14} />
                      <span className="capitalize">{e.relation}</span>
                    </div>

                    {/* Type badge */}
                    <div>
                      {e.gift_type === 'gold' ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-tn-gold-bg text-tn-gold border border-tn-gold-border px-2 py-0.5 rounded-full font-medium">
                            <Icon name="sparkle" size={12} /> Gold · {e.gold_weight}g
                          </span>
                      ) : e.gift_type === 'gift' ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-tn-error-bg text-tn-error border border-tn-error/20 px-2 py-0.5 rounded-full font-medium">
                             <Icon name="gift" size={12} /> Gift
                           </span>
                       ) : (
                         <span className="inline-flex items-center gap-1 text-xs capitalize bg-tn-light text-tn-muted px-2 py-0.5 rounded-full font-medium">
                             <Icon name={payIcon[e.payment_mode] || 'wallet'} size={12} /> {e.payment_mode}
                         </span>
                       )}
                     </div>

                     {/* Amount */}
                     <div className="pt-2 border-t border-tn-border">
                       {e.gift_type === 'gold' ? (
                         <p className="text-sm font-bold text-tn-gold">{e.gold_weight}g Gold</p>
                       ) : e.gift_type === 'gift' ? (
                         <p className="text-sm font-bold text-tn-error truncate">{e.gift_description}</p>
                      ) : (
                        <p className="text-sm font-bold text-tn-text">₹{Number(e.amount).toLocaleString('en-IN')}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-tn-border px-4 py-3.5 bg-white">
            <div className="text-xs text-tn-subtle font-medium">
              Showing <span className="font-semibold text-tn-text">{startIndex + 1}</span> to <span className="font-semibold text-tn-text">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-semibold text-tn-text">{totalItems}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-tn-border text-xs font-semibold hover:bg-tn-light disabled:opacity-40 transition-colors text-tn-muted bg-white disabled:pointer-events-none"
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
                className="px-3 py-1.5 rounded-lg border border-tn-border text-xs font-semibold hover:bg-tn-light disabled:opacity-40 transition-colors text-tn-muted bg-white disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Summary footer */}
        <div className="px-4 py-3 bg-tn-yellow-bg border-t border-tn-gold-border flex flex-wrap gap-3 sm:gap-4 justify-between items-center text-sm font-semibold text-tn-text">
          <span className="text-tn-muted">{filtered.length} entries</span>
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
            <span className="text-tn-text">Total Cash: <strong className="text-tn-green-soft">₹{totalCash.toLocaleString('en-IN')}</strong></span>
            <span className="text-tn-text">Total Gold: <strong className="text-tn-gold">{totalGold}g</strong></span>
            <span className="text-tn-text">Total Gifts: <strong className="text-tn-red-soft">{totalGifts} items</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}