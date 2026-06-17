'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventsApi, moiApi, Event } from '@/lib/api';
import EventLayout, { EventDetailsRow } from '@/components/event/EventLayout';

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

export default function EventDashboardEmptyStateScreen() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const eventData = await eventsApi.get(slug);
      if (eventData.approval_status === 'pending') {
        router.replace(`/events/${slug}/pending`);
        return;
      }
      setEvent(eventData);
      const entriesData = await moiApi.list(eventData.id);
      if ((entriesData.entries || []).length > 0) {
        router.replace(`/events/${slug}/dashboard`);
        return;
      }
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
      </div>
    );
  }

  const title = event.custom_title || (event.bride_name && event.groom_name ? `${event.bride_name} & ${event.groom_name}` : event.event_type);
  const eventWithTime = { ...event, wedding_time: (event as Event & { wedding_time?: string }).wedding_time };

  return (
    <EventLayout slug={slug} activeTab="dashboard" title={title} notificationCount={2}>
      <EventDetailsRow event={eventWithTime} />

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#1F2937]">Live Collection Overview</h3>
        <span className="text-xs text-[#FFC107] font-semibold flex items-center gap-0.5">
          View Details
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-5">
        <StatCard bg="bg-[#F5F3FF]" label="Total Collection" value="₹0" sub="Today"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>} />
        <StatCard bg="bg-[#EFF6FF]" label="Total Contributors" value="0" sub="Today"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
        <StatCard bg="bg-[#F0FFF4]" label="Average / Entry" value="₹0"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>} />
        <StatCard bg="bg-[#FFFBEB]" label="Top Amount" value="₹0"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/></svg>} />
      </div>

      <div className="flex justify-between gap-2 mb-6">
        <QuickAction label="View QR Code" sub="Show QR to your guests" onClick={() => router.push(`/events/${slug}/qr`)}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>} />
        <QuickAction label="Add Manual Entry" sub="Record moi manually" onClick={() => router.push(`/events/${slug}/moi-entry`)}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>} />
        <QuickAction label="Moi Entries" sub="View all moi entries" onClick={() => router.push(`/events/${slug}/entries`)}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>} />
        <QuickAction label="Reports" sub="See collections and reports" onClick={() => router.push(`/events/${slug}/reports`)}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>} />
      </div>

      <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 mb-5 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-[#EDE9FE] flex items-center justify-center mb-4">
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
            <rect x="12" y="20" width="40" height="28" rx="3" stroke="#FFC107" strokeWidth="2" fill="#F5F3FF"/>
            <path d="M32 12 L44 20 H20 Z" stroke="#FFC107" strokeWidth="2" fill="#EDE9FE"/>
            <path d="M38 8 L48 14" stroke="#FFC107" strokeWidth="2" strokeLinecap="round"/>
            <path d="M40 6 L50 12" stroke="#FFC107" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="text-base font-bold text-[#1F2937] mb-2">No Moi Entries Yet!</h3>
        <p className="text-sm text-[#6B7280] max-w-[240px] mx-auto mb-5">
          Share your QR code with your guests to start collecting Moi.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/events/${slug}/qr`)}
          className="w-full h-[48px] bg-[#FFC107] text-white rounded-xl font-semibold flex items-center justify-center gap-2 mb-3 hover:bg-[#3B1570]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share QR Code
        </button>
        <button
          type="button"
          onClick={() => router.push(`/events/${slug}/moi-entry`)}
          className="w-full h-[48px] border-2 border-[#FFC107] text-[#FFC107] rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          Add Manual Entry
        </button>
      </div>
    </EventLayout>
  );
}
