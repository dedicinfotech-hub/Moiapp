'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi, moiApi, Event, MoiEntry, showSuccess, showError } from '@/lib/api';
import EventLayout from '@/components/event/EventLayout';
import { useSlug } from '@/lib/useSlug';

type DateFilter = 'today' | 'week' | 'month' | 'all';
type PaymentFilter = 'all' | 'cash' | 'upi' | 'bank' | 'cheque';

export default function ReportsDashboardScreen() {
  const router = useRouter();
  const slug = useSlug(1); // /events/[slug]/reports → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [entries, setEntries] = useState<MoiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

  const loadData = useCallback(async () => {
    try {
      const eventData = await eventsApi.get(slug);
      setEvent(eventData);
      const entriesData = await moiApi.list(eventData.id).catch(() => ({ entries: [] }));
      setEntries(entriesData.entries || []);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDateFilteredEntries = (entryList: MoiEntry[]) => {
    const now = new Date();
    return entryList.filter((entry) => {
      const entryDate = new Date(entry.created_at);
      if (dateFilter === 'today') {
        return entryDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return entryDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return entryDate >= monthAgo;
      }
      return true;
    });
  };

  const getPaymentFilteredEntries = (entryList: MoiEntry[]) => {
    if (paymentFilter === 'all') return entryList;
    return entryList.filter((e) => {
      if (paymentFilter === 'cash') return e.payment_mode === 'cash';
      if (paymentFilter === 'upi') return e.payment_mode === 'upi';
      if (paymentFilter === 'bank') return e.payment_mode === 'card' || e.payment_mode === 'cheque';
      if (paymentFilter === 'cheque') return e.payment_mode === 'cheque';
      return true;
    });
  };

  const filteredEntries = getPaymentFilteredEntries(getDateFilteredEntries(entries));

  const totalCollection = filteredEntries.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalContributors = filteredEntries.length;
  const averageContribution = totalContributors > 0 ? totalCollection / totalContributors : 0;
  const highestContribution = totalContributors > 0 ? Math.max(...filteredEntries.map(e => Number(e.amount))) : 0;
  const totalCash = filteredEntries.filter((e) => e.gift_type === 'cash' || e.payment_mode === 'cash').reduce((sum, e) => sum + Number(e.amount), 0);

  // Payment distribution
  const paymentDistribution = filteredEntries.reduce((acc, e) => {
    const mode = e.payment_mode;
    acc[mode] = (acc[mode] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  // Daily trend (last 7 days)
  const dailyTrend = filteredEntries.reduce((acc, e) => {
    const date = new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    acc[date] = (acc[date] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  // Top contributors
  const topContributors = [...filteredEntries]
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 3);

  const nonCashEntries = filteredEntries.filter((e) => e.payment_mode !== 'cash' || e.gift_type !== 'cash');

  const handleExportPDF = async () => {
    if (!event) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moi_token') : null;
      const url = `/api/pdf.php?event_id=${event.id}&action=download`;
      const res = await fetch(url, {
        headers: {
          'X-Auth-Token': token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate PDF');
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `moi-report-${event.slug || event.id}.html`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to export PDF');
    }
  };

  const handleExportExcel = () => {
    showSuccess('Excel export would be generated here');
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Amount', 'Type', 'Payment Mode', 'Date', 'Note'];
    const rows = filteredEntries.map((e) => [
      e.guest_name,
      e.amount,
      e.gift_type,
      e.payment_mode,
      new Date(e.created_at).toLocaleDateString('en-IN'),
      e.note,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reports-${event?.custom_title || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
          <p className="text-[#666] text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">Event not found</p>
      </div>
    );
  }

  const eventDate = event.wedding_date ? new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <EventLayout slug={slug} activeTab="reports" title="Reports" showNotifications={false}>
      <div className="flex-1 flex flex-col px-6 pt-6">
        {/* Event Summary Card */}
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937]">{event.custom_title || event.event_type}</h3>
              <p className="text-xs text-[#6B7280] mt-1">{eventDate} · {event.venue || event.city || '—'}</p>
            </div>
            <button
              onClick={() => router.push(`/events/${slug}`)}
              className="text-xs text-[#FFC107] font-semibold hover:underline"
            >
              View Details
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'all', label: 'All Time' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setDateFilter(f.value as DateFilter)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  dateFilter === f.value
                    ? 'bg-[#FFC107] text-white'
                    : 'bg-[#F9FAFB] border border-[#E5E7EB] text-[#6B7280] hover:border-[#FFC107]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'cash', label: 'Cash' },
              { value: 'upi', label: 'UPI' },
              { value: 'bank', label: 'Bank/Card' },
              { value: 'cheque', label: 'Cheque' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setPaymentFilter(f.value as PaymentFilter)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors ${
                  paymentFilter === f.value
                    ? 'bg-[#FFC107] text-white'
                    : 'bg-[#F9FAFB] text-[#6B7280] hover:text-[#FFC107]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Total Collection</p>
            <p className="text-lg font-bold text-[#22C55E]">₹{totalCollection.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Total Contributors</p>
            <p className="text-lg font-bold text-[#1F2937]">{totalContributors}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Average Contribution</p>
            <p className="text-lg font-bold text-[#1F2937]">₹{Math.round(averageContribution).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Highest Contribution</p>
            <p className="text-lg font-bold text-[#1F2937]">₹{highestContribution.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Cash Total</p>
            <p className="text-lg font-bold text-[#22C55E]">₹{totalCash.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-[#9CA3AF]">{totalCollection > 0 ? ((totalCash / totalCollection) * 100).toFixed(0) : 0}% of total</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Online Total</p>
            <p className="text-lg font-bold text-[#FFC107]">₹{(totalCollection - totalCash).toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-[#9CA3AF]">{totalCollection > 0 ? (((totalCollection - totalCash) / totalCollection) * 100).toFixed(0) : 0}% of total</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-4 mb-6">
          {/* Collection Distribution */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-[#1F2937] mb-4">Collection Distribution</h3>
            <div className="space-y-2">
              {Object.entries(paymentDistribution).map(([mode, amount]) => {
                const percentage = totalCollection > 0 ? (amount / totalCollection) * 100 : 0;
                const modeLabel = { cash: 'Cash', upi: 'UPI', card: 'Card', cheque: 'Cheque', other: 'Other' }[mode] || mode;
                return (
                  <div key={mode}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-[#6B7280]">{modeLabel}</span>
                      <span className="text-xs font-semibold text-[#1F2937]">₹{amount.toLocaleString('en-IN')} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-[#F9FAFB] rounded-full overflow-hidden">
                      <div className="h-full bg-[#FFC107] rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(paymentDistribution).length === 0 && (
                <p className="text-xs text-[#9CA3AF] text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Daily Collection Trend */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-[#1F2937] mb-4">Daily Collection Trend</h3>
            <div className="flex items-end gap-2 h-32">
              {Object.entries(dailyTrend).map(([date, amount]) => {
                const maxAmount = Math.max(...Object.values(dailyTrend), 1);
                const height = (amount / maxAmount) * 100;
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-[#FFC107] rounded-t-lg" style={{ height: `${height}%` }} />
                    <span className="text-[8px] text-[#9CA3AF]">{date.split(' ')[0]}</span>
                  </div>
                );
              })}
              {Object.keys(dailyTrend).length === 0 && (
                <p className="text-xs text-[#9CA3AF] text-center w-full py-10">No data available</p>
              )}
            </div>
          </div>

          {/* Top Contributors */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-[#1F2937] mb-4">Top 3 Contributors</h3>
            <div className="space-y-3">
              {topContributors.map((entry, index) => (
                <div key={entry.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    index === 0 ? 'bg-[#FFC107] text-black' : index === 1 ? 'bg-[#E5E7EB] text-[#666]' : 'bg-[#FDE68A] text-[#92400E]'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1F2937]">{entry.guest_name}</p>
                    <p className="text-[10px] text-[#9CA3AF]">
                      {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[#22C55E]">₹{Number(entry.amount).toLocaleString('en-IN')}</p>
                </div>
              ))}
              {topContributors.length === 0 && (
                <p className="text-xs text-[#9CA3AF] text-center py-4">No contributors yet</p>
              )}
            </div>
          </div>

          {/* Non-Cash / Gift Contributions */}
          {nonCashEntries.length > 0 && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[#1F2937] mb-4">Non-Cash / Gift Contributions</h3>
              <div className="space-y-3">
                {nonCashEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1F2937]">{entry.guest_name}</p>
                      <p className="text-[10px] text-[#9CA3AF] capitalize">{entry.gift_type} · {entry.payment_mode}</p>
                    </div>
                    <p className="text-sm font-bold text-[#FFC107]">
                      {entry.gift_type === 'gift' && !entry.amount ? 'Gift' : `₹${Number(entry.amount).toLocaleString('en-IN')}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export Options */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-[#1F2937] mb-4">Export Options</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleExportPDF}
              className="py-3 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
            >
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="py-3 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
            >
              Excel
            </button>
            <button
              onClick={handleExportCSV}
              className="py-3 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
            >
              CSV
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!event) return;
              const text = `Moi Report for ${event.custom_title || event.event_type}\nTotal Collection: ₹${totalCollection.toLocaleString('en-IN')}\nTotal Contributors: ${totalContributors}`;
              const url = event.guest_token ? `${window.location.origin}/g/${event.guest_token}/form` : window.location.href;
              if (navigator.share) {
                navigator.share({ title: 'Moi Report', text, url }).catch(() => {});
              } else {
                navigator.clipboard.writeText(`${text}\n${url}`);
                showSuccess('Report link copied to clipboard');
              }
            }}
            className="mt-3 w-full py-3 bg-[#FFC107] text-white rounded-xl text-xs font-semibold"
          >
            Share Report on WhatsApp
          </button>
        </div>
      </div>
    </EventLayout>
  );
}

