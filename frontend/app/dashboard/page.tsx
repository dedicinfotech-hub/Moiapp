'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { eventsApi, moiApi, exportCSV, Event, MoiEntry, authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

type Module = 'dashboard' | 'events' | 'payments' | 'users' | 'analytics' | 'settings';

const NAV: { id: Module; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: '📊' },
  { id: 'events',    label: 'Events',     icon: '💍' },
  { id: 'payments',  label: 'Payments',   icon: '💰' },
  { id: 'users',     label: 'Users',      icon: '👥' },
  { id: 'analytics', label: 'Analytics',  icon: '📈' },
  { id: 'settings',  label: 'Settings',   icon: '⚙️'  },
];

const MODULE_SUBTITLE: Record<Module, string> = {
  dashboard:  'Overview of your Moi activity',
  events:     'Manage all wedding events',
  payments:   'Track all moi payments',
  users:      'Guest & user management',
  analytics:  'Performance & insights',
  settings:   'Account & preferences',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [module,   setModule]   = useState<Module>('dashboard');
  const [sideOpen, setSideOpen] = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [events,     setEvents]     = useState<Event[]>([]);
  const [allEntries, setAllEntries] = useState<MoiEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('module') as Module;
      if (mod && ['dashboard', 'events', 'payments', 'users', 'analytics', 'settings'].includes(mod)) {
        setModule(mod);
      }
    }
  }, []);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const evs = await eventsApi.list();
      setEvents(evs);
      const results = await Promise.all(
        evs.map((ev) => moiApi.list(ev.id).catch(() => ({ entries: [] as MoiEntry[] })))
      );
      setAllEntries(results.flatMap((r) => r.entries));
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (authLoading || dataLoading) {
    return (
      <div className="h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
          <p className="text-[#666] text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  const totalMoi = allEntries.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <>
      {/* ── Full-screen shell ── */}
      <div className="h-screen flex overflow-hidden bg-[#f5f5f5]">

        {/* Mobile overlay */}
        {sideOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSideOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-white border-r border-[#EBEBEB]',
            'transition-transform duration-200 ease-in-out',
            sideOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:relative lg:translate-x-0 lg:flex lg:shrink-0',
          ].join(' ')}
        >
          {/* Logo row */}
          <div className="h-14 flex items-center gap-2 px-5 border-b border-[#EBEBEB] shrink-0">
            <Link href="/" className="font-extrabold text-lg text-[#101010] leading-none">
              Moi<span className="text-[#FFC107]">App</span>
            </Link>
            <span className="text-[9px] font-bold bg-[#FFC107] text-black px-1.5 py-0.5 rounded uppercase tracking-wider">
              Admin
            </span>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-3">
            <p className="text-[10px] font-semibold text-[#BBBBBB] uppercase tracking-widest px-5 mb-1">
              Menu
            </p>
            {NAV.map((item) => {
              const active = module === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setModule(item.id); setSideOpen(false); }}
                  className={[
                    'w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors text-left',
                    active
                      ? 'bg-[#FFFBEE] text-[#101010] border-r-[3px] border-[#FFC107]'
                      : 'text-[#666] hover:bg-[#fafafa] hover:text-[#101010]',
                  ].join(' ')}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="border-t border-[#EBEBEB] px-4 py-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FFC107] flex items-center justify-center text-black font-bold text-sm shrink-0">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#101010] truncate leading-tight">{user?.name}</p>
                <p className="text-[11px] text-[#999] truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { logout(); router.push('/'); }}
                title="Sign out"
                className="text-[#ccc] hover:text-red-400 transition-colors shrink-0 p-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar */}
          <header className="h-14 bg-white border-b border-[#EBEBEB] flex items-center gap-3 px-4 lg:px-6 shrink-0">
            {/* Hamburger */}
            <button
              className="lg:hidden text-[#666] hover:text-[#101010] p-1"
              onClick={() => setSideOpen(true)}
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-[#101010] text-sm capitalize leading-tight">{module}</h1>
              <p className="text-[11px] text-[#999] hidden sm:block">{MODULE_SUBTITLE[module]}</p>
            </div>

            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 bg-[#FFC107] text-black px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Event
            </button>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {module === 'dashboard' && (
              <ModuleDashboard events={events} entries={allEntries} onNavigate={setModule} onNewEvent={() => setShowNew(true)} />
            )}
            {module === 'events'    && <ModuleEvents    events={events} onRefresh={loadAll} onNewEvent={() => setShowNew(true)} onEdit={setEditingEvent} />}
            {module === 'payments'  && <ModulePayments  entries={allEntries} events={events} />}
            {module === 'users'     && <ModuleUsers     events={events} entries={allEntries} />}
            {module === 'analytics' && <ModuleAnalytics events={events} entries={allEntries} totalMoi={totalMoi} />}
            {module === 'settings'  && <ModuleSettings  user={user} onLogout={() => { logout(); router.push('/'); }} />}
          </main>
        </div>
      </div>

      {/* ── New Event Modal ── */}
      {showNew && (
        <NewEventModal
          onClose={() => setShowNew(false)}
          onCreated={() => { loadAll(); setShowNew(false); setModule('events'); }}
        />
      )}

      {/* ── Edit Event Modal ── */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdated={() => { loadAll(); setEditingEvent(null); }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Event Modal
// ─────────────────────────────────────────────────────────────────────────────
function NewEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ bride_name: '', groom_name: '', wedding_date: '', venue: '', description: '' });
  const [coverFile,    setCoverFile]    = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inp = 'w-full border border-[#E8E8E8] rounded-lg px-3 py-2.5 text-sm text-[#101010] placeholder-[#bbb] focus:outline-none focus:border-[#FFC107] transition-colors bg-white';
  const lbl = 'block text-xs font-semibold text-[#555] mb-1.5';

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await eventsApi.create(form);
      if (coverFile) {
        const token = localStorage.getItem('moi_token');
        const fd = new FormData();
        fd.append('event_id', String(res.id));
        fd.append('cover', coverFile);
        await fetch(`${BASE_URL}/events.php?action=cover`, {
          method: 'POST',
          headers: { 'X-Auth-Token': `Bearer ${token}` },
          body: fd,
        });
      }
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={handleBackdrop}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💒</span>
            <div>
              <h2 className="font-bold text-[#101010] text-base leading-tight">New Wedding Event</h2>
              <p className="text-[11px] text-[#999]">புதிய திருமண நிகழ்வு</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-[#999] hover:bg-[#F5F5F5] hover:text-[#101010] transition-colors text-lg">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm">{error}</div>}

          {/* Cover photo */}
          <div>
            <label className={lbl}>Cover Photo</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-xl overflow-hidden border-2 border-dashed transition-colors ${coverPreview ? 'border-[#FFC107]' : 'border-[#E8E8E8] hover:border-[#FFC107]'}`}
            >
              {coverPreview ? (
                <div className="relative h-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-semibold">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="h-24 flex flex-col items-center justify-center gap-1.5 text-[#bbb]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <p className="text-xs font-medium">Click to upload cover photo</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Bride Name <span className="text-[#FFC107]">*</span></label>
                <input required value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} className={inp} placeholder="Priya" />
              </div>
              <div>
                <label className={lbl}>Groom Name <span className="text-[#FFC107]">*</span></label>
                <input required value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} className={inp} placeholder="Ravi" />
              </div>
            </div>
            <div>
              <label className={lbl}>Wedding Date <span className="text-[#FFC107]">*</span></label>
              <input required type="date" value={form.wedding_date} onChange={(e) => setForm({ ...form, wedding_date: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Venue</label>
              <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className={inp} placeholder="Sri Murugan Mahal, Chennai" />
            </div>
            <div>
              <label className={lbl}>Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inp} resize-none`} placeholder="A brief note about the wedding…" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 border border-[#E8E8E8] text-[#666] py-2.5 rounded-lg text-sm font-semibold hover:border-[#ccc] transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 bg-[#FFC107] text-black py-2.5 rounded-lg text-sm font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50">
                {loading ? 'Creating…' : 'Create Event →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module: Dashboard Overview
// ─────────────────────────────────────────────────────────────────────────────
function ModuleDashboard({
  events, entries, onNavigate, onNewEvent,
}: {
  events: Event[];
  entries: MoiEntry[];
  onNavigate: (m: Module) => void;
  onNewEvent: () => void;
}) {
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
        {/* Recent payments */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F5F5F5]">
            <h3 className="font-semibold text-[#101010] text-sm">Recent Payments</h3>
            <button onClick={() => onNavigate('payments')} className="text-xs text-[#FFC107] font-semibold hover:underline">
              View all
            </button>
          </div>
          {recentEntries.length === 0 ? (
            <div className="py-10 text-center text-[#bbb] text-sm">No payments yet</div>
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
                        {ev ? `${ev.bride_name} & ${ev.groom_name}` : '—'} · {e.city ? `${e.city} · ` : ''}{e.payment_mode}
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
                    💍
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#101010] truncate">
                      {ev.bride_name} &amp; {ev.groom_name}
                    </p>
                    <p className="text-xs text-[#999]">
                      {new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {ev.venue && ` · ${ev.venue}`}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ev.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {ev.is_active ? 'Active' : 'Draft'}
                  </span>
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
            onClick={() => onNavigate('payments')}
            className="flex items-center gap-2 border border-[#E8E8E8] text-[#444] px-4 py-2 rounded-lg text-sm font-medium hover:border-[#FFC107] transition-colors"
          >
            💰 Payments
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

// ─────────────────────────────────────────────────────────────────────────────
// Module: Events
// ─────────────────────────────────────────────────────────────────────────────
function ModuleEvents({
  events, onRefresh, onNewEvent, onEdit,
}: {
  events: Event[];
  onRefresh: () => void;
  onNewEvent: () => void;
  onEdit: (ev: Event) => void;
}) {
  const [search,   setSearch]   = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);
  const itemsPerPage = 10;

  const filtered = events.filter((ev) =>
    `${ev.bride_name} ${ev.groom_name} ${ev.venue}`.toLowerCase().includes(search.toLowerCase())
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
                          <div className="w-8 h-8 rounded-full bg-[#FFFCF5] border border-[#FFE082] flex items-center justify-center text-base shrink-0">💍</div>
                          <div>
                            <p className="font-semibold text-[#101010]">{ev.bride_name} &amp; {ev.groom_name}</p>
                            <p className="text-xs text-[#bbb]">/{ev.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[#666] hidden md:table-cell whitespace-nowrap">
                        {new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 text-[#666] hidden lg:table-cell max-w-[160px] truncate">{ev.venue || '—'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${ev.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {ev.is_active ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {/* 👤 Add Moi (manual entry) */}
                          <Link
                            href={`/events/${ev.slug}`}
                            title="Add manual moi entry"
                            className="p-1.5 text-[#bbb] hover:text-[#FFC107] transition-colors rounded"
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
                      <div className="w-8 h-8 rounded-full bg-[#FFFCF5] border border-[#FFE082] flex items-center justify-center text-base shrink-0">💍</div>
                      <div>
                        <p className="font-semibold text-[#101010] text-sm">{ev.bride_name} &amp; {ev.groom_name}</p>
                        <p className="text-xs text-[#bbb]">/{ev.slug}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {ev.is_active ? 'Active' : 'Draft'}
                    </span>
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
                        href={`/events/${ev.slug}`}
                        title="Add manual moi entry"
                        className="p-1.5 text-[#bbb] hover:text-[#FFC107] transition-colors rounded"
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



// ─────────────────────────────────────────────────────────────────────────────
// Module: Payments
// ─────────────────────────────────────────────────────────────────────────────
function ModulePayments({ entries, events }: { entries: MoiEntry[]; events: Event[] }) {
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
            <option key={ev.id} value={String(ev.id)}>{ev.bride_name} &amp; {ev.groom_name}</option>
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

// ─────────────────────────────────────────────────────────────────────────────
// Module: Users
// ─────────────────────────────────────────────────────────────────────────────
function ModuleUsers({ entries }: { events: Event[]; entries: MoiEntry[] }) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  interface GuestSummary {
    name: string;
    count: number;
    total: number;
    lastDate: string;
    eventIds: Set<number>;
  }

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

// ─────────────────────────────────────────────────────────────────────────────
// Module: Analytics
// ─────────────────────────────────────────────────────────────────────────────
function ModuleAnalytics({ events, entries, totalMoi }: { events: Event[]; entries: MoiEntry[]; totalMoi: number }) {
  const eventStats = events.map((ev) => {
    const evE   = entries.filter((e) => e.event_id === ev.id);
    const evT   = evE.reduce((s, e) => s + Number(e.amount), 0);
    return { ev, count: evE.length, total: evT, avg: evE.length ? Math.round(evT / evE.length) : 0 };
  }).sort((a, b) => b.total - a.total);

  const byRelation = entries.reduce((acc: Record<string, number>, e) => {
    acc[e.relation] = (acc[e.relation] || 0) + Number(e.amount); return acc;
  }, {} as Record<string, number>);
  const byMode = entries.reduce((acc: Record<string, number>, e) => {
    acc[e.payment_mode] = (acc[e.payment_mode] || 0) + Number(e.amount); return acc;
  }, {} as Record<string, number>);
  const top5 = [...entries].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5);

  const relEmoji: Record<string, string> = { family: '👨‍👩‍👧', friend: '👫', colleague: '💼', other: '🤝' };
  const payEmoji: Record<string, string> = { cash: '💵', upi: '📱', card: '💳', cheque: '📄' };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Collected', value: `₹${totalMoi.toLocaleString('en-IN')}`, icon: '💰' },
          { label: 'Total Entries',   value: String(entries.length),                  icon: '📋' },
          { label: 'Active Events',   value: String(events.filter((e) => e.is_active).length), icon: '💍' },
          { label: 'Avg Gift',        value: entries.length ? `₹${Math.round(totalMoi / entries.length).toLocaleString('en-IN')}` : '₹0', icon: '📊' },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-[#EBEBEB] rounded-xl p-4">
            <span className="text-2xl">{k.icon}</span>
            <p className="text-xl font-bold text-[#101010] mt-2">{k.value}</p>
            <p className="text-xs text-[#999] mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By Relation */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <h3 className="font-semibold text-[#101010] text-sm mb-4">By Relation</h3>
          {Object.keys(byRelation).length === 0 ? (
            <p className="text-[#bbb] text-sm">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byRelation).sort((a, b) => b[1] - a[1]).map(([rel, amt]) => {
                const pct = totalMoi ? Math.round((amt / totalMoi) * 100) : 0;
                return (
                  <div key={rel}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#444] capitalize">{relEmoji[rel]} {rel}</span>
                      <span className="text-sm font-semibold text-[#101010]">
                        ₹{amt.toLocaleString('en-IN')} <span className="text-[#bbb] font-normal text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                      <div className="h-full bg-[#FFC107] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Payment Mode */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <h3 className="font-semibold text-[#101010] text-sm mb-4">By Payment Mode</h3>
          {Object.keys(byMode).length === 0 ? (
            <p className="text-[#bbb] text-sm">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byMode).sort((a, b) => b[1] - a[1]).map(([mode, amt]) => {
                const pct = totalMoi ? Math.round((amt / totalMoi) * 100) : 0;
                return (
                  <div key={mode}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#444] capitalize">{payEmoji[mode]} {mode}</span>
                      <span className="text-sm font-semibold text-[#101010]">
                        ₹{amt.toLocaleString('en-IN')} <span className="text-[#bbb] font-normal text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                      <div className="h-full bg-[#101010] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top events */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#F5F5F5]">
          <h3 className="font-semibold text-[#101010] text-sm">Top Performing Events</h3>
        </div>
        {eventStats.length === 0 ? (
          <div className="py-10 text-center text-[#bbb] text-sm">No events yet.</div>
        ) : (
          <div className="divide-y divide-[#F8F8F8]">
            {eventStats.map(({ ev, count, total, avg }, i) => (
              <div key={ev.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="text-lg shrink-0">{['🥇','🥈','🥉','4️⃣','5️⃣'][i] ?? `${i+1}.`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#101010] text-sm truncate">{ev.bride_name} &amp; {ev.groom_name}</p>
                  <p className="text-xs text-[#999]">{count} guests · avg ₹{avg.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#101010]">₹{total.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-[#bbb]">collected</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top contributors */}
      {top5.length > 0 && (
        <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F5F5F5]">
            <h3 className="font-semibold text-[#101010] text-sm">🏆 Top Contributors</h3>
          </div>
          <div className="divide-y divide-[#F8F8F8]">
            {top5.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-lg shrink-0">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#101010] text-sm">{e.guest_name}</p>
                  <p className="text-xs text-[#999] capitalize">{e.relation} · {e.payment_mode}</p>
                </div>
                <span className="font-bold text-[#101010]">₹{Number(e.amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module: Settings
// ─────────────────────────────────────────────────────────────────────────────
function ModuleSettings({ user, onLogout }: { user: { id: number; name: string; email: string; phone?: string; upi_id?: string; bank_name?: string; account_number?: string; ifsc_code?: string; account_holder?: string } | null; onLogout: () => void }) {
  const [form, setForm] = useState({
    name:           user?.name           ?? '',
    phone:          user?.phone          ?? '',
    upi_id:         user?.upi_id         ?? '',
    bank_name:      user?.bank_name      ?? '',
    account_number: user?.account_number ?? '',
    ifsc_code:      user?.ifsc_code      ?? '',
    account_holder: user?.account_holder ?? '',
  });
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const inp = 'w-full border border-[#E8E8E8] rounded-lg px-3 py-2.5 text-sm text-[#101010] focus:outline-none focus:border-[#FFC107] transition-colors bg-white placeholder-[#bbb]';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const res = await authApi.updateProfile(form);
      // Update localStorage so Navbar/sidebar reflect new name immediately
      const stored = localStorage.getItem('moi_user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('moi_user', JSON.stringify({ ...u, ...res.user }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const hasPaymentDetails = form.upi_id || form.account_number;

  return (
    <div className="max-w-xl space-y-5">
      {/* Profile */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <h3 className="font-semibold text-[#101010] text-sm">Profile</h3>
          <p className="text-xs text-[#999] mt-0.5">Your name and contact details</p>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2.5 text-sm">✓ Changes saved</div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1.5">Display Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1.5">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1.5">Email</label>
            <input value={user?.email ?? ''} disabled className={`${inp} bg-[#fafafa] text-[#bbb] cursor-not-allowed`} />
            <p className="text-[10px] text-[#ccc] mt-1">Email cannot be changed</p>
          </div>

          {/* ── Payment Details ── */}
          <div className="border-t border-[#F5F5F5] pt-4">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-[#101010]">💳 Payment Details</h4>
              {hasPaymentDetails && (
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Saved</span>
              )}
            </div>
            <p className="text-xs text-[#999] mb-4 leading-relaxed">
              Add your UPI ID or bank account so guests know where to transfer moi.
              These details are shown on your event page when guests choose to pay offline.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#555] mb-1.5">UPI ID</label>
                <input value={form.upi_id} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} className={inp} placeholder="yourname@upi" />
              </div>

              <div className="bg-[#fafafa] border border-[#F0F0F0] rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-[#666]">Bank Account (optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#777] mb-1">Account Holder Name</label>
                    <input value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} className={inp} placeholder="As per bank records" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#777] mb-1">Bank Name</label>
                    <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} className={inp} placeholder="SBI / HDFC / etc." />
                  </div>
                  <div>
                    <label className="block text-xs text-[#777] mb-1">Account Number</label>
                    <input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} className={inp} placeholder="XXXXXXXXXXXX" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#777] mb-1">IFSC Code</label>
                    <input value={form.ifsc_code} onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })} className={inp} placeholder="SBIN0001234" />
                  </div>
                </div>
              </div>
            </div>

            {/* How transfer works */}
            <div className="mt-4 bg-[#FFFCF5] border border-[#FFE082] rounded-lg p-4">
              <p className="text-xs font-semibold text-[#B8860B] mb-2">ℹ️ How moi transfer works</p>
              <ul className="text-xs text-[#666] space-y-1.5 leading-relaxed">
                <li>• Guests who pay <strong>UPI / online</strong> — transfer directly to your UPI ID shown on the event page</li>
                <li>• Guests who pay <strong>cash</strong> — hand it over in person; you record it manually in the dashboard</li>
                <li>• Guests who pay <strong>bank transfer</strong> — use the account number above</li>
                <li>• MoiApp does <strong>not</strong> hold or process any money — all transfers go directly to you</li>
              </ul>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="bg-[#FFC107] text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F5F5F5]">
          <h3 className="font-semibold text-[#101010] text-sm">Account</h3>
        </div>
        <div className="divide-y divide-[#F8F8F8]">
          {[
            { label: 'User ID',     sub: 'Internal identifier',  value: `#${user?.id}` },
            { label: 'Plan',        sub: 'Current subscription', value: <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Free</span> },
            { label: 'App Version', sub: 'MoiApp dashboard',     value: 'v1.0.0' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-[#101010]">{row.label}</p>
                <p className="text-xs text-[#999]">{row.sub}</p>
              </div>
              <span className="text-sm text-[#666] font-mono">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-red-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-red-100">
          <h3 className="font-semibold text-red-500 text-sm">Danger Zone</h3>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#101010]">Sign out</p>
            <p className="text-xs text-[#999]">Log out of your account on this device</p>
          </div>
          <button onClick={onLogout}
            className="px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Event Modal
// ─────────────────────────────────────────────────────────────────────────────
function EditEventModal({
  event,
  onClose,
  onUpdated,
}: {
  event: Event;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    bride_name: event.bride_name,
    groom_name: event.groom_name,
    wedding_date: event.wedding_date,
    venue: event.venue || '',
    description: event.description || '',
  });
  const [coverFile,    setCoverFile]    = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(event.cover_photo);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inp = 'w-full border border-[#E8E8E8] rounded-lg px-3 py-2.5 text-sm text-[#101010] placeholder-[#bbb] focus:outline-none focus:border-[#FFC107] transition-colors bg-white';
  const lbl = 'block text-xs font-semibold text-[#555] mb-1.5';

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await eventsApi.update(event.id, form);
      if (coverFile) {
        const token = localStorage.getItem('moi_token');
        const fd = new FormData();
        fd.append('event_id', String(event.id));
        fd.append('cover', coverFile);
        await fetch(`${BASE_URL}/events.php?action=cover`, {
          method: 'POST',
          headers: { 'X-Auth-Token': `Bearer ${token}` },
          body: fd,
        });
      }
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={handleBackdrop}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✏️</span>
            <div>
              <h2 className="font-bold text-[#101010] text-base leading-tight">Edit Wedding Event</h2>
              <p className="text-[11px] text-[#999]">திருமண நிகழ்வு திருத்தம்</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-[#999] hover:bg-[#F5F5F5] hover:text-[#101010] transition-colors text-lg">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm">{error}</div>}

          {/* Cover photo */}
          <div>
            <label className={lbl}>Cover Photo</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-xl overflow-hidden border-2 border-dashed transition-colors ${coverPreview ? 'border-[#FFC107]' : 'border-[#E8E8E8] hover:border-[#FFC107]'}`}
            >
              {coverPreview ? (
                <div className="relative h-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-semibold">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="h-24 flex flex-col items-center justify-center gap-1.5 text-[#bbb]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <p className="text-xs font-medium">Click to upload cover photo</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Bride Name <span className="text-[#FFC107]">*</span></label>
                <input required value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} className={inp} placeholder="Priya" />
              </div>
              <div>
                <label className={lbl}>Groom Name <span className="text-[#FFC107]">*</span></label>
                <input required value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} className={inp} placeholder="Ravi" />
              </div>
            </div>
            <div>
              <label className={lbl}>Wedding Date <span className="text-[#FFC107]">*</span></label>
              <input required type="date" value={form.wedding_date} onChange={(e) => setForm({ ...form, wedding_date: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Venue</label>
              <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className={inp} placeholder="Sri Murugan Mahal, Chennai" />
            </div>
            <div>
              <label className={lbl}>Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inp} resize-none`} placeholder="A brief note about the wedding…" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 border border-[#E8E8E8] text-[#666] py-2.5 rounded-lg text-sm font-semibold hover:border-[#ccc] transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 bg-[#FFC107] text-black py-2.5 rounded-lg text-sm font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50">
                {loading ? 'Saving…' : 'Save Changes →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
