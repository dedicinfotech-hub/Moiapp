'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Icon, { type IconName } from '@/components/ui/Icon';
import { eventsApi, moiApi, photosApi, invitationsApi, returnGiftsApi, exportCSV, showSuccess, showError, Event, MoiEntry, Photo, Invitation, ReturnGift } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useFeatures } from '@/lib/features';
import { getAppSidebarSections } from '@/lib/navigation';
import { canAddMoi, getEventDisplayName } from '@/lib/eventHelpers';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import ConfirmModal from '@/components/ConfirmModal';
import AppSidebar from '@/components/AppSidebar';
import ApprovalBanner from '@/components/ApprovalBanner';
import EventQrPanel from '@/components/EventQrPanel';

// In static export useParams() always returns the placeholder slug '_'.
// Read the real slug from the URL path instead.
function useSlug(): string {
  const [slug, setSlug] = useState('');
  useEffect(() => {
    let path = window.location.pathname.split('?')[0].split('#')[0];
    path = path.replace(/\/(index\.html?)$/i, '');
    path = path.replace(/\/$/, '');
    const parts = path.split('/');
    const s = parts[parts.length - 1];
    setSlug(s === '_' ? '' : s);
  }, []);
  return slug;
}

type Tab = 'moi' | 'photos' | 'summary' | 'invitations' | 'returns';

const inputCls  = "w-full bg-white border-2 border-tn-border rounded-xl px-3 py-2.5 text-sm text-tn-text placeholder-tn-subtle focus:outline-none focus:border-tn-yellow transition-colors";
const labelCls  = "block text-xs font-semibold text-tn-muted mb-1";
const selectCls = `${inputCls} appearance-none bg-white`;

function EventPageInner() {
  const slug = useSlug();
  const pathname = usePathname();
  const { user, logout, loading: authLoading } = useAuth();
  const { isEnabled } = useFeatures();
  const router = useRouter();
 
  const [event, setEvent]     = useState<Event | null>(null);
  const [entries, setEntries] = useState<MoiEntry[]>([]);
  const [photos, setPhotos]   = useState<Photo[]>([]);
  const [tab, setTab]         = useState<Tab>('moi');
  const [loading, setLoading] = useState(true);
  const [sideOpen, setSideOpen] = useState(false);
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<{ venue: string | null; city: string | null }>({ venue: '', city: '' });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    eventsApi.get(slug).then((ev) => {
      setEvent(ev);
      setSettingsForm({ venue: ev.venue || '', city: ev.city || '' });
      return Promise.all([moiApi.list(ev.id), photosApi.list(ev.id)]);
    }).then(([moiData, photoData]) => {
      setEntries(moiData.entries || []);
      setPhotos(photoData);
    }).finally(() => setLoading(false));
  }, [user, slug]);

  const toggleSidebar = () => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) {
      setSidebarCollapsed((value) => !value);
    } else {
      setSideOpen((value) => !value);
    }
  };

  useEffect(() => {
    setSideOpen(false);
  }, [pathname]);

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
          <p className="text-tn-subtle text-sm">Loading event…</p>
        </div>
      </div>
    );
  }

  const handleResubmit = async () => {
    setResubmitting(true);
    try {
      await eventsApi.resubmit(event.id);
      showSuccess('Function resubmitted for approval');
      const ev = await eventsApi.get(slug);
      setEvent(ev);
    } finally {
      setResubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await eventsApi.update(event.id, {
        venue: settingsForm.venue || null,
        city: settingsForm.city || null
      });
      setEvent({ ...event, venue: settingsForm.venue, city: settingsForm.city });
      showSuccess('Function settings updated');
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  const moiAllowed = canAddMoi(event);
  const safeEntries = Array.isArray(entries) ? entries : [];
  const totalCash = safeEntries.filter(e => e.gift_type === 'cash' || !e.gift_type).reduce((s, e) => s + Number(e.amount), 0);
  const totalGold = safeEntries.filter(e => e.gift_type === 'gold').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const totalSilver = safeEntries.filter(e => e.gift_type === 'silver').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const totalGifts = safeEntries.filter(e => e.gift_type === 'gift').length;
  // Build share URL safely — window is not available during static pre-render
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/e/${event.slug}`
    : `/e/${event.slug}`;

  return (
    <>
      {/* ── Full-screen shell ── */}
      <div className="h-screen flex overflow-hidden bg-tn-light">

        {/* Mobile overlay */}
        {sideOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSideOpen(false)}
          />
        )}

        <AppSidebar
          fixed
          isOpen={sideOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSideOpen(false)}
          adminBadge={user?.role === 'admin'}
          user={user}
          onLogout={() => { logout(); router.push('/'); }}
          sections={getAppSidebarSections({
            isAdmin: user?.role === 'admin',
            isEnabled,
            activeModule: 'events',
          })}
        />
        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-tn-light pb-16 lg:pb-0">

          {/* Top bar */}
          <header className="h-14 bg-white border-b border-tn-border flex items-center gap-3 px-4 lg:px-6 shrink-0">
            {/* Hamburger */}
            <button
              className="text-tn-muted hover:text-tn-text p-1"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? 'Open menu' : 'Close menu'}
            >
              <Icon name="menu" size={20} />
            </button>

            <div className="flex-1 min-w-0">
               <h1 className="font-bold text-tn-text text-sm capitalize leading-tight">
                 {getEventDisplayName(event)}
               </h1>
               <p className="text-[11px] text-tn-subtle hidden sm:block">Event details and moi management</p>
             </div>

            {/* <Link
              href="/dashboard?module=events"
              className="flex items-center gap-1.5 border border-tn-border text-tn-muted px-3.5 py-2 rounded-lg text-sm font-semibold hover:border-tn-yellow transition-colors whitespace-nowrap bg-white hover:bg-tn-light"
            >
              ← Back to Events
            </Link> */}
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-5xl mx-auto space-y-6">

              <ApprovalBanner
                event={event}
                onResubmit={event.approval_status === 'rejected' ? handleResubmit : undefined}
                resubmitting={resubmitting}
              />

              <EventQrPanel
                event={event}
                onUpdate={(patch) => setEvent({ ...event, ...patch })}
              />

              {/* Event header */}
              <div className="bg-white border border-tn-border rounded-2xl p-6 shadow-card">
                <div className="h-1 bg-tn-yellow rounded-full mb-5 -mx-6 -mt-6 rounded-t-2xl" />
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-tn-text">
                      {getEventDisplayName(event)}
                    </h2>
                     <p className="text-tn-subtle text-sm mt-1 flex items-center gap-2 flex-wrap">
                       <span className="inline-flex items-center gap-1"><Icon name="calendar" size={14} /> {new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                       {event.venue && <span>· <span className="inline-flex items-center gap-1"><Icon name="map" size={14} /> {event.venue}</span></span>}
                       {event.city && <span>· <span className="inline-flex items-center gap-1"><Icon name="venue" size={14} /> {event.city}</span></span>}
                     </p>
                   </div>
                  <div className="flex gap-2 flex-wrap shrink-0">
                    <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 px-4 py-2 bg-tn-light border border-tn-border rounded-xl text-sm text-tn-muted hover:bg-tn-yellow-light transition-colors">
                      <Icon name="settings" size={16} /> Settings
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(shareUrl); showSuccess('Share link copied!'); }} className="flex items-center gap-1.5 px-4 py-2 bg-tn-light border border-tn-border rounded-xl text-sm text-tn-muted hover:bg-tn-yellow-light transition-colors">
                      <Icon name="arrow-right" size={16} /> Share
                    </button>
                    <button onClick={() => exportCSV(event.id)} className="flex items-center gap-1.5 px-4 py-2 bg-tn-light border border-tn-border rounded-xl text-sm text-tn-muted hover:bg-tn-yellow-light transition-colors">
                      <Icon name="download" size={16} /> Export CSV
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
                  <div className="bg-tn-yellow-light border border-tn-yellow-text rounded-xl p-4 text-center">
                    <p className="text-lg font-bold text-tn-yellow">₹{totalCash.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Total Cash</p>
                  </div>
                  <div className="bg-tn-yellow-light border border-tn-yellow-text rounded-xl p-4 text-center">
                    <p className="text-lg font-bold text-tn-yellow">{totalGold}g</p>
                    <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Total Gold</p>
                  </div>
                  <div className="bg-tn-light border border-tn-border rounded-xl p-4 text-center">
                    <p className="text-lg font-bold text-tn-muted">{totalSilver}g</p>
                    <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Total Silver</p>
                  </div>
                  <div className="bg-tn-error border border-tn-error rounded-xl p-4 text-center">
                    <p className="text-lg font-bold text-tn-error">{totalGifts}</p>
                    <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Total Gifts</p>
                  </div>
                  <div className="bg-tn-light border border-tn-border rounded-xl p-4 text-center">
                    <p className="text-lg font-bold text-tn-text">{safeEntries.length}</p>
                    <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Guests</p>
                  </div>
                  <div className="bg-tn-light border border-tn-border rounded-xl p-4 text-center col-span-2 md:col-span-1">
                    <p className="text-lg font-bold text-tn-text">{photos.length}</p>
                    <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Photos</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="w-full overflow-x-auto bg-white border border-tn-border rounded-xl p-1 shadow-card">
                <div className="flex gap-1 min-w-max">
                  {(['moi', 'photos', 'summary', 'invitations', 'returns'] as Tab[]).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`shrink-0 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${tab === t ? 'bg-tn-yellow text-white' : 'text-tn-muted hover:text-tn-text'}`}>
                      {t === 'moi' ? <><Icon name="list" size={16} /> Moi Register</> : t === 'photos' ? <><Icon name="photo" size={16} /> Photos</> : t === 'invitations' ? <><Icon name="users" size={16} /> Invitations</> : t === 'returns' ? <><Icon name="gift" size={16} /> Return Tracker</> : <><Icon name="chart" size={16} /> Summary</>}
                    </button>
                  ))}
                </div>
              </div>

              {tab === 'moi'     && <MoiRegisterTab slug={slug} entries={safeEntries} blocked={!moiAllowed} onUpdate={(e) => setEntries(safeEntries.map((en) => en.id === e.id ? e : en))} onDelete={(id) => setEntries(safeEntries.filter((e) => e.id !== id))} />}
                {tab === 'photos'  && <PhotosTab  eventId={event.id} photos={photos}   onAdd={(p) => setPhotos([p, ...photos])}   onDelete={(id) => setPhotos(photos.filter((p) => p.id !== id))} />}
                {tab === 'summary' && <SummaryTab entries={safeEntries} eventId={event.id} />}
                {tab === 'invitations' && <InvitationTab eventId={event.id} entries={safeEntries} />}
                {tab === 'returns' && <ReturnTrackerTab eventId={event.id} entries={safeEntries} />}
        {/* Function Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-tn-text text-lg">Function Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-tn-subtle hover:text-tn-text text-xl" aria-label="Close settings">
                  <Icon name="x" size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className={labelCls}>Venue</label>
                  <div className="relative">
                    <input
                      value={settingsForm.venue ?? ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, venue: e.target.value })}
                      className={`${inputCls}${settingsForm.venue ? ' pr-10' : ''}`}
                      placeholder="Sri Murugan Mahal, Chennai"
                    />
                    {settingsForm.venue && (
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, venue: '' })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-tn-subtle hover:text-tn-error transition-colors"
                        title="Clear venue"
                      >
                        <Icon name="x" size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>City</label>
                  <div className="relative">
                    <input
                      value={settingsForm.city ?? ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                      className={`${inputCls}${settingsForm.city ? ' pr-10' : ''}`}
                      placeholder="Chennai"
                    />
                    {settingsForm.city && (
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, city: '' })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-tn-subtle hover:text-tn-error transition-colors"
                        title="Clear city"
                      >
                        <Icon name="x" size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="bg-tn-yellow text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving…' : 'Save Settings'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-tn-border text-tn-muted hover:bg-tn-light"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default function EventPage() {
  return <EventPageInner />;
}


// ── Moi Register Tab ───────────────────────────────────────────────────────────
function MoiRegisterTab({ slug, entries, blocked, onUpdate, onDelete }: { slug: string; entries: MoiEntry[]; blocked?: boolean; onUpdate: (e: MoiEntry) => void; onDelete: (id: number) => void }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'high' | 'low' | 'date'>('date');
  const [visibleCount, setVisibleCount] = useState(20);
  const [editingEntry, setEditingEntry] = useState<MoiEntry | null>(null);
  const [editForm, setEditForm] = useState({
    guest_name: '',
    amount: '',
    relation: 'friend' as MoiEntry['relation'],
    note: '',
  });
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<number | null>(null);

  const filtered = entries.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      e.guest_name.toLowerCase().includes(q) ||
      (e.relation || '').toLowerCase().includes(q) ||
      (e.city || '').toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    if (sort === 'high') return Number(b.amount) - Number(a.amount);
    if (sort === 'low') return Number(a.amount) - Number(b.amount);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const visibleEntries = filtered.slice(0, visibleCount);

  const openEdit = (entry: MoiEntry) => {
    setEditingEntry(entry);
    setEditForm({
      guest_name: entry.guest_name,
      amount: String(entry.amount ?? ''),
      relation: entry.relation || 'friend',
      note: entry.note || '',
    });
  };

  const saveEdit = async () => {
    if (!editingEntry) return;
    setUpdating(true);
    try {
      await moiApi.update(editingEntry.id, {
        guest_name: editForm.guest_name,
        amount: Number(editForm.amount) || 0,
        relation: editForm.relation,
        note: editForm.note,
      });
      onUpdate({ ...editingEntry, guest_name: editForm.guest_name, amount: Number(editForm.amount) || 0, relation: editForm.relation, note: editForm.note });
      setEditingEntry(null);
    } catch (error) {
      console.error('Failed to update entry:', error);
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await moiApi.delete(id);
      onDelete(id);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-tn-yellow-light border border-tn-yellow-text rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-tn-yellow">₹{entries.filter(e => e.gift_type === 'cash' || !e.gift_type).reduce((s, e) => s + Number(e.amount), 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Total Cash</p>
        </div>
        <div className="bg-tn-light border border-tn-border rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-tn-text">{entries.length}</p>
          <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Total Entries</p>
        </div>
        <div className="bg-tn-light border border-tn-border rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-tn-text">{entries.filter(e => e.gift_type === 'gift').length}</p>
          <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Gifts</p>
        </div>
        <div className="bg-tn-light border border-tn-border rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-tn-text">{entries.filter(e => e.gift_type === 'gold').length}</p>
          <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Gold</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-tn-border rounded-xl pl-9 pr-3 py-2.5 text-xs"
            placeholder="Search by name or relation..."
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-tn-subtle" width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'high' | 'low' | 'date')}
          className="text-xs border border-tn-border rounded-xl px-2 py-2 bg-white"
        >
          <option value="date">Newest</option>
          <option value="high">High → Low</option>
          <option value="low">Low → High</option>
        </select>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
           onClick={() => router.push(`/events/${slug}/moi-entry`)}
           disabled={blocked}
           className="flex flex-col items-center gap-2 p-4 bg-tn-yellow text-white rounded-xl hover:bg-tn-yellow-2 transition-colors disabled:opacity-50"
         >
           <Icon name="list" size={28} />
           <span className="text-xs font-bold">Manual Entry</span>
         </button>
         <button
           onClick={() => router.push(`/events/${slug}/voice-entry`)}
           disabled={blocked}
           className="flex flex-col items-center gap-2 p-4 bg-tn-blue-soft text-white rounded-xl hover:bg-tn-blue-bg transition-colors disabled:opacity-50"
         >
           <Icon name="users" size={28} />
           <span className="text-xs font-bold">Voice Entry</span>
         </button>
         <button
           onClick={() => router.push(`/events/${slug}/gift-entry`)}
           disabled={blocked}
           className="flex flex-col items-center gap-2 p-4 bg-tn-warning text-white rounded-xl hover:bg-tn-warning/80 transition-colors disabled:opacity-50"
         >
           <Icon name="gift" size={28} />
           <span className="text-xs font-bold">Gift Entry</span>
         </button>
      </div>

      {/* Entries List */}
      <div className="bg-white border border-tn-border rounded-2xl overflow-hidden">
        {visibleEntries.length === 0 ? (
          <p className="py-10 text-center text-sm text-tn-subtle">No entries found</p>
        ) : (
          <div className="divide-y divide-tn-border">
            {visibleEntries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-tn-yellow-light flex items-center justify-center text-xs font-bold text-tn-yellow">
                  {entry.guest_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-tn-text truncate">{entry.guest_name}</p>
                  <div className="flex gap-1 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 bg-tn-light rounded-full capitalize">{entry.payment_mode}</span>
                    {entry.gift_type !== 'cash' && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-tn-yellow-light rounded-full capitalize inline-flex items-center gap-1">
                        {entry.gift_type === 'gift' ? <><Icon name="gift" size={12} /> Gift</> : entry.gift_type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-tn-text">
                    {entry.gift_type === 'gift' && !entry.amount ? 'Gift' : `₹${Number(entry.amount).toLocaleString('en-IN')}`}
                  </p>
                  <p className="text-[9px] text-tn-subtle">
                    {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => openEdit(entry)} className="text-[10px] font-semibold text-tn-yellow">Edit</button>
                  <button
                    onClick={() => setConfirmDeleteEntryId(entry.id)}
                    className="text-[10px] font-semibold text-tn-error"
                  >
                    {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {filtered.length > visibleCount && (
        <button
          onClick={() => setVisibleCount(c => c + 20)}
          className="w-full py-2 text-sm text-tn-yellow font-semibold"
        >
          Load More ({filtered.length - visibleCount} remaining)
        </button>
      )}

      <ConfirmModal
        isOpen={confirmDeleteEntryId !== null}
        title="Delete Entry"
        message="Are you sure you want to delete this moi entry?"
        confirmText="Delete"
        variant="danger"
        onConfirm={() => { if (confirmDeleteEntryId) confirmDelete(confirmDeleteEntryId); setConfirmDeleteEntryId(null); }}
        onCancel={() => setConfirmDeleteEntryId(null)}
      />

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingEntry(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-tn-text text-lg mb-4">Edit Entry</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-tn-subtle">Guest Name</label>
                <input
                  value={editForm.guest_name}
                  onChange={(e) => setEditForm(f => ({ ...f, guest_name: e.target.value }))}
                  className="w-full mt-1 bg-white border border-tn-border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-tn-subtle">Amount (₹)</label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full mt-1 bg-white border border-tn-border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-tn-subtle">Relation</label>
                <select
                  value={editForm.relation}
                  onChange={(e) => setEditForm(f => ({ ...f, relation: e.target.value as MoiEntry['relation'] }))}
                  className="w-full mt-1 bg-white border border-tn-border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="family">Family</option>
                  <option value="friend">Friend</option>
                  <option value="colleague">Colleague</option>
                  <option value="relative">Relative</option>
                  <option value="neighbor">Neighbor</option>
                  <option value="business">Business</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditingEntry(null)} className="flex-1 py-2 border border-tn-border rounded-xl text-sm">Cancel</button>
                <button onClick={saveEdit} disabled={updating} className="flex-1 py-2 bg-tn-yellow text-white rounded-xl text-sm disabled:opacity-50">
                  {updating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Photos Tab ────────────────────────────────────────────────────────────────
function PhotosTab({ eventId, photos, onAdd, onDelete }: { eventId: number; photos: Photo[]; onAdd: (p: Photo) => void; onDelete: (id: number) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Photo | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await photosApi.delete(id);
      onDelete(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await photosApi.upload(eventId, file, caption);
      if (res.url) {
        onAdd({ id: res.id, event_id: eventId, s3_key: '', s3_url: res.url, caption, uploaded_at: new Date().toISOString() });
        setCaption('');
        if (fileRef.current) fileRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-tn-border rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-tn-text mb-4">Upload Photos</h2>
        <div className="flex gap-3 flex-wrap mb-3">
          <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" className="bg-tn-light border border-tn-border rounded-xl px-3 py-2.5 text-sm text-tn-text placeholder-tn-subtle focus:outline-none focus:border-tn-yellow transition-colors flex-1 min-w-[180px]" />
        </div>
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className="border-2 border-dashed border-tn-border rounded-2xl p-6 text-center cursor-pointer hover:border-tn-yellow transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
              <p className="text-sm text-tn-subtle">Uploading...</p>
            </div>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-tn-muted mb-3">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p className="text-sm font-semibold text-tn-text mb-1">Drag & Drop</p>
              <p className="text-xs text-tn-subtle">or click to upload photos</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
        </div>
        <p className="text-xs text-tn-subtle mt-2">JPG, PNG, WEBP · Max 10MB</p>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-tn-border text-tn-subtle text-sm">No photos yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-tn-light">
              <Image src={photo.s3_url} alt={photo.caption || 'Wedding photo'} fill className="object-cover cursor-pointer" onClick={() => setPreview(photo)} />
              {photo.caption && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{photo.caption}</div>}
              <button onClick={() => setConfirmDeleteId(photo.id)} className="absolute top-2 right-2 w-7 h-7 bg-tn-error0 text-white rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-3xl w-full">
            <Image src={preview.s3_url} alt={preview.caption || ''} width={900} height={600} className="rounded-xl object-contain max-h-[85vh] w-full" />
            {preview.caption && <p className="text-white text-center mt-2 text-sm">{preview.caption}</p>}
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <ConfirmDeleteModal
          isOpen={confirmDeleteId !== null}
          title="Delete Photo"
          message="Are you sure you want to delete this photo? This action cannot be undone."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
          isLoading={deletingId === confirmDeleteId}
        />
      )}
    </div>
  );
}

// ── Summary Tab ───────────────────────────────────────────────────────────────
function SummaryTab({ entries, eventId }: { entries: MoiEntry[]; eventId: number }) {
  const cashTotal = entries.filter(e => e.gift_type === 'cash' || !e.gift_type).reduce((s, e) => s + Number(e.amount), 0);
  const onlineTotal = entries.filter(e => e.payment_mode !== 'cash' && e.payment_mode && (e.gift_type === 'cash' || !e.gift_type)).reduce((s, e) => s + Number(e.amount), 0);
  const otherTotal = entries.filter(e => e.payment_mode === 'other' && (e.gift_type === 'cash' || !e.gift_type)).reduce((s, e) => s + Number(e.amount), 0);
  const goldWeightTotal = entries.filter(e => e.gift_type === 'gold').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const silverWeightTotal = entries.filter(e => e.gift_type === 'silver').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const giftCount = entries.filter(e => e.gift_type === 'gift').length;
  const goldValueTotal = entries.filter(e => e.gift_type === 'gold').reduce((s, e) => s + Number(e.approximate_value || 0), 0);
  const silverValueTotal = entries.filter(e => e.gift_type === 'silver').reduce((s, e) => s + Number(e.approximate_value || 0), 0);
  const giftValueTotal = entries.filter(e => e.gift_type === 'gift').reduce((s, e) => s + Number(e.approximate_value || 0), 0);
  const nonCashValueTotal = goldValueTotal + silverValueTotal + giftValueTotal;
  const total = cashTotal + onlineTotal + nonCashValueTotal;

  const byRelation = entries.reduce<Record<string, { count: number; total: number }>>((acc, e) => {
    if (!acc[e.relation]) acc[e.relation] = { count: 0, total: 0 };
    acc[e.relation].count++;
    const entryTotal = e.gift_type === 'cash' || !e.gift_type ? Number(e.amount) : Number(e.approximate_value || 0);
    acc[e.relation].total += entryTotal;
    return acc;
  }, {});
  const byPayment = entries.reduce<Record<string, { count: number; total: number }>>((acc, e) => {
    if (!acc[e.payment_mode]) acc[e.payment_mode] = { count: 0, total: 0 };
    acc[e.payment_mode].count++;
    const entryTotal = e.gift_type === 'cash' || !e.gift_type ? Number(e.amount) : Number(e.approximate_value || 0);
    acc[e.payment_mode].total += entryTotal;
    return acc;
  }, {});
  const top3 = [...entries].sort((a, b) => {
    const aVal = a.gift_type === 'cash' || !a.gift_type ? Number(a.amount) : Number(a.approximate_value || 0);
    const bVal = b.gift_type === 'cash' || !b.gift_type ? Number(b.amount) : Number(b.approximate_value || 0);
    return bVal - aVal;
  }).slice(0, 3);
  const relIcon: Record<string, IconName> = { family: 'users', friend: 'users', colleague: 'users', other: 'users' };
   const payIcon: Record<string, IconName> = { cash: 'wallet', upi: 'wallet', card: 'wallet', cheque: 'list', other: 'wallet' };
   const card = "bg-white border border-tn-border rounded-2xl p-6 shadow-sm";
   
   const cashPercent = total > 0 ? Math.round((cashTotal / total) * 100) : 0;
   const onlinePercent = total > 0 ? Math.round((onlineTotal / total) * 100) : 0;
   const otherPercent = total > 0 ? Math.round((otherTotal / total) * 100) : 0;
   const goldPercent = total > 0 ? Math.round((goldWeightTotal / total) * 100) : 0;
   const silverPercent = total > 0 ? Math.round((silverWeightTotal / total) * 100) : 0;
   const giftPercent = total > 0 ? Math.round((giftValueTotal / total) * 100) : 0;
   const goldTotal = goldWeightTotal;
   const silverTotal = silverWeightTotal;

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/pdf.php?event_id=${eventId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moi-report-${eventId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        showError('Failed to download PDF. Please try again.');
      }
    } catch {
        showError('Error downloading PDF. Please try again.');
      }
  };

  const handleWhatsAppShare = async () => {
    const shareUrl = `${window.location.origin}/e/${eventId}`;
    const message = `Moi Report Summary:\nTotal: ₹${total.toLocaleString('en-IN')}\nGuests: ${entries.length}\n\nView full report: ${shareUrl}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${card} text-center`}><p className="text-3xl font-bold text-tn-yellow">₹{total.toLocaleString('en-IN')}</p><p className="text-sm text-tn-subtle mt-1">Total Moi Value</p></div>
        <div className={`${card} text-center`}><p className="text-3xl font-bold text-tn-text">{entries.length}</p><p className="text-sm text-tn-subtle mt-1">Total Guests</p></div>
        <div className={`${card} text-center`}><p className="text-3xl font-bold text-tn-text">₹{entries.length ? Math.round(total / entries.length).toLocaleString('en-IN') : 0}</p><p className="text-sm text-tn-subtle mt-1">Average per Guest</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className={card}>
          <h3 className="font-bold text-tn-text mb-4">By Relation</h3>
          <div className="space-y-3">
            {Object.entries(byRelation).map(([rel, data]) => (
              <div key={rel} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Icon name={relIcon[rel] || 'users'} size={14} /><span className="text-sm text-tn-text capitalize">{rel}</span><span className="text-xs text-tn-subtle">({data.count})</span></div>
                <span className="font-bold text-tn-yellow text-sm">₹{data.total.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={card}>
          <h3 className="font-bold text-tn-text mb-4">By Payment Mode</h3>
          <div className="space-y-3">
            {Object.entries(byPayment).map(([mode, data]) => (
              <div key={mode} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Icon name={payIcon[mode] || 'wallet'} size={14} /><span className="text-sm text-tn-text capitalize">{mode}</span><span className="text-xs text-tn-subtle">({data.count})</span></div>
                <span className="font-bold text-tn-yellow text-sm">₹{data.total.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={card}>
         <h3 className="font-bold text-tn-text mb-4">Payment Type Breakdown</h3>
         <div className="space-y-3">
           <div>
             <div className="flex justify-between text-sm mb-1">
               <span className="text-tn-muted">Cash</span>
               <span className="font-semibold text-tn-success">₹{cashTotal.toLocaleString('en-IN')} ({cashPercent}%)</span>
             </div>
             <div className="w-full bg-tn-border rounded-full h-2">
               <div className="bg-tn-success h-2 rounded-full" style={{ width: `${cashPercent}%` }}></div>
             </div>
           </div>
           <div>
             <div className="flex justify-between text-sm mb-1">
               <span className="text-tn-muted">Online (UPI/Card/Cheque)</span>
               <span className="font-semibold text-tn-blue-soft">₹{onlineTotal.toLocaleString('en-IN')} ({onlinePercent}%)</span>
             </div>
             <div className="w-full bg-tn-border rounded-full h-2">
               <div className="bg-tn-blue-bg h-2 rounded-full" style={{ width: `${onlinePercent}%` }}></div>
             </div>
           </div>
           <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-tn-muted">Other</span>
                <span className="font-semibold text-tn-warning">₹{otherTotal.toLocaleString('en-IN')} ({otherPercent}%)</span>
              </div>
              <div className="w-full bg-tn-border rounded-full h-2">
                <div className="bg-tn-warning h-2 rounded-full" style={{ width: `${otherPercent}%` }}></div>
              </div>
            </div>
         </div>
      </div>

      <div className={card}>
         <h3 className="font-bold text-tn-text mb-4">Non-Cash Contributions</h3>
         <div className="space-y-3">
           <div>
             <div className="flex justify-between text-sm mb-1">
               <span className="text-tn-muted">Gold ({goldWeightTotal}g)</span>
               <span className="font-semibold text-tn-gold">₹{goldValueTotal.toLocaleString('en-IN')} ({goldPercent}%)</span>
             </div>
             <div className="w-full bg-tn-border rounded-full h-2">
               <div className="bg-tn-gold-bg h-2 rounded-full" style={{ width: `${goldPercent}%` }}></div>
             </div>
           </div>
           <div>
             <div className="flex justify-between text-sm mb-1">
               <span className="text-tn-muted">Silver ({silverWeightTotal}g)</span>
               <span className="font-semibold text-tn-text">₹{silverValueTotal.toLocaleString('en-IN')} ({silverPercent}%)</span>
             </div>
             <div className="w-full bg-tn-border rounded-full h-2">
               <div className="bg-tn-muted h-2 rounded-full" style={{ width: `${silverPercent}%` }}></div>
             </div>
           </div>
           <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-tn-muted">Gifts ({giftCount} items)</span>
                <span className="font-semibold text-tn-error">₹{giftValueTotal.toLocaleString('en-IN')}</span>
              </div>
              {giftValueTotal === 0 && (
                <p className="text-xs text-tn-subtle mt-1">Value not recorded for some or all gifts</p>
              )}
              <div className="w-full bg-tn-border rounded-full h-2">
                <div className="bg-tn-error h-2 rounded-full" style={{ width: `${giftValueTotal > 0 ? Math.min(100, giftPercent) : 0}%` }}></div>
              </div>
            </div>
            {otherTotal > 0 && (
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-tn-muted">Other</span>
                 <span className="font-semibold text-tn-warning">₹{otherTotal.toLocaleString('en-IN')} ({otherPercent}%)</span>
               </div>
               <div className="w-full bg-tn-border rounded-full h-2">
                 <div className="bg-tn-warning h-2 rounded-full" style={{ width: `${otherPercent}%` }}></div>
               </div>
             </div>
           )}
           {goldTotal > 0 && (
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-tn-muted">Gold</span>
                 <span className="font-semibold text-tn-gold">{goldTotal}g ({goldPercent}%)</span>
               </div>
               <div className="w-full bg-tn-border rounded-full h-2">
                 <div className="bg-tn-gold-bg h-2 rounded-full" style={{ width: `${goldPercent}%` }}></div>
               </div>
             </div>
           )}
           {silverTotal > 0 && (
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-tn-muted">Silver</span>
                 <span className="font-semibold text-tn-muted">{silverTotal}g ({silverPercent}%)</span>
               </div>
               <div className="w-full bg-tn-border rounded-full h-2">
                 <div className="bg-tn-subtle h-2 rounded-full" style={{ width: `${silverPercent}%` }}></div>
               </div>
             </div>
           )}
         </div>
       </div>

      {top3.length > 0 && (
        <div className={card}>
          <h3 className="font-bold text-tn-text mb-4 flex items-center gap-2"><Icon name="trend" size={18} /> Top 3 Contributors</h3>
          <div className="space-y-1">
            {top3.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-tn-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-tn-yellow">#{i + 1}</span>
                  <div><p className="font-semibold text-tn-text text-sm">{e.guest_name}</p><p className="text-xs text-tn-subtle capitalize">{e.relation}</p></div>
                </div>
                <span className="font-bold text-tn-yellow">₹{Number(e.amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-tn-yellow text-tn-text rounded-xl text-sm font-bold hover:bg-tn-yellow-2 transition-colors"
        >
          <Icon name="download" size={16} /> Download PDF
        </button>
        <button
          onClick={handleWhatsAppShare}
          className="flex items-center gap-2 px-5 py-2.5 bg-tn-success text-white rounded-xl text-sm font-bold hover:bg-tn-success transition-colors"
        >
          <Icon name="arrow-right" size={16} /> Share via WhatsApp
        </button>
      </div>
    </div>
  );
}

// ── Invitation Tab ───────────────────────────────────────────────────────────
function InvitationTab({ eventId, entries }: { eventId: number; entries: MoiEntry[] }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'invited' | 'came' | 'gave_moi' | 'no_show'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!eventId) return;
    invitationsApi.list(eventId).then((data) => {
      setInvitations(data.invitations);
    }).finally(() => setLoading(false));
  }, [eventId]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('event_id', String(eventId));
      form.append('csv_file', file);
      const res = await fetch('/api/invitations.php?action=csv', {
        method: 'POST',
        body: form,
        headers: {
          'X-Auth-Token': `Bearer ${localStorage.getItem('moi_token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setInvitations([...invitations, ...data.invitations || []].slice(0, 100));
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        showSuccess(`Successfully uploaded ${data.count} invitations`);
      } else {
        showError(data.error || 'Failed to upload invitations');
      }
    } catch {
      showError('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Auto-match invitations with moi entries
  const matchedInvitations = invitations.map(inv => {
    const matchingEntry = entries.find(e =>
      e.guest_name.toLowerCase() === inv.name.toLowerCase() ||
      (e.city && inv.city && e.city.toLowerCase() === inv.city.toLowerCase())
    );
    return {
      ...inv,
      status: matchingEntry ? 'gave_moi' : inv.status
    };
  });

  const filtered = matchedInvitations.filter(inv => {
    const searchMatch = inv.name.toLowerCase().includes(search.toLowerCase()) ||
      (inv.phone && inv.phone.includes(search)) ||
      (inv.city && inv.city.toLowerCase().includes(search.toLowerCase()));
    const filterMatch = filter === 'all' || inv.status === filter;
    return searchMatch && filterMatch;
  });

  // Calculate summary
  const summary = {
    invited: matchedInvitations.length,
    came: matchedInvitations.filter(i => i.status === 'came' || i.status === 'gave_moi').length,
    gaveMoi: matchedInvitations.filter(i => i.status === 'gave_moi').length,
    noShow: matchedInvitations.filter(i => i.status === 'no_show').length
  };

  // Find alerts
  const notInvitedButGaveMoi = entries.filter(e => 
    !matchedInvitations.some(i => i.name.toLowerCase() === e.guest_name.toLowerCase())
  );
  const invitedButDidNotAttend = matchedInvitations.filter(i => 
    i.status === 'invited' && !entries.some(e => e.guest_name.toLowerCase() === i.name.toLowerCase())
  );

  return (
     <div className="space-y-5">
       <div className="bg-white border border-tn-border rounded-2xl p-6 shadow-card">
         <h2 className="font-bold text-tn-text mb-4">Upload Invitation List</h2>
         <div className="flex gap-3 flex-wrap mb-3">
           <button
             type="button"
             className="flex-1 py-2.5 border border-tn-border rounded-xl text-xs font-semibold text-tn-muted hover:bg-tn-light transition-colors"
           >
             Excel
           </button>
           <button
             type="button"
             className="flex-1 py-2.5 border border-tn-border rounded-xl text-xs font-semibold text-tn-muted hover:bg-tn-light transition-colors"
           >
             CSV
           </button>
         </div>
         <div
           onClick={() => !uploading && fileInputRef.current?.click()}
           className="border-2 border-dashed border-tn-border rounded-2xl p-6 text-center cursor-pointer hover:border-tn-yellow transition-colors"
         >
           {uploading ? (
             <div className="flex flex-col items-center gap-3">
               <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
               <p className="text-sm text-tn-subtle">Uploading...</p>
             </div>
           ) : (
             <>
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-tn-muted mb-3">
                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                 <polyline points="17 8 12 3 7 8"/>
                 <line x1="12" y1="3" x2="12" y2="15"/>
               </svg>
               <p className="text-sm font-semibold text-tn-text mb-1">Drag & Drop</p>
               <p className="text-xs text-tn-subtle">or click to upload Excel file</p>
             </>
           )}
           <input
             ref={fileInputRef}
             type="file"
             accept=".csv,.xlsx"
             onChange={(e) => setFile(e.target.files?.[0] || null)}
             className="hidden"
           />
         </div>
         <div className="flex gap-3 mt-3">
           <button
             onClick={handleUpload}
             disabled={!file || uploading}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
               !file || uploading ? 'bg-tn-light text-tn-subtle' : 'bg-tn-yellow text-tn-text hover:bg-tn-yellow-2'
             }`}
           >
             {uploading ? 'Uploading…' : '📤 Upload'}
           </button>
           <button
             onClick={() => {
               const csvContent = 'Name,Phone,Relation,City\nRamesh,9876543210,family,Chennai\nPriya,9876543211,friend,Bangalore\n';
               const blob = new Blob([csvContent], { type: 'text/csv' });
               const url = URL.createObjectURL(blob);
               const a = document.createElement('a');
               a.href = url;
               a.download = 'invitation-template.csv';
               a.click();
               URL.revokeObjectURL(url);
             }}
             className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-tn-border text-tn-muted hover:bg-tn-light transition-colors"
            >
               <Icon name="download" size={16} /> Sample Template
             </button>
         </div>
         <p className="text-xs text-tn-subtle mt-2">CSV or XLSX format. Required columns: Name, Phone, Relation, City. <button onClick={() => {
           const csvContent = 'Name,Phone,Relation,City\nRamesh,9876543210,family,Chennai\nPriya,9876543211,friend,Bangalore\n';
           const blob = new Blob([csvContent], { type: 'text/csv' });
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = 'invitation-template.csv';
           a.click();
           URL.revokeObjectURL(url);
         }} className="text-tn-yellow hover:underline">Download sample CSV</button></p>
       </div>

      {notInvitedButGaveMoi.length > 0 && (
        <div className="bg-tn-gold-bg border border-tn-gold-border rounded-2xl p-4">
          <h3 className="font-bold text-tn-gold mb-2 flex items-center gap-2"><Icon name="alert" size={18} /> Not in Invitation List</h3>
          <p className="text-sm text-tn-gold">
            {notInvitedButGaveMoi.length} person(s) gave moi but were not in the invitation list:
          </p>
          <ul className="mt-2 text-sm text-tn-gold">
            {notInvitedButGaveMoi.slice(0, 5).map(e => (
              <li key={e.id}>• {e.guest_name}</li>
            ))}
            {notInvitedButGaveMoi.length > 5 && <li>• and {notInvitedButGaveMoi.length - 5} more...</li>}
          </ul>
        </div>
      )}

      {invitedButDidNotAttend.length > 0 && (
        <div className="bg-tn-blue-bg border border-tn-blue-bg rounded-2xl p-4">
          <h3 className="font-bold text-tn-blue-soft mb-2 flex items-center gap-2"><Icon name="calendar" size={18} /> Invited but Not Attended</h3>
          <p className="text-sm text-tn-blue-soft">
            {invitedButDidNotAttend.length} person(s) were invited but haven&apos;t given moi yet.
          </p>
        </div>
      )}

      <div className="bg-white border border-tn-border rounded-2xl p-6 shadow-card">
        <h3 className="font-bold text-tn-text mb-4">Attendance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-tn-light rounded-xl">
            <p className="text-xl font-bold text-tn-text">{summary.invited}</p>
            <p className="text-xs text-tn-subtle">Invited</p>
          </div>
          <div className="text-center p-3 bg-tn-success rounded-xl">
            <p className="text-xl font-bold text-tn-success">{summary.came}</p>
            <p className="text-xs text-tn-subtle">Came</p>
          </div>
          <div className="text-center p-3 bg-tn-yellow-light rounded-xl">
          <p className="text-xl font-bold text-tn-yellow">{summary.gaveMoi}</p>
          <p className="text-xs text-tn-subtle">Gave Moi</p>
          </div>
          <div className="text-center p-3 bg-tn-error rounded-xl">
            <p className="text-xl font-bold text-tn-error">{summary.noShow}</p>
            <p className="text-xs text-tn-subtle">No Show</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-tn-border rounded-2xl overflow-hidden shadow-card">
        <div className="px-5 py-4 border-b border-tn-border flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-bold text-tn-text">Invitations ({invitations.length})</h2>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'invited', 'came', 'gave_moi', 'no_show'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize ${
                  filter === f
                    ? 'bg-tn-yellow text-tn-text border-tn-yellow'
                    : 'bg-white text-tn-muted border-tn-border hover:bg-tn-light'
                }`}
              >
                {f === 'all' ? 'All' : f === 'gave_moi' ? 'Gave Moi' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 border-b border-tn-border">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invitations…"
            className="w-full bg-tn-light border border-tn-border rounded-xl px-3 py-1.5 text-sm text-tn-text placeholder-tn-subtle focus:outline-none focus:border-tn-yellow transition-colors"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-tn-subtle text-sm">Loading invitations…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-tn-subtle text-sm">
            {invitations.length === 0 ? 'No invitations uploaded yet.' : 'No results found.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {filtered.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-semibold text-tn-text text-sm">{inv.name}</p>
                  <p className="text-xs text-tn-subtle capitalize">
                    {inv.relation} • {inv.phone} • {inv.city}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                  inv.status === 'gave_moi' ? 'bg-tn-yellow-light text-tn-yellow' :
                  inv.status === 'came' ? 'bg-tn-success text-tn-success' :
                  inv.status === 'no_show' ? 'bg-tn-error text-tn-error' :
                  'bg-tn-light text-tn-muted'
                }`}>
                  {inv.status === 'gave_moi' ? 'Gave Moi' : inv.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Return Tracker Tab ───────────────────────────────────────────────────────────
function ReturnTrackerTab({ eventId, entries }: { eventId: number; entries: MoiEntry[] }) {

  const [returnGifts, setReturnGifts] = useState<ReturnGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    moi_entry_id: '',
    guest_name: '',
    return_type: 'none' as 'cash' | 'gold' | 'gift' | 'none',
    return_amount: '',
    return_gold_weight: '',
    return_gift_description: '',
    return_date: '',
    status: 'pending' as 'pending' | 'returned' | 'not_applicable',
    note: ''
  });
  const [editingReturnGift, setEditingReturnGift] = useState<ReturnGift | null>(null);
  const [editForm, setEditForm] = useState({
    moi_entry_id: '',
    guest_name: '',
    return_type: 'none' as 'cash' | 'gold' | 'gift' | 'none',
    return_amount: '',
    return_gold_weight: '',
    return_gift_description: '',
    return_date: '',
    status: 'pending' as 'pending' | 'returned' | 'not_applicable',
    note: ''
  });
  const [updating, setUpdating] = useState(false);
  const [deletingReturnGift, setDeletingReturnGift] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    returnGiftsApi.list(eventId).then((data) => {
      setReturnGifts(data.return_gifts || []);
    }).finally(() => setLoading(false));
  }, [eventId]);

  const handleDelete = async (id: number) => {
    setDeletingReturnGift(true);
    try {
      await returnGiftsApi.delete(id);
      setReturnGifts(returnGifts.filter(rg => rg.id !== id));
    } catch (error) {
      console.error('Failed to delete return gift:', error);
    } finally {
      setDeletingReturnGift(false);
      setConfirmDeleteId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const returnAmount = form.return_type === 'cash' ? parseFloat(form.return_amount || '0') : null;
      const returnGold = form.return_type === 'gold' ? parseFloat(form.return_gold_weight || '0') : null;
      
      const res = await returnGiftsApi.add({
        event_id: eventId,
        moi_entry_id: form.moi_entry_id ? parseInt(form.moi_entry_id) : undefined,
        guest_name: form.guest_name,
        return_type: form.return_type,
        return_amount: returnAmount,
        return_gold_weight: returnGold,
        return_gift_description: form.return_type === 'gift' ? form.return_gift_description : undefined,
        return_date: form.return_date || undefined,
        status: form.status,
        note: form.note || undefined
      });

      setReturnGifts([{
        id: res.id,
        event_id: eventId,
        moi_entry_id: form.moi_entry_id ? parseInt(form.moi_entry_id) : undefined,
        guest_name: form.guest_name,
        return_type: form.return_type,
        return_amount: returnAmount,
        return_gold_weight: returnGold,
        return_gift_description: form.return_type === 'gift' ? form.return_gift_description : undefined,
        return_date: form.return_date || undefined,
        status: form.status,
        note: form.note || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, ...returnGifts]);

      setForm({
        moi_entry_id: '',
        guest_name: '',
        return_type: 'none',
        return_amount: '',
        return_gold_weight: '',
        return_gift_description: '',
        return_date: '',
        status: 'pending',
        note: ''
      });
    } catch (error) {
      console.error('Failed to save return gift:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (returnGift: ReturnGift) => {
    setEditingReturnGift(returnGift);
    setEditForm({
      moi_entry_id: returnGift.moi_entry_id ? String(returnGift.moi_entry_id) : '',
      guest_name: returnGift.guest_name,
      return_type: returnGift.return_type,
      return_amount: returnGift.return_type === 'cash' ? String(returnGift.return_amount || '') : '',
      return_gold_weight: returnGift.return_type === 'gold' ? String(returnGift.return_gold_weight || '') : '',
      return_gift_description: returnGift.return_type === 'gift' ? (returnGift.return_gift_description || '') : '',
      return_date: returnGift.return_date || '',
      status: returnGift.status,
      note: returnGift.note || ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReturnGift) return;
    setUpdating(true);
    try {
      const returnAmount = editForm.return_type === 'cash' ? parseFloat(editForm.return_amount || '0') : null;
      const returnGold = editForm.return_type === 'gold' ? parseFloat(editForm.return_gold_weight || '0') : null;

      await returnGiftsApi.update(editingReturnGift.id, {
        moi_entry_id: editForm.moi_entry_id ? parseInt(editForm.moi_entry_id) : undefined,
        guest_name: editForm.guest_name,
        return_type: editForm.return_type,
        return_amount: returnAmount,
        return_gold_weight: returnGold,
        return_gift_description: editForm.return_type === 'gift' ? editForm.return_gift_description : undefined,
        return_date: editForm.return_date || undefined,
        status: editForm.status,
        note: editForm.note || undefined
      });

      setReturnGifts(returnGifts.map(rg => 
        rg.id === editingReturnGift.id 
          ? { ...rg, ...editForm, moi_entry_id: editForm.moi_entry_id ? parseInt(editForm.moi_entry_id) : undefined, return_amount: returnAmount, return_gold_weight: returnGold, return_gift_description: editForm.return_type === 'gift' ? editForm.return_gift_description : undefined, return_date: editForm.return_date || undefined, updated_at: new Date().toISOString() }
          : rg
      ));

      setEditingReturnGift(null);
    } catch (error) {
      console.error('Failed to update return gift:', error);
    } finally {
      setUpdating(false);
    }
  };

  const pendingCount = returnGifts.filter(r => r.status === 'pending').length;
  const returnedCount = returnGifts.filter(r => r.status === 'returned').length;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white border border-tn-border rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-tn-text">{returnGifts.length}</p>
          <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Total Tracked</p>
        </div>
        <div className="bg-tn-gold-bg border border-tn-gold-border rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-tn-gold">{pendingCount}</p>
          <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Pending</p>
        </div>
        <div className="bg-tn-success border border-tn-success rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-tn-success">{returnedCount}</p>
          <p className="text-[10px] text-tn-subtle mt-1 uppercase font-semibold">Returned</p>
        </div>
      </div>

      {/* Add Return Gift Form */}
      <div className="bg-white border border-tn-border rounded-2xl p-6 shadow-card">
        <h2 className="font-bold text-tn-text mb-4">Add Return Gift</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Select Moi Entry (Optional)</label>
              <select
                value={form.moi_entry_id}
                onChange={(e) => {
                  const entry = entries.find(en => en.id === parseInt(e.target.value));
                  setForm({
                    ...form,
                    moi_entry_id: e.target.value,
                    guest_name: entry ? entry.guest_name : form.guest_name
                  });
                }}
                className={selectCls}
              >
                <option value="">-- Select from Moi entries --</option>
                {entries.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.guest_name} - ₹{Number(entry.amount).toLocaleString('en-IN')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Guest Name *</label>
              <input
                required
                value={form.guest_name}
                onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                className={inputCls}
                placeholder="Guest name"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Return Type</label>
            <div className="flex gap-2">
              {(['none', 'cash', 'gold', 'gift'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, return_type: t })}
                  className={`flex-1 py-2 px-3 text-sm font-semibold rounded-xl border transition-all capitalize ${
                    form.return_type === t
                      ? 'bg-tn-yellow text-tn-text border-tn-yellow'
                      : 'bg-white text-tn-muted border-tn-border hover:bg-tn-light'
                  }`}
                >
                  {t === 'none' ? 'None' : t === 'cash' ? 'Cash' : t === 'gold' ? 'Gold' : 'Gift'}
                </button>
              ))}
            </div>
          </div>

          {form.return_type === 'cash' && (
            <div>
              <label className={labelCls}>Return Amount</label>
              <input
                type="number"
                value={form.return_amount}
                onChange={(e) => setForm({ ...form, return_amount: e.target.value })}
                className={inputCls}
                placeholder="Amount"
              />
            </div>
          )}

          {form.return_type === 'gold' && (
            <div>
              <label className={labelCls}>Gold Weight (grams)</label>
              <input
                type="number"
                step="0.1"
                value={form.return_gold_weight}
                onChange={(e) => setForm({ ...form, return_gold_weight: e.target.value })}
                className={inputCls}
                placeholder="Weight in grams"
              />
            </div>
          )}

          {form.return_type === 'gift' && (
            <div>
              <label className={labelCls}>Gift Description</label>
              <input
                value={form.return_gift_description}
                onChange={(e) => setForm({ ...form, return_gift_description: e.target.value })}
                className={inputCls}
                placeholder="Gift description"
              />
            </div>
          )}

          <div>
            <label className={labelCls}>Return Date</label>
            <input
              type="date"
              value={form.return_date}
              onChange={(e) => setForm({ ...form, return_date: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'pending' | 'returned' | 'not_applicable' })}
              className={selectCls}
            >
              <option value="pending">Pending</option>
              <option value="returned">Returned</option>
              <option value="not_applicable">Not Applicable</option>
            </select>
          </div>

          <button type="submit" disabled={saving}
            className="bg-tn-yellow text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Return Gift'}
          </button>
        </form>
      </div>

      {/* Return Gifts List */}
      <div className="bg-white border border-tn-border rounded-2xl overflow-hidden shadow-card">
        <div className="px-5 py-4 border-b border-tn-border">
           <h2 className="font-bold text-tn-text">Return Gifts ({returnGifts.length})</h2>
         </div>
         {loading ? (
           <div className="text-center py-12 text-tn-subtle text-sm">Loading return gifts…</div>
         ) : returnGifts.length === 0 ? (
           <div className="text-center py-12 text-tn-subtle text-sm">No return gifts tracked yet.</div>
         ) : (
           <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
             {returnGifts.map((r) => (
                 <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                   <div>
                     <p className="font-semibold text-tn-text text-sm">{r.guest_name}</p>
                     <p className="text-xs text-tn-subtle">
                       {r.return_type !== 'none' && (
                         <>
                           {r.return_type === 'cash' && `₹${Number(r.return_amount || 0).toLocaleString('en-IN')}`}
                           {r.return_type === 'gold' && `${r.return_gold_weight}g Gold`}
                           {r.return_type === 'gift' && r.return_gift_description}
                         </>
                       )}
                       {r.return_date && ` • Returned: ${new Date(r.return_date).toLocaleDateString('en-IN')}`}
                     </p>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                       r.status === 'returned' ? 'bg-tn-success text-tn-success' :
                       r.status === 'not_applicable' ? 'bg-tn-light text-tn-muted' :
                       'bg-tn-gold-bg text-tn-gold'
                     }`}>
                       {r.status}
                     </span>
                     <button
                       onClick={() => handleEdit(r)}
                       className="text-tn-subtle hover:text-tn-yellow transition-colors text-sm"
                       title="Edit return gift"
                     >
                       ✏️
                     </button>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>

      {/* Edit Return Gift Modal */}
     {editingReturnGift && (
       <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingReturnGift(null)}>
         <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
           <div className="flex items-center justify-between mb-4">
             <h2 className="font-bold text-tn-text text-lg">Edit Return Gift</h2>
             <button
               onClick={() => setEditingReturnGift(null)}
               className="text-tn-subtle hover:text-tn-muted text-xl"
             >
               ×
             </button>
           </div>
           <form onSubmit={handleUpdate} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <div>
                 <label className={labelCls}>Select Moi Entry (Optional)</label>
                 <select
                   value={editForm.moi_entry_id}
                   onChange={(e) => {
                     const entry = entries.find(en => en.id === parseInt(e.target.value));
                     setEditForm({
                       ...editForm,
                       moi_entry_id: e.target.value,
                       guest_name: entry ? entry.guest_name : editForm.guest_name
                     });
                   }}
                   className={selectCls}
                 >
                   <option value="">-- Select from Moi entries --</option>
                   {entries.map((entry) => (
                     <option key={entry.id} value={entry.id}>{entry.guest_name} - ₹{Number(entry.amount).toLocaleString('en-IN')}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className={labelCls}>Guest Name *</label>
                 <input
                   required
                   value={editForm.guest_name}
                   onChange={(e) => setEditForm({ ...editForm, guest_name: e.target.value })}
                   className={inputCls}
                   placeholder="Guest name"
                 />
               </div>
             </div>

             <div>
               <label className={labelCls}>Return Type</label>
               <div className="flex gap-2">
                 {(['none', 'cash', 'gold', 'gift'] as const).map((t) => (
                   <button
                     key={t}
                     type="button"
                     onClick={() => setEditForm({ ...editForm, return_type: t })}
                     className={`flex-1 py-2 px-3 text-sm font-semibold rounded-xl border transition-all capitalize ${
                       editForm.return_type === t
                         ? 'bg-tn-yellow text-tn-text border-tn-yellow'
                         : 'bg-white text-tn-muted border-tn-border hover:bg-tn-light'
                     }`}
                   >
                     {t === 'none' ? 'None' : t === 'cash' ? 'Cash' : t === 'gold' ? 'Gold' : 'Gift'}
                   </button>
                 ))}
               </div>
             </div>

             {editForm.return_type === 'cash' && (
               <div>
                 <label className={labelCls}>Return Amount</label>
                 <input
                   type="number"
                   value={editForm.return_amount}
                   onChange={(e) => setEditForm({ ...editForm, return_amount: e.target.value })}
                   className={inputCls}
                   placeholder="Amount"
                 />
               </div>
             )}

             {editForm.return_type === 'gold' && (
               <div>
                 <label className={labelCls}>Gold Weight (grams)</label>
                 <input
                   type="number"
                   step="0.1"
                   value={editForm.return_gold_weight}
                   onChange={(e) => setEditForm({ ...editForm, return_gold_weight: e.target.value })}
                   className={inputCls}
                   placeholder="Weight in grams"
                 />
               </div>
             )}

             {editForm.return_type === 'gift' && (
               <div>
                 <label className={labelCls}>Gift Description</label>
                 <input
                   value={editForm.return_gift_description}
                   onChange={(e) => setEditForm({ ...editForm, return_gift_description: e.target.value })}
                   className={inputCls}
                   placeholder="Gift description"
                 />
               </div>
             )}

             <div>
               <label className={labelCls}>Return Date</label>
               <input
                 type="date"
                 value={editForm.return_date}
                 onChange={(e) => setEditForm({ ...editForm, return_date: e.target.value })}
                 className={inputCls}
               />
             </div>

             <div>
               <label className={labelCls}>Status</label>
               <select
                 value={editForm.status}
                 onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'pending' | 'returned' | 'not_applicable' })}
                 className={selectCls}
               >
                 <option value="pending">Pending</option>
                 <option value="returned">Returned</option>
                 <option value="not_applicable">Not Applicable</option>
               </select>
             </div>

             <div>
               <label className={labelCls}>Note</label>
               <input
                 value={editForm.note}
                 onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                 className={inputCls}
                 placeholder="Optional note"
               />
             </div>

             <div className="flex gap-3 pt-2">
               <button
                 type="submit"
                 disabled={updating}
                 className="bg-tn-yellow text-tn-text px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-tn-yellow-2 transition-colors disabled:opacity-50"
               >
                 {updating ? 'Updating…' : 'Update Return Gift'}
               </button>
               <button
                   type="button"
                   onClick={() => setEditingReturnGift(null)}
                   className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-tn-border text-tn-muted hover:bg-tn-light"
                 >
                   Cancel
                 </button>
                 <button
                    type="button"
                    onClick={() => {
                      if (editingReturnGift) {
                        setConfirmDeleteId(editingReturnGift.id);
                      }
                    }}
                    disabled={deletingReturnGift}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-tn-error text-tn-error hover:bg-tn-error disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

       {confirmDeleteId !== null && (
         <ConfirmDeleteModal
           isOpen={confirmDeleteId !== null}
           title="Delete Return Gift"
           message="Are you sure you want to delete this return gift? This action cannot be undone."
           onConfirm={() => handleDelete(confirmDeleteId)}
           onCancel={() => setConfirmDeleteId(null)}
           isLoading={deletingReturnGift}
         />
       )}
     </div>
    );

  }
