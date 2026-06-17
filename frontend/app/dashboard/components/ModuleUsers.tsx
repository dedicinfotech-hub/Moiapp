'use client';

import { useState, useEffect } from 'react';
import { MoiEntry } from '@/lib/api';

interface GuestSummary {
  name: string;
  count: number;
  total: number;
  lastDate: string;
  eventIds: Set<number>;
}

interface ModuleUsersProps {
  entries: MoiEntry[];
}

export default function ModuleUsers({ entries }: ModuleUsersProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const guestMap = entries.reduce((acc: Record<string, GuestSummary>, e) => {
    const key = e.guest_name.toLowerCase().trim();
    if (!acc[key]) acc[key] = { name: e.guest_name, count: 0, total: 0, lastDate: e.created_at, eventIds: new Set<number>() };
    acc[key].count++;
    acc[key].total += Number(e.amount);
    acc[key].eventIds.add(e.event_id);
    if (new Date(e.created_at) > new Date(acc[key].lastDate)) acc[key].lastDate = e.created_at;
    return acc;
  }, {} as Record<string, GuestSummary>);

  const guests = Object.values(guestMap)
    .sort((a, b) => b.total - a.total)
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalItems = guests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGuests = guests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests…"
            className="w-full border border-tn-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-tn-text placeholder-tn-muted focus:outline-none focus:border-tn-yellow transition-colors"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tn-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="2"/><path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
        </div>
        <span className="text-sm text-tn-muted font-medium">{guests.length} guests</span>
      </div>

      {/* Mobile card view */}
      <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
        {guests.length === 0 ? (
          <div className="py-16 text-center text-tn-muted text-sm">No guests found.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-tn-border bg-tn-light text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-tn-muted uppercase tracking-wide">#</th>
                    <th className="px-4 py-3 text-xs font-semibold text-tn-muted uppercase tracking-wide">Guest</th>
                    <th className="px-4 py-3 text-xs font-semibold text-tn-muted uppercase tracking-wide text-center">Entries</th>
                    <th className="px-4 py-3 text-xs font-semibold text-tn-muted uppercase tracking-wide text-center">Events</th>
                    <th className="px-4 py-3 text-xs font-semibold text-tn-muted uppercase tracking-wide text-right">Last Seen</th>
                    <th className="px-5 py-3 text-xs font-semibold text-tn-muted uppercase tracking-wide text-right">Total Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tn-border">
                  {paginatedGuests.map((g, i) => (
                    <tr key={g.name} className="hover:bg-tn-light transition-colors">
                      <td className="px-5 py-3 text-tn-muted text-xs">{startIndex + i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-tn-yellow-bg border border-tn-yellow-border flex items-center justify-center text-tn-gold font-bold text-xs shrink-0">
                            {g.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-tn-text">{g.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-tn-muted">{g.count}</td>
                      <td className="px-4 py-3 text-center text-tn-muted">{g.eventIds.size}</td>
                      <td className="px-4 py-3 text-right text-tn-muted text-xs whitespace-nowrap">
                        {new Date(g.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-tn-text">
                        ₹{g.total.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-tn-border">
              {paginatedGuests.map((g, i) => (
                <div key={g.name} className="p-4 hover:bg-tn-light transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-tn-yellow-bg border border-tn-yellow-border flex items-center justify-center text-tn-gold font-bold text-sm shrink-0">
                      {g.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-tn-text text-sm truncate">{g.name}</p>
                      <p className="text-xs text-tn-muted">Last seen {new Date(g.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-tn-text text-sm">₹{g.total.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 pl-13 text-xs text-tn-muted">
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      {g.count} entries
                    </span>
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                      {g.eventIds.size} events
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-tn-border px-4 sm:px-5 py-3.5 bg-white">
                <div className="text-xs text-tn-muted font-medium">
                  Showing <span className="font-semibold text-tn-text">{startIndex + 1}</span> to <span className="font-semibold text-tn-text">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-semibold text-tn-text">{totalItems}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-tn-border text-xs font-semibold hover:bg-tn-light disabled:opacity-40 transition-colors text-tn-muted bg-white disabled:pointer-events-none"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
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
                    className="px-3 py-2 rounded-lg border border-tn-border text-xs font-semibold hover:bg-tn-light disabled:opacity-40 transition-colors text-tn-muted bg-white disabled:pointer-events-none"
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