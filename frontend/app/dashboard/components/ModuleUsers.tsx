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
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests…"
            className="border border-[#E8E8E8] rounded-lg pl-9 pr-3 py-2 text-sm text-[#101010] placeholder-[#bbb] focus:outline-none focus:border-[#FFC107] transition-colors w-60"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="2"/><path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
        </div>
        <span className="text-sm text-[#bbb]">{guests.length} guests</span>
      </div>

      <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
        {guests.length === 0 ? (
          <div className="py-16 text-center text-[#bbb] text-sm">No guests found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F5F5F5] bg-[#fafafa] text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide">#</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide">Guest</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide text-center hidden sm:table-cell">Entries</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide text-center hidden md:table-cell">Events</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide text-right hidden lg:table-cell">Last Seen</th>
                    <th className="px-5 py-3 text-xs font-semibold text-[#999] uppercase tracking-wide text-right">Total Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8F8F8]">
                  {paginatedGuests.map((g, i) => (
                    <tr key={g.name} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3 text-[#ddd] text-xs">{startIndex + i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#FFFCF5] border border-[#FFE082] flex items-center justify-center text-[#B8860B] font-bold text-xs shrink-0">
                            {g.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-[#101010]">{g.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-[#666] hidden sm:table-cell">{g.count}</td>
                      <td className="px-4 py-3 text-center text-[#666] hidden md:table-cell">{g.eventIds.size}</td>
                      <td className="px-4 py-3 text-right text-[#bbb] text-xs hidden lg:table-cell whitespace-nowrap">
                        {new Date(g.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-[#101010]">
                        ₹{g.total.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
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
          </>
        )}
      </div>
    </div>
  );
}