'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon, { type IconName } from '@/components/ui/Icon';
import { DashboardEntry, DashboardEvent, Event, MoiEntry } from '@/lib/api';
import { dashboardApi } from '@/lib/api';
import EventStatusBadges from '@/components/EventStatusBadges';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features';

interface ModuleDashboardProps {
  events: Event[];
  entries: MoiEntry[];
  onNavigate: (m: Module) => void;
  onNewEvent: () => void;
}

interface DashboardSummary {
  total_events: number;
  total_guests: number;
  total_cash: number;
  total_gold: number;
  total_gifts: number;
  avg_cash_gift: number;
}

const fallbackSummary = (events: Event[], entries: MoiEntry[]) => {
  const cashEntries = entries.filter(e => e.gift_type === 'cash' || !e.gift_type);
  const totalCash = cashEntries.reduce((s, e) => s + Number(e.amount), 0);
  const totalGold = entries.filter(e => e.gift_type === 'gold').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const totalGifts = entries.filter(e => e.gift_type === 'gift').length;

  return {
    total_events: events.length,
    total_guests: entries.length,
    total_cash: totalCash,
    total_gold: totalGold,
    total_gifts: totalGifts,
    avg_cash_gift: cashEntries.length ? Math.round(totalCash / cashEntries.length) : 0,
  };
};

const toDashboardEntry = (entry: MoiEntry): DashboardEntry => ({
  id: entry.id,
  event_id: entry.event_id,
  guest_name: entry.guest_name,
  city: entry.city,
  amount: entry.amount,
  gift_type: entry.gift_type,
  gold_weight: entry.gold_weight,
  gift_description: entry.gift_description,
  payment_mode: entry.payment_mode,
  created_at: entry.created_at,
});

export default function ModuleDashboard({
  events, entries, onNavigate, onNewEvent,
}: ModuleDashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentEntries, setRecentEntries] = useState<DashboardEntry[]>([]);
  const [recentEvents, setRecentEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    dashboardApi.summary()
      .then((res) => {
        if (!mounted) return;
        setSummary(res.summary);
        setRecentEntries(res.recentEntries || []);
        setRecentEvents(res.recentEvents || []);
      })
      .catch(() => {
        if (!mounted) return;
        const fallback = fallbackSummary(events, entries);
        setSummary(fallback);
        setRecentEntries([...entries]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6)
          .map(toDashboardEntry));
        setRecentEvents([...events]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [entries, events]);

  const effectiveSummary = summary || fallbackSummary(events, entries);
  const effectiveRecentEntries = recentEntries.length ? recentEntries : [...entries]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)
    .map(toDashboardEntry);
  const effectiveRecentEvents = recentEvents.length ? recentEvents : [...events]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

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

  const getEventDisplayName = (ev: Event | DashboardEvent) => {
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

  const stats = [
    { label: 'Total Events',   value: String(effectiveSummary.total_events),  icon: 'wedding' as IconName, bg: 'bg-tn-yellow-bg border-tn-yellow-border' },
    { label: 'Total Cash',     value: `₹${effectiveSummary.total_cash.toLocaleString('en-IN')}`, icon: 'wallet' as IconName, bg: 'bg-green-50 border-green-200' },
    { label: 'Total Gold',     value: `${effectiveSummary.total_gold}g`,        icon: 'sparkle' as IconName, bg: 'bg-tn-gold-bg border-tn-gold-border' },
    { label: 'Total Gifts',    value: `${effectiveSummary.total_gifts} items`,  icon: 'gift' as IconName, bg: 'bg-red-50 border-red-200' },
    { label: 'Total Guests',   value: String(effectiveSummary.total_guests), icon: 'users' as IconName, bg: 'bg-blue-50 border-blue-200' },
    {
      label: 'Avg Cash Gift',
      value: `₹${effectiveSummary.avg_cash_gift.toLocaleString('en-IN')}`,
      icon: 'trend' as IconName,
      bg: 'bg-purple-50 border-purple-200',
    },
  ];

  const eventById = useMemo(() => {
    return new Map(events.map(ev => [ev.id, ev]));
  }, [events]);

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-tn-border bg-white p-4 animate-pulse">
              <div className="h-6 w-6 rounded-full bg-tn-border" />
              <div className="h-6 w-20 rounded bg-tn-border mt-3" />
              <div className="h-3 w-16 rounded bg-tn-border mt-2" />
            </div>
          ))
        ) : stats.map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <span className="text-2xl text-tn-gold">
              <Icon name={s.icon} size={24} />
            </span>
            <p className="text-lg font-bold text-tn-text mt-2 whitespace-nowrap overflow-hidden text-ellipsis">{s.value}</p>
            <p className="text-[10px] text-tn-muted mt-0.5 truncate">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Moi Entries */}
        <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-tn-border">
            <h3 className="font-semibold text-tn-text text-sm">Recent Moi Entries</h3>
            <button onClick={() => onNavigate('moi-notebook')} className="text-xs text-tn-yellow font-semibold hover:underline">
              View all
            </button>
          </div>
          {loading ? (
            <div className="divide-y divide-tn-border">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-8 w-8 rounded-full bg-tn-border" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 rounded bg-tn-border" />
                    <div className="h-3 w-40 rounded bg-tn-border" />
                  </div>
                  <div className="h-3 w-16 rounded bg-tn-border" />
                </div>
              ))}
            </div>
          ) : effectiveRecentEntries.length === 0 ? (
            <div className="py-10 text-center text-tn-muted text-sm">No moi entries yet</div>
          ) : (
            <div className="divide-y divide-tn-border">
              {effectiveRecentEntries.map((e) => {
                const ev = eventById.get(e.event_id);
                const eventTitle = ev ? getEventDisplayName(ev) : `${e.custom_title || e.event_type || 'Event'} - ${e.wedding_date ? new Date(e.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}`.trim();
                return (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-tn-yellow-bg border border-tn-yellow-border flex items-center justify-center text-tn-gold font-bold text-xs shrink-0">
                      {e.guest_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-tn-text truncate">{e.guest_name}</p>
                      <p className="text-xs text-tn-muted truncate">
                        {eventTitle} · {e.city ? `${e.city} · ` : ''}{e.payment_mode}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-tn-text">
                        {e.gift_type === 'gold' ? `${Number(e.gold_weight || 0)}g Gold` : e.gift_type === 'gift' ? e.gift_description || 'Gift' : `₹${Number(e.amount).toLocaleString('en-IN')}`}
                      </p>
                      <p className="text-[10px] text-tn-muted">
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
        <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-tn-border">
            <h3 className="font-semibold text-tn-text text-sm">Recent Events</h3>
            <button onClick={() => onNavigate('events')} className="text-xs text-tn-yellow font-semibold hover:underline">
              View all
            </button>
          </div>
          {loading ? (
            <div className="divide-y divide-tn-border">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-8 w-8 rounded-full bg-tn-border" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-36 rounded bg-tn-border" />
                    <div className="h-3 w-24 rounded bg-tn-border" />
                  </div>
                  <div className="h-6 w-16 rounded bg-tn-border" />
                </div>
              ))}
            </div>
          ) : effectiveRecentEvents.length === 0 ? (
            <div className="py-10 text-center text-sm text-tn-muted">
              No events yet.{' '}
              <button onClick={onNewEvent} className="text-tn-yellow font-semibold hover:underline">
                Create one →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-tn-border">
              {effectiveRecentEvents.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-tn-light flex items-center justify-center text-tn-gold shrink-0">
                    <Icon name={getEventIcon(ev.event_type)} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-tn-text truncate">
                      {getEventDisplayName(ev)}
                    </p>
                    <p className="text-xs text-tn-muted">
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
      <div className="bg-white border border-tn-border rounded-xl p-5">
        <h3 className="font-semibold text-tn-text text-sm mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={onNewEvent}
            className="flex flex-col items-center gap-2 bg-tn-yellow text-black px-4 py-4 rounded-xl text-sm font-semibold hover:bg-tn-yellow-2 transition-colors shadow-sm"
          >
            <Icon name="plus" size={22} />
            <span>New Event</span>
          </button>
          <button
            onClick={() => onNavigate('moi-notebook')}
            className="flex flex-col items-center gap-2 bg-tn-light border border-tn-border text-tn-text px-4 py-4 rounded-xl text-sm font-medium hover:border-tn-yellow hover:bg-tn-yellow-bg transition-colors"
          >
            <Icon name="list" size={22} />
            <span>Moi Notebook</span>
          </button>
          <button
            onClick={() => onNavigate('analytics')}
            className="flex flex-col items-center gap-2 bg-tn-light border border-tn-border text-tn-text px-4 py-4 rounded-xl text-sm font-medium hover:border-tn-yellow hover:bg-tn-yellow-bg transition-colors"
          >
            <Icon name="trend" size={22} />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => onNavigate('events')}
            className="flex flex-col items-center gap-2 bg-tn-light border border-tn-border text-tn-text px-4 py-4 rounded-xl text-sm font-medium hover:border-tn-yellow hover:bg-tn-yellow-bg transition-colors"
          >
            <Icon name="wedding" size={22} />
            <span>All Events</span>
          </button>
          <button
            onClick={() => onNavigate('users')}
            className="flex flex-col items-center gap-2 bg-tn-light border border-tn-border text-tn-text px-4 py-4 rounded-xl text-sm font-medium hover:border-tn-yellow hover:bg-tn-yellow-bg transition-colors"
          >
            <Icon name="users" size={22} />
            <span>Guests</span>
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="flex flex-col items-center gap-2 bg-tn-light border border-tn-border text-tn-text px-4 py-4 rounded-xl text-sm font-medium hover:border-tn-yellow hover:bg-tn-yellow-bg transition-colors"
          >
            <Icon name="settings" size={22} />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}