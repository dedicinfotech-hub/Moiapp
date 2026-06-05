'use client';

import { useState, useEffect } from 'react';
import { Event, MoiEntry } from '@/lib/api';

interface ModulePaymentsProps {
  entries: MoiEntry[];
  events: Event[];
}

export default function ModulePayments({ entries, events }: ModulePaymentsProps) {
  const [search,      setSearch]      = useState('');
  const [filterMode,  setFilterMode]  = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
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
  }, [search, filterMode, filterEvent]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = filtered.slice(startIndex, startIndex + itemsPerPage);

  const totalCash = filtered.filter(e => e.gift_type === 'cash' || !e.gift_type).reduce((s, e) => s + Number(e.amount), 0);
  const totalGold = filtered.filter(e => e.gift_type === 'gold').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const totalGifts = filtered.filter(e => e.gift_type === 'gift').length;

  const payEmoji: Record<string, string> = { cash: '💵', upi: '📱', card: '💳', cheque: '📄' };
  const relEmoji: Record<string, string> = { family: '👨‍👩‍👧', friend: '👫', colleague: '💼', other: '🤝' };

  return (
    <div className="space-y-4">
      {/* Mode summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['cash', 'upi', 'card', 'cheque'] as const).map((mode) => {
          const me = entries.filter((e) => (e.gift_type === 'cash' || !e.gift_type) && e.payment_mode === mode);
          const mt = me.reduce((s, e) => s + Number(e.amount), 0);
          return (
            <div key={mode} className="bg-white border border-[#EBEBEB] rounded-xl p-4">
              <p className="text-xl mb-1">{payEmoji[mode]}</p>
              <p className="font-bold text-[#101010]">₹{mt.toLocaleString('en-IN')}</p>
              <p className="text-xs text-[#999] capitalize mt-0.5">{mode} · {me.length}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 items-center">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guest, place, notes…"
            className="border border-[#E8E8E8] rounded-lg pl-9 pr-3 py-2 text-sm text-[#101010] placeholder-[#bbb] focus:outline-none focus:border-[#FFC107] transition-colors w-64"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="2"/><path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
        </div>
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}
          className="border border-[#E8E8E8] rounded-lg px-3 py-2 text-sm text-[#444] focus:outline-none focus:border-[#FFC107] bg-white">
          <option value="all">All Contribution Types</option>
          <option value="cash">Cash Mode: Cash</option>
          <option value="upi">Cash Mode: UPI</option>
          <option value="card">Cash Mode: Card</option>
          <option value="cheque">Cash Mode: Cheque</option>
          <option value="gold">✨ Gold Only</option>
          <option value="gift">🎁 Gifts Only</option>
        </select>
        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)}
          className="border border-[#E8E8E8] rounded-lg px-3 py-2 text-sm text-[#444] focus:outline-none focus:border-[#FFC107] bg-white max-w-[200px]">
          <option value="all">All Events</option>
          {events.map((ev) => (
            <option key={ev.id} value={String(ev.id)}>{ev.bride_name} & {ev.groom_name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[#bbb] text-sm">No payments found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F5F5F5] bg-[#fafafa] text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide">Guest / Location / Note</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide hidden md:table-cell">Event</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide hidden sm:table-cell">Relation</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide">Mode / Type</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide text-right">Contribution</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide text-right hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8F8F8]">
                  {paginatedEntries.map((e) => {
                    const ev = events.find((ev) => ev.id === e.event_id);
                    return (
                      <tr key={e.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#FFFCF5] border border-[#FFE082] flex items-center justify-center text-[#B8860B] font-bold text-xs shrink-0">
                              {e.guest_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-[#101010]">{e.guest_name}</p>
                              <p className="text-xs text-[#999] flex flex-wrap gap-1.5 items-center mt-0.5">
                                {e.city && <span className="bg-gray-100 text-[#444] px-1.5 py-0.5 rounded text-[10px]">📍 {e.city}</span>}
                                {e.note && <span className="text-[#666] font-medium">({e.note})</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#666] hidden md:table-cell">
                          <p className="truncate max-w-[140px]">{ev ? `${ev.bride_name} & ${ev.groom_name}` : '—'}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs capitalize text-[#666]">{relEmoji[e.relation]} {e.relation}</span>
                        </td>
                        <td className="px-4 py-3">
                          {e.gift_type === 'gold' ? (
                            <span className="text-xs bg-[#FFF9E6] text-[#B8860B] border border-[#FFE082] px-2 py-0.5 rounded-full font-medium">
                              ✨ Gold
                            </span>
                          ) : e.gift_type === 'gift' ? (
                            <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-medium">
                              🎁 Gift
                            </span>
                          ) : (
                            <span className="text-xs capitalize bg-[#F5F5F5] text-[#444] px-2 py-0.5 rounded-full font-medium">
                              {payEmoji[e.payment_mode]} {e.payment_mode}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-[#101010]">
                          {e.gift_type === 'gold' ? (
                            <span className="text-[#B8860B]">{e.gold_weight}g Gold</span>
                          ) : e.gift_type === 'gift' ? (
                            <span className="text-red-600 truncate max-w-[150px] inline-block">{e.gift_description}</span>
                          ) : (
                            <span>₹{Number(e.amount).toLocaleString('en-IN')}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-[#bbb] text-xs hidden lg:table-cell whitespace-nowrap">
                          {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
            <div className="px-5 py-3 bg-[#FFFCF5] border-t border-[#FFE082] flex flex-wrap gap-4 justify-between items-center text-sm font-semibold text-[#101010]">
              <span className="text-[#666]">{filtered.length} entries</span>
              <div className="flex flex-wrap gap-4 text-xs md:text-sm">
                <span className="text-[#101010]">Total Cash: <strong className="text-green-600">₹{totalCash.toLocaleString('en-IN')}</strong></span>
                <span className="text-[#101010]">Total Gold: <strong className="text-[#B8860B]">{totalGold}g</strong></span>
                <span className="text-[#101010]">Total Gifts: <strong className="text-red-600">{totalGifts} items</strong></span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}