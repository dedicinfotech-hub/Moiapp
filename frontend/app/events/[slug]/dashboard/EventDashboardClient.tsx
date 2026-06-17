'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi, moiApi, Event, MoiEntry } from '@/lib/api';
import EventLayout, { EventDetailsRow } from '@/components/event/EventLayout';
import { useSlug } from '@/lib/useSlug';

const AVATAR_COLORS = ['bg-[#EDE9FE] text-[#FFC107]', 'bg-[#DBEAFE] text-[#3B82F6]', 'bg-[#D1FAE5] text-[#059669]', 'bg-[#FEF3C7] text-[#D97706]', 'bg-[#FCE7F3] text-[#DB2777]'];

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function StatCard({ icon, label, value, sub, bg }: { icon: React.ReactNode; label: string; value: string; sub?: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-3 min-w-0`}>
      <div className="mb-1">{icon}</div>
      <p className="text-[9px] text-[#6B7280] leading-tight">{label}</p>
      <p className="text-sm font-bold text-[#1F2937] mt-0.5">{value}</p>
      {sub && <p className="text-[9px] text-[#9CA3AF]">{sub}</p>}
    </div>
  );
}

function QuickAction({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center text-center gap-1.5 flex-1 min-w-0">
      <div className="w-12 h-12 rounded-full bg-[#F3E8FF] flex items-center justify-center">{icon}</div>
      <p className="text-[10px] font-semibold text-[#1F2937] leading-tight">{label}</p>
      <p className="text-[8px] text-[#9CA3AF] leading-tight px-1">{sub}</p>
    </button>
  );
}

export default function EventDashboardScreen() {
  const router = useRouter();
  const slug = useSlug(1); // /events/[slug]/dashboard → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [entries, setEntries] = useState<MoiEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!slug) return;
    try {
      const eventData = await eventsApi.get(slug);
      if (eventData.approval_status === 'pending') {
        router.replace(`/events/${slug}/pending`);
        return;
      }
      setEvent(eventData);
      const entriesData = await moiApi.list(eventData.id);
      const list = entriesData.entries || [];
      if (list.length === 0) {
        router.replace(`/events/${slug}/dashboard-empty`);
        return;
      }
      setEntries(list);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
      </div>
    );
  }

  const title = event.custom_title || (event.bride_name && event.groom_name ? `${event.bride_name} & ${event.groom_name}` : event.event_type);
  const totalCollection = entries.reduce((sum, e) => sum + Number(e.amount), 0);
  const contributors = entries.length;
  const averageContribution = contributors > 0 ? Math.round(totalCollection / contributors) : 0;
  const highestContribution = contributors > 0 ? Math.max(...entries.map((e) => Number(e.amount))) : 0;

  const eventWithTime = { ...event, wedding_time: (event as Event & { wedding_time?: string }).wedding_time };

  return (
    <EventLayout slug={slug} activeTab="dashboard" title={title} notificationCount={2}>
      <EventDetailsRow event={eventWithTime} />

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#1F2937]">Live Collection Overview</h3>
        <button type="button" onClick={() => router.push(`/events/${slug}/reports`)} className="text-xs text-[#FFC107] font-semibold flex items-center gap-0.5">
          View Details
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-5">
        <StatCard bg="bg-[#F5F3FF]" label="Total Collection" value={`₹${totalCollection.toLocaleString('en-IN')}`} sub="Today"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>} />
        <StatCard bg="bg-[#EFF6FF]" label="Total Moi Entries" value={String(contributors)} sub="Today"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
        <StatCard bg="bg-[#F0FFF4]" label="Average / Entry" value={`₹${averageContribution.toLocaleString('en-IN')}`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>} />
        <StatCard bg="bg-[#FFFBEB]" label="Top Amount" value={`₹${highestContribution.toLocaleString('en-IN')}`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>} />
      </div>

      <div className="flex justify-between gap-2 mb-6">
        <QuickAction label="View QR Code" sub="Share with your guests" onClick={() => router.push(`/events/${slug}/qr`)}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>} />
        <QuickAction label="Moi Entry" sub="Record moi manually" onClick={() => router.push(`/events/${slug}/moi-entry`)}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>} />
        <QuickAction label="Voice Entry" sub="Speak to record moi" onClick={() => router.push(`/events/${slug}/voice-entry`)}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>} />
        <QuickAction label="Gift Entry" sub="Record gifts" onClick={() => router.push(`/events/${slug}/gift-entry`)}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round"><path d="M20 12V8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v4"/><rect x="4" y="12" width="16" height="8" rx="2"/><path d="M12 12v4"/><path d="M8 16h1"/><path d="M15 16h1"/></svg>} />
      </div>

      <div className="bg-white rounded-2xl border border-[#F3F4F6] mb-5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
          <h3 className="text-sm font-bold text-[#1F2937]">Recent Moi Entries</h3>
          <button type="button" onClick={() => router.push(`/events/${slug}/entries`)} className="text-xs text-[#FFC107] font-semibold flex items-center gap-0.5">
            View All
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <div className="divide-y divide-[#F9FAFB]">
          {entries.slice(0, 5).map((entry, idx) => (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                {getInitials(entry.guest_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1F2937] truncate">{entry.guest_name}</p>
                <p className="text-[10px] text-[#9CA3AF]">
                  {new Date(entry.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-sm font-bold text-[#22C55E]">₹{Number(entry.amount).toLocaleString('en-IN')}</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push(`/events/${slug}/qr`)}
        className="w-full h-[52px] bg-[#FFC107] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#3B1570] active:scale-[0.98] transition-all shadow-lg shadow-purple-200"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share QR Code
      </button>
    </EventLayout>
  );
}
