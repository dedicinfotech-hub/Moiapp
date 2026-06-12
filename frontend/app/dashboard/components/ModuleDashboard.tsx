'use client';

import { Event, MoiEntry } from '@/lib/api';
import EventStatusBadges from '@/components/EventStatusBadges';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features';

interface ModuleDashboardProps {
  events: Event[];
  entries: MoiEntry[];
  onNavigate: (m: Module) => void;
  onNewEvent: () => void;
}

export default function ModuleDashboard({
  events, entries, onNavigate, onNewEvent,
}: ModuleDashboardProps) {
  const getEventIcon = (eventType: string) => {
    const icons: Record<string, string> = {
      wedding: '💒',
      birthday: '🎂',
      engagement: '💍',
      valakaappu: '🌺',
      housewarming: '🏠',
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

  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);
  const recentEvents = [...events]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  const totalCash = entries.filter(e => e.gift_type === 'cash' || !e.gift_type).reduce((s, e) => s + Number(e.amount), 0);
  const totalGold = entries.filter(e => e.gift_type === 'gold').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const totalGifts = entries.filter(e => e.gift_type === 'gift').length;

  const stats = [
    { label: 'Total Events',   value: String(events.length),  icon: '💍', bg: 'bg-[#FFFCF5] border-[#FFE082]' },
    { label: 'Total Cash',     value: `₹${totalCash.toLocaleString('en-IN')}`, icon: '💰', bg: 'bg-[#F0FFF4] border-[#BBF7D0]' },
    { label: 'Total Gold',     value: `${totalGold}g`,        icon: '✨', bg: 'bg-[#FFF9E6] border-[#FFE082]' },
    { label: 'Total Gifts',    value: `${totalGifts} items`,  icon: '🎁', bg: 'bg-[#FFF5F5] border-[#FECACA]' },
    { label: 'Total Guests',   value: String(entries.length), icon: '👥', bg: 'bg-[#EFF6FF] border-[#BFDBFE]' },
    {
      label: 'Avg Cash Gift',
      value: entries.filter(e => e.gift_type === 'cash' || !e.gift_type).length
        ? `₹${Math.round(totalCash / entries.filter(e => e.gift_type === 'cash' || !e.gift_type).length).toLocaleString('en-IN')}`
        : '₹0',
      icon: '📈',
      bg: 'bg-[#FDF4FF] border-[#E9D5FF]',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <span className="text-2xl">{s.icon}</span>
            <p className="text-lg font-bold text-[#101010] mt-2 whitespace-nowrap overflow-hidden text-ellipsis">{s.value}</p>
            <p className="text-[10px] text-[#666] mt-0.5 truncate">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Moi Entries */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F5F5F5]">
            <h3 className="font-semibold text-[#101010] text-sm">Recent Moi Entries</h3>
            <button onClick={() => onNavigate('moi-notebook')} className="text-xs text-[#FFC107] font-semibold hover:underline">
              View all
            </button>
          </div>
          {recentEntries.length === 0 ? (
            <div className="py-10 text-center text-[#bbb] text-sm">No moi entries yet</div>
          ) : (
            <div className="divide-y divide-[#F8F8F8]">
              {recentEntries.map((e) => {
                const ev = events.find((ev) => ev.id === e.event_id);
                return (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-[#FFFCF5] border border-[#FFE082] flex items-center justify-center text-[#B8860B] font-bold text-xs shrink-0">
                      {e.guest_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#101010] truncate">{e.guest_name}</p>
                      <p className="text-xs text-[#999] truncate">
                        {ev ? getEventDisplayName(ev) : '—'} · {e.city ? `${e.city} · ` : ''}{e.payment_mode}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#101010]">
                        {e.gift_type === 'gold' ? `✨ ${e.gold_weight}g Gold` : e.gift_type === 'gift' ? `🎁 ${e.gift_description}` : `₹${Number(e.amount).toLocaleString('en-IN')}`}
                      </p>
                      <p className="text-[10px] text-[#bbb]">
                        {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent events */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F5F5F5]">
            <h3 className="font-semibold text-[#101010] text-sm">Recent Events</h3>
            <button onClick={() => onNavigate('events')} className="text-xs text-[#FFC107] font-semibold hover:underline">
              View all
            </button>
          </div>
          {recentEvents.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#bbb]">
              No events yet.{' '}
              <button onClick={onNewEvent} className="text-[#FFC107] font-semibold hover:underline">
                Create one →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#F8F8F8]">
              {recentEvents.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center text-base shrink-0">
                    {getEventIcon(ev.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#101010] truncate">
                      {getEventDisplayName(ev)}
                    </p>
                    <p className="text-xs text-[#999]">
                      {new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {ev.venue && ` · ${ev.venue}`}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <EventStatusBadges event={ev} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
        <h3 className="font-semibold text-[#101010] text-sm mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onNewEvent}
            className="flex items-center gap-2 bg-[#FFC107] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors"
          >
            💍 New Event
          </button>
          <button
            onClick={() => onNavigate('moi-notebook')}
            className="flex items-center gap-2 border border-[#E8E8E8] text-[#444] px-4 py-2 rounded-lg text-sm font-medium hover:border-[#FFC107] transition-colors"
          >
            📓 Moi Notebook
          </button>
          <button
            onClick={() => onNavigate('analytics')}
            className="flex items-center gap-2 border border-[#E8E8E8] text-[#444] px-4 py-2 rounded-lg text-sm font-medium hover:border-[#FFC107] transition-colors"
          >
            📈 Analytics
          </button>
        </div>
      </div>
    </div>
  );
}