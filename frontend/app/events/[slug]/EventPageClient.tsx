'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { eventsApi, moiApi, photosApi, invitationsApi, notificationsApi, returnGiftsApi, exportCSV, showSuccess, Event, MoiEntry, Photo, Invitation, ReturnGift } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { canAddMoi, getEventDisplayName } from '@/lib/eventHelpers';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
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

const NAV: { id: string; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: '📊' },
  { id: 'events',    label: 'Events',     icon: '💍' },
  { id: 'payments',  label: 'Payments',   icon: '💰' },
  { id: 'users',     label: 'Users',      icon: '👥' },
  { id: 'analytics', label: 'Analytics',  icon: '📈' },
  { id: 'settings',  label: 'Settings',   icon: '⚙️'  },
];

const inputCls  = "w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors";
const labelCls  = "block text-xs font-semibold text-gray-500 mb-1";
const selectCls = `${inputCls} appearance-none bg-white`;

export default function EventPage() {
  const slug = useSlug();
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [event, setEvent]     = useState<Event | null>(null);
  const [entries, setEntries] = useState<MoiEntry[]>([]);
  const [photos, setPhotos]   = useState<Photo[]>([]);
  const [tab, setTab]         = useState<Tab>('moi');
  const [loading, setLoading] = useState(true);
  const [sideOpen, setSideOpen] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ venue: '', city: '' });
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
      setEntries(moiData.entries);
      setPhotos(photoData);
    }).finally(() => setLoading(false));
  }, [user, slug]);

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading event…</p>
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
  const totalCash = entries.filter(e => e.gift_type === 'cash' || !e.gift_type).reduce((s, e) => s + Number(e.amount), 0);
  const totalGold = entries.filter(e => e.gift_type === 'gold').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const totalSilver = entries.filter(e => e.gift_type === 'silver').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const totalGifts = entries.filter(e => e.gift_type === 'gift').length;
  const shareUrl = `${window.location.origin}/e/${event.slug}`;

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
              const active = item.id === 'events';
              return (
                <Link
                  key={item.id}
                  href={`/dashboard?module=${item.id}`}
                  onClick={() => setSideOpen(false)}
                  className={[
                    'w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors text-left',
                    active
                      ? 'bg-[#FFFBEE] text-[#101010] border-r-[3px] border-[#FFC107]'
                      : 'text-[#666] hover:bg-[#fafafa] hover:text-[#101010]',
                  ].join(' ')}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  {item.label}
                </Link>
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
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f5f5f5]">

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
               <h1 className="font-bold text-[#101010] text-sm capitalize leading-tight">
                 {getEventDisplayName(event)}
               </h1>
               <p className="text-[11px] text-[#999] hidden sm:block">Event details and moi management</p>
             </div>

            <Link
              href="/dashboard?module=events"
              className="flex items-center gap-1.5 border border-[#E8E8E8] text-[#444] px-3.5 py-2 rounded-lg text-sm font-semibold hover:border-[#FFC107] transition-colors whitespace-nowrap bg-white hover:bg-gray-50"
            >
              ← Back to Events
            </Link>
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
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
                <div className="h-1 bg-[#FFC107] rounded-full mb-5 -mx-6 -mt-6 rounded-t-2xl" />
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {getEventDisplayName(event)}
                    </h2>
                     <p className="text-gray-400 text-sm mt-1">
                       📅 {new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                       {event.venue && <span> · 📍 {event.venue}</span>}
                       {event.city && <span> · 🏙️ {event.city}</span>}
                     </p>
                   </div>
                  <div className="flex gap-2 flex-wrap shrink-0">
                    <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                      ⚙️ Settings
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(shareUrl); alert('Share link copied!'); }} className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                      🔗 Share
                    </button>
                    <button onClick={() => exportCSV(event.id)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                      📥 Export CSV
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
                  <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 text-center">
                    <p className="text-lg font-bold text-[#B8860B]">₹{totalCash.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">Total Cash</p>
                  </div>
                  <div className="bg-[#FFF9E6] border border-[#FFE082] rounded-xl p-4 text-center">
                    <p className="text-lg font-bold text-[#B8860B]">{totalGold}g</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">Total Gold</p>
                  </div>
                  <div className="bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl p-4 text-center">
                    <p className="text-lg font-bold text-gray-600">{totalSilver}g</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">Total Silver</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                    <p className="text-lg font-bold text-red-600">{totalGifts}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">Total Gifts</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                    <p className="text-lg font-bold text-gray-700">{entries.length}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">Guests</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center col-span-2 md:col-span-1">
                    <p className="text-lg font-bold text-gray-700">{photos.length}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">Photos</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-card">
                {(['moi', 'photos', 'summary', 'invitations', 'returns'] as Tab[]).map((t) => (
                   <button key={t} onClick={() => setTab(t)}
                     className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-[#FFC107] text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}>
                     {t === 'moi' ? '📋 Moi Register' : t === 'photos' ? '📸 Photos' : t === 'invitations' ? '📧 Invitations' : t === 'returns' ? '🎁 Return Tracker' : '📊 Summary'}
                   </button>
                 ))}
              </div>

              {tab === 'moi'     && <MoiTab     eventId={event.id} entries={entries} blocked={!moiAllowed} onAdd={(e) => setEntries([e, ...entries])} onUpdate={(e) => setEntries(entries.map((en) => en.id === e.id ? e : en))} onDelete={(id) => setEntries(entries.filter((e) => e.id !== id))} />}
                {tab === 'photos'  && <PhotosTab  eventId={event.id} photos={photos}   onAdd={(p) => setPhotos([p, ...photos])}   onDelete={(id) => setPhotos(photos.filter((p) => p.id !== id))} />}
                {tab === 'summary' && <SummaryTab entries={entries} eventId={event.id} />}
                {tab === 'invitations' && <InvitationTab eventId={event.id} entries={entries} />}
                {tab === 'returns' && <ReturnTrackerTab eventId={event.id} entries={entries} />}
        {/* Function Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-lg">Function Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className={labelCls}>Venue</label>
                  <div className="relative">
                    <input
                      value={settingsForm.venue}
                      onChange={(e) => setSettingsForm({ ...settingsForm, venue: e.target.value })}
                      className={inputCls + (settingsForm.venue ? ' pr-10' : '')}
                      placeholder="Sri Murugan Mahal, Chennai"
                    />
                    {settingsForm.venue && (
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, venue: '' })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Clear venue"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>City</label>
                  <div className="relative">
                    <input
                      value={settingsForm.city}
                      onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                      className={inputCls + (settingsForm.city ? ' pr-10' : '')}
                      placeholder="Chennai"
                    />
                    {settingsForm.city && (
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, city: '' })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Clear city"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="bg-[#FFC107] text-gray-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving…' : 'Save Settings'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
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


// ── Moi Tab ───────────────────────────────────────────────────────────────────
function MoiTab({ eventId, entries, blocked, onAdd, onUpdate, onDelete }: { eventId: number; entries: MoiEntry[]; blocked?: boolean; onAdd: (e: MoiEntry) => void; onUpdate: (e: MoiEntry) => void; onDelete: (id: number) => void }) {
  const [form, setForm] = useState({
    guest_name: '',
    city: '',
    company: '',
    occupation: '',
    gift_type: 'cash' as 'cash' | 'gold' | 'silver' | 'gift',
    amount: '',
    gold_weight: '',
    gift_description: '',
    approximate_value: '',
    relation: 'friend',
    payment_mode: 'cash',
    upi_ref_id: '',
    other_payment_details: '',
    note: '',
    entered_by: ''
  });
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [filter, setFilter] = useState<'all' | 'cash' | 'online'>('all');
  const [sort, setSort] = useState<'high' | 'low' | 'date'>('date');
  const [visibleCount, setVisibleCount] = useState(20);
  const [offlineEntries, setOfflineEntries] = useState<Array<MoiEntry & { tempId: string }>>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [editingEntry, setEditingEntry] = useState<MoiEntry | null>(null);
  const [editForm, setEditForm] = useState({
    guest_name: '',
    city: '',
    company: '',
    occupation: '',
    gift_type: 'cash' as 'cash' | 'gold' | 'silver' | 'gift',
    amount: '',
    gold_weight: '',
    gift_description: '',
    approximate_value: '',
    relation: 'friend',
    payment_mode: 'cash',
    upi_ref_id: '',
    other_payment_details: '',
    note: '',
    entered_by: ''
  });
  const [updating, setUpdating] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load offline entries from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('moi_offline_entries');
    if (stored) {
      setOfflineEntries(JSON.parse(stored));
    }
  }, []);

  // Check online status
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Sync offline entries when online
  useEffect(() => {
    if (isOnline && offlineEntries.length > 0) {
      const syncOfflineEntries = async () => {
        for (const entry of offlineEntries) {
          try {
            const res = await moiApi.add({
              ...entry,
              event_id: eventId,
              city: entry.city || null,
              amount: entry.gift_type === 'cash' ? entry.amount : 0,
              gold_weight: (entry.gift_type === 'gold' || entry.gift_type === 'silver') ? entry.gold_weight : null,
              gift_description: (entry.gift_type === 'gold' || entry.gift_type === 'silver' || entry.gift_type === 'gift') ? entry.gift_description : null,
              approximate_value: entry.approximate_value || null,
              relation: entry.relation as MoiEntry['relation'],
              payment_mode: entry.payment_mode as MoiEntry['payment_mode']
            });
            onAdd({
              ...entry,
              id: res.id,
              event_id: eventId,
              created_at: new Date().toISOString()
            });
          } catch (error) {
            console.error('Failed to sync offline entry:', error);
          }
        }
        localStorage.removeItem('moi_offline_entries');
        setOfflineEntries([]);
      };
      syncOfflineEntries();
    }
  }, [isOnline, offlineEntries, eventId, onAdd]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await moiApi.delete(id);
      onDelete(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleEdit = (entry: MoiEntry) => {
    setEditingEntry(entry);
    setEditForm({
      guest_name: entry.guest_name,
      city: entry.city || '',
      gift_type: entry.gift_type,
      amount: entry.gift_type === 'cash' ? String(entry.amount) : '',
      gold_weight: (entry.gift_type === 'gold' || entry.gift_type === 'silver') ? String(entry.gold_weight || '') : '',
      gift_description: entry.gift_type === 'gift' ? (entry.gift_description || '') : '',
      approximate_value: entry.approximate_value ? String(entry.approximate_value) : '',
      relation: entry.relation,
      payment_mode: entry.payment_mode,
      upi_ref_id: entry.upi_ref_id || '',
      other_payment_details: entry.other_payment_details || '',
      note: entry.note || '',
      entered_by: entry.entered_by || ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    setUpdating(true);
    try {
      const amountVal = editForm.gift_type === 'cash' ? parseFloat(editForm.amount || '0') : 0;
      const goldVal = (editForm.gift_type === 'gold' || editForm.gift_type === 'silver') ? parseFloat(editForm.gold_weight || '0') : null;
      const giftDescVal = (editForm.gift_type === 'gold' || editForm.gift_type === 'silver' || editForm.gift_type === 'gift') ? editForm.gift_description : null;
      const approxVal = (editForm.gift_type === 'gold' || editForm.gift_type === 'silver' || editForm.gift_type === 'gift') && editForm.approximate_value !== '' ? parseFloat(editForm.approximate_value) : null;

      await moiApi.update(editingEntry.id, {
        guest_name: editForm.guest_name,
        city: editForm.city || null,
        company: editForm.company || null,
        occupation: editForm.occupation || null,
        gift_type: editForm.gift_type,
        amount: amountVal,
        gold_weight: goldVal,
        gift_description: giftDescVal,
        approximate_value: approxVal,
        relation: editForm.relation as MoiEntry['relation'],
        payment_mode: editForm.payment_mode as MoiEntry['payment_mode'],
        upi_ref_id: editForm.upi_ref_id || null,
        other_payment_details: editForm.other_payment_details || null,
        note: editForm.note,
        entered_by: editForm.entered_by
      });

      onUpdate({
        ...editingEntry,
        guest_name: editForm.guest_name,
        city: editForm.city || null,
        company: editForm.company || null,
        occupation: editForm.occupation || null,
        gift_type: editForm.gift_type,
        amount: amountVal,
        gold_weight: goldVal,
        gift_description: giftDescVal,
        approximate_value: approxVal,
        relation: editForm.relation as MoiEntry['relation'],
        payment_mode: editForm.payment_mode as MoiEntry['payment_mode'],
        upi_ref_id: editForm.upi_ref_id || null,
        other_payment_details: editForm.other_payment_details || null,
        note: editForm.note,
        entered_by: editForm.entered_by
      });

      setEditingEntry(null);
    } catch (error) {
      console.error('Failed to update entry:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return;
    setAdding(true);
    try {
      const amountVal = form.gift_type === 'cash' ? parseFloat(form.amount || '0') : 0;
      const goldVal = (form.gift_type === 'gold' || form.gift_type === 'silver') ? parseFloat(form.gold_weight || '0') : null;
      const giftDescVal = (form.gift_type === 'gold' || form.gift_type === 'silver' || form.gift_type === 'gift') ? form.gift_description : null;
      const approxVal = (form.gift_type === 'gold' || form.gift_type === 'silver' || form.gift_type === 'gift') && form.approximate_value !== '' ? parseFloat(form.approximate_value) : null;

      // Check if online - if offline, save to localStorage
      if (!isOnline) {
        const tempId = `temp_${Date.now()}`;
        const offlineEntry = {
          ...form,
          city: form.city || null,
          company: form.company || null,
          occupation: form.occupation || null,
          amount: amountVal,
          gold_weight: goldVal,
          gift_description: giftDescVal,
          approximate_value: approxVal,
          event_id: eventId,
          relation: form.relation as MoiEntry['relation'],
          payment_mode: form.payment_mode as MoiEntry['payment_mode'],
          tempId
        };
        
        const newOfflineEntries = [offlineEntry, ...offlineEntries];
        setOfflineEntries(newOfflineEntries);
        localStorage.setItem('moi_offline_entries', JSON.stringify(newOfflineEntries));
        
        onAdd({
          id: parseInt(tempId.split('_')[1]),
          event_id: eventId,
          guest_name: form.guest_name,
          city: form.city || null,
          company: form.company || null,
          occupation: form.occupation || null,
          gift_type: form.gift_type,
          amount: amountVal,
          gold_weight: goldVal,
          gift_description: giftDescVal,
          approximate_value: approxVal,
          relation: form.relation as MoiEntry['relation'],
          payment_mode: form.payment_mode as MoiEntry['payment_mode'],
          upi_ref_id: form.upi_ref_id || null,
          other_payment_details: form.other_payment_details || null,
          note: form.note,
          entered_by: form.entered_by,
          created_at: new Date().toISOString()
        });
        
        alert('Entry saved locally. Will sync when online.');
      } else {
        const res = await moiApi.add({
          ...form,
          city: form.city || null,
          company: form.company || null,
          occupation: form.occupation || null,
          amount: amountVal,
          gold_weight: goldVal,
          gift_description: giftDescVal,
          approximate_value: approxVal,
          event_id: eventId,
          relation: form.relation as MoiEntry['relation'],
          payment_mode: form.payment_mode as MoiEntry['payment_mode']
        });

        onAdd({
          id: res.id,
          event_id: eventId,
          guest_name: form.guest_name,
          city: form.city || null,
          company: form.company || null,
          occupation: form.occupation || null,
          gift_type: form.gift_type,
          amount: amountVal,
          gold_weight: goldVal,
          gift_description: giftDescVal,
          approximate_value: approxVal,
          relation: form.relation as MoiEntry['relation'],
          payment_mode: form.payment_mode as MoiEntry['payment_mode'],
          upi_ref_id: form.upi_ref_id || null,
          other_payment_details: form.other_payment_details || null,
          note: form.note,
          entered_by: form.entered_by,
          created_at: new Date().toISOString()
        });

        // Show entry save confirmation notification
        notificationsApi.create({
          title: 'Moi Entry Saved',
          message: `${form.guest_name} - ₹${amountVal.toLocaleString('en-IN')}`,
          type: 'entry_saved',
          event_id: eventId
        }).catch(() => {}); // Silent fail for notification
      }

      setForm(prev => ({
        ...prev,
        guest_name: '',
        city: '',
        company: '',
        occupation: '',
        amount: '',
        gold_weight: '',
        gift_description: '',
        approximate_value: '',
        upi_ref_id: '',
        other_payment_details: '',
        note: ''
      }));
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    } finally {
      setAdding(false);
    }
  };

  const startSpeechRecognition = async () => {
    const win = window as Window & typeof globalThis & {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice entry is not supported in this browser. Please use Chrome, Edge, or Safari for voice input.");
      return;
    }

    // Check microphone permission with clear explanation
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'denied') {
          alert("Microphone access is blocked.\n\nTo use voice entry:\n1. Click the lock icon in your browser address bar\n2. Find 'Microphone' and set it to 'Allow'\n3. Refresh this page and try again");
          return;
        }
      } catch {
        // Permissions API not supported, continue anyway
      }
    }

    const rec = new SpeechRecognition() as {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onstart: () => void;
      onend: () => void;
      onerror: (event: { error: string }) => void;
      onresult: (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
      start: () => void;
    };

    // Try Tamil first, fallback to English/Tanglish
    rec.lang = 'ta-IN';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied.\n\nTo use voice entry:\n1. Click the lock icon in your browser address bar\n2. Find 'Microphone' and set it to 'Allow'\n3. Refresh this page and try again");
      } else if (event.error === 'no-speech') {
        // No speech detected - fields stay as they were
        alert("No speech detected. Please try again or type manually.");
      } else {
        alert("Voice recognition error: " + event.error + "\nPlease try again or type manually.");
      }
    };
    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      parseVoiceInput(text);
    };
    rec.start();
  };

  // Tamil and Tanglish number word mappings
  const tamilNumberWords: Record<string, number> = {
    // Tamil numbers
    'ஒன்று': 1, 'ஒரு': 1, 'ஒவ்வொன்று': 1,
    'இருபது': 20, 'இரு': 2,
    'முன்னேற்றம்': 20,
    'பத்து': 10, 'பத்த': 10,
    'பதின்மு': 100, 'நூறு': 100, 'நூற்று': 100,
    'ஐயாயிரம்': 5000, 'ஐயயிரம்': 5000, 'ஐயயிரம்': 5000,
    'ஆயிரம்': 1000, 'ஆயரம்': 1000,
    'பதிநாயிரம்': 10000,
    'இலட்சம்': 100000,
    'கோடி': 10000000,
    // Tanglish numbers
    'aiyayiram': 5000, 'aiyairam': 5000, 'ayiram': 1000,
    'aayiram': 1000, 'aayar': 1000,
    'irupu': 50, 'iruppu': 50,
    'nuru': 100, 'nooru': 100,
    'padu': 10, 'pathu': 10,
    'rendu': 2,
    'sinthu': 25, 'sindhu': 25,
    'munthu': 30, 'muntu': 30,
    'nombu': 9, 'thombu': 9,
    'ezhu': 7, 'eluu': 7,
    'aaruu': 6, 'aru': 6,
    'ainuu': 5, 'anchu': 5,
    'naalu': 4,
    'moonu': 3,
    'onnu': 1,
  };

  const parseVoiceInput = (text: string) => {
    const words = text.split(/\s+/);
    const numbers = text.match(/\b\d+(\.\d+)?\b/g);
    let name = '';
    let city = '';
    let amount = '';
    let gold_weight = '';
    let gift_description = '';
    let relation = form.relation;
    let gift_type: 'cash' | 'gold' | 'silver' | 'gift' = 'cash';
    let payment_mode = form.payment_mode;

    // Detect relation in Tamil/Tanglish
    if (/family|family member|குடும்பம்|குடும்பத்தில்|உறவு/i.test(text)) relation = 'family';
    else if (/friend|friends|நண்பர்|நண்பர்கள்|தோழர்/i.test(text)) relation = 'friend';
    else if (/colleague|office|சகாக்கள்|அணியமைப்பு/i.test(text)) relation = 'colleague';
    else if (/other|மற்றவர்/i.test(text)) relation = 'other';

    // Detect payment mode in Tamil/Tanglish
    if (/upi|யுபிஐ|யு்பி/i.test(text)) payment_mode = 'upi';
    else if (/card|அட்டவணை/i.test(text)) payment_mode = 'card';
    else if (/cheque|நிர்வாகம்/i.test(text)) payment_mode = 'cheque';

    const isGold = /gold|grams|sovereign|gold|gram|பொன்|பொற்ச்சி|செம்பூச்சி|செம்பூச்/i.test(text);
    const isSilver = /silver|vessel|plate|cup|வெள்ளி|பாத்திரம்|தொப்பை|வessels/i.test(text);
    const isGift = /gift|present|பரவணை|பரவல்/i.test(text);

    // Parse Tamil/Tanglish number words
    const parseTamilNumbers = (input: string): string | null => {
      const lowerText = input.toLowerCase();
      for (const [word, value] of Object.entries(tamilNumberWords)) {
        if (lowerText.includes(word.toLowerCase())) {
          return String(value);
        }
      }
      return null;
    };

    if (isGold) {
      gift_type = 'gold';
      // Try to find number in digits first, then Tamil words
      if (numbers && numbers.length > 0) {
        gold_weight = numbers[0];
      } else {
        const tamilNum = parseTamilNumbers(text);
        if (tamilNum) gold_weight = tamilNum;
      }
    } else if (isSilver) {
      gift_type = 'silver';
      // Try to find number in digits first, then Tamil words
      if (numbers && numbers.length > 0) {
        gold_weight = numbers[0];
      } else {
        const tamilNum = parseTamilNumbers(text);
        if (tamilNum) gold_weight = tamilNum;
      }
    } else if (isGift) {
      gift_type = 'gift';
      const match = text.match(/(?:gift|present|பரவணை|பரவல்)\s+(.*)/i) || text.match(/(silver.*|plate.*|vessel.*|cup.*|பாத்திரம்.*|தொப்பை.*)/i);
      gift_description = match ? match[1] : 'Gift item';
    } else {
      gift_type = 'cash';
      // Try to find number in digits first, then Tamil words
      if (numbers && numbers.length > 0) {
        amount = numbers[0];
      } else {
        const tamilNum = parseTamilNumbers(text);
        if (tamilNum) amount = tamilNum;
      }
    }

    const ignoreWords = ['friend', 'friends', 'family', 'colleague', 'other', 'gold', 'silver', 'gift', 'gram', 'grams', 'grams gold', 'grams silver', 'cash', 'upi', 'card', 'cheque', 'rupees', 'rupee', 'in', 'at', 'from', 'ரூபாய்', 'ரூபி', 'நண்பர்', 'நண்பர்கள்', 'குடும்பம்', 'சகாக்கள்', 'மற்றவர்', 'பொன்', 'வெள்ளி', 'பாத்திரம்', 'தொப்பை', 'யுபிஐ', 'அட்டவணை', 'நிர்வாகம்', 'ஐயாயிரம்', 'ஆயிரம்', 'நூறு', 'பத்து', 'பதின்மு', 'இருபது', 'பத்த', 'aiyayiram', 'aayiram', 'nooru', 'pathu', 'irupu', 'the', 'a', 'an', 'is', 'gave', 'given', 'donated', 'paid', 'paid', 'paid'];
    const candidates = words.filter(w => !ignoreWords.includes(w.toLowerCase()) && !/^\d+(\.\d+)?$/.test(w));

    if (candidates.length > 0) {
      name = candidates[0].charAt(0).toUpperCase() + candidates[0].slice(1);
    }
    if (candidates.length > 1) {
      city = candidates.slice(1).join(' ').trim();
      city = city.charAt(0).toUpperCase() + city.slice(1);
    }

    // Only update fields that were recognized - leave others unchanged
    const updates: Record<string, string | number> = {};
    if (name) updates.guest_name = name;
    if (city) updates.city = city;
    if (gift_type) updates.gift_type = gift_type;
    if (amount) updates.amount = amount;
    if (gold_weight) updates.gold_weight = gold_weight;
    if (gift_description) updates.gift_description = gift_description;
    if (relation) updates.relation = relation;
    if (payment_mode) updates.payment_mode = payment_mode;

    setForm(prev => ({ ...prev, ...updates }));
  };

  // Filter entries by search, filter, and sort
  const filtered = entries
    .filter((e) => {
      // Search filter
      const searchMatch = e.guest_name.toLowerCase().includes(search.toLowerCase()) ||
        (e.city && e.city.toLowerCase().includes(search.toLowerCase())) ||
        (e.note && e.note.toLowerCase().includes(search.toLowerCase())) ||
        e.relation.toLowerCase().includes(search.toLowerCase());
      
      // Payment type filter
      const filterMatch = filter === 'all' || 
        (filter === 'cash' && (e.gift_type === 'cash' || !e.gift_type)) ||
        (filter === 'online' && e.payment_mode && e.payment_mode !== 'cash');
      
      return searchMatch && filterMatch;
    })
    .sort((a, b) => {
      if (sort === 'high') {
        return Number(b.amount || 0) - Number(a.amount || 0);
      } else if (sort === 'low') {
        return Number(a.amount || 0) - Number(b.amount || 0);
      } else {
        // Date sort - newest first
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

  const totalCash = entries.filter(e => e.gift_type === 'cash' || !e.gift_type).reduce((s, e) => s + Number(e.amount), 0);
  const totalGold = entries.filter(e => e.gift_type === 'gold').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const totalSilver = entries.filter(e => e.gift_type === 'silver').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const totalGifts = entries.filter(e => e.gift_type === 'gift').length;

  return (
    <div className="space-y-5">
      {blocked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-900">
          Moi entry is disabled until admin approves this function. / நிர்வாகர் அனுமதி வரை மொய் பதிவு செய்ய முடியாது.
        </div>
      )}
      <div className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-card ${blocked ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-bold text-gray-900">Add Moi Entry</h2>
          <button
             type="button"
             onClick={() => startSpeechRecognition()}
             disabled={blocked}
             className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
               isListening
                 ? 'bg-red-50 text-red-600 border-red-300 animate-pulse scale-105'
                 : 'bg-[#FFF8E1] hover:bg-[#FFE082] border-[#FFC107] text-[#B8860B]'
             }`}
             title="Click to speak: e.g., 'Kumar 5000 cash' or 'Karthik 8 grams gold' or 'Ramesh gift watch'"
           >
            <span className="text-xl">🎙️</span>
            <span>{isListening ? 'Listening... Speak now' : 'Voice Entry'}</span>
          </button>
        </div>

        <form onSubmit={handleAdd} className={`space-y-4 ${blocked ? 'pointer-events-none' : ''}`}>
          {/* Gift Type Row */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Gift Type</label>
            <div className="flex gap-2">
              {(['cash', 'gold', 'silver', 'gift'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => !blocked && setForm({ ...form, gift_type: t })}
                  className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-xl border transition-all capitalize ${
                    form.gift_type === t
                      ? 'bg-[#FFC107] text-gray-900 border-[#FFC107] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t === 'cash' ? '💵 Cash' : t === 'gold' ? '✨ Gold' : t === 'silver' ? '🥈 Silver' : '🎁 Gift'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Guest Name *</label>
              <input
                ref={nameInputRef}
                required
                value={form.guest_name}
                onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                className={inputCls}
                placeholder="Ramesh"
              />
            </div>
            <div>
              <label className={labelCls}>City / Place</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputCls}
                placeholder="Karaikudi"
              />
            </div>
            <div>
              <label className={labelCls}>Company</label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={inputCls}
                placeholder="Company name (optional)"
              />
            </div>
            <div>
              <label className={labelCls}>Occupation</label>
              <input
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                className={inputCls}
                placeholder="Occupation (optional)"
              />
            </div>

            {/* Dynamic fields */}
            {form.gift_type === 'cash' && (
                <>
                  <div>
                    <label className={labelCls}>Amount (₹) *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className={inputCls}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Payment Mode</label>
                    <div className="flex gap-2 flex-wrap">
                      {(['cash', 'upi', 'card', 'cheque', 'other'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setForm({ ...form, payment_mode: mode })}
                          className={`flex-1 py-2 px-3 text-sm font-semibold rounded-xl border transition-all capitalize ${
                            form.payment_mode === mode
                              ? 'bg-[#FFC107] text-gray-900 border-[#FFC107]'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {mode === 'cash' ? '💵 Cash' : mode === 'upi' ? '📱 UPI' : mode === 'card' ? '💳 Card' : mode === 'cheque' ? '📄 Cheque' : 'Other'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.payment_mode === 'upi' && (
                    <div>
                      <label className={labelCls}>UPI Ref ID (Optional)</label>
                      <input
                        value={form.upi_ref_id || ''}
                        onChange={(e) => setForm({ ...form, upi_ref_id: e.target.value })}
                        className={inputCls}
                        placeholder="UPI reference ID"
                      />
                    </div>
                  )}
                  {form.payment_mode === 'other' && (
                    <div>
                      <label className={labelCls}>Payment Details (Optional)</label>
                      <input
                        value={form.other_payment_details || ''}
                        onChange={(e) => setForm({ ...form, other_payment_details: e.target.value })}
                        className={inputCls}
                        placeholder="Bank transfer, etc."
                      />
                    </div>
                  )}
                </>
              )}

            {(form.gift_type === 'gold' || form.gift_type === 'silver' || form.gift_type === 'gift') && (
              <div>
                <label className={labelCls}>Item Name *</label>
                <input
                  required
                  type="text"
                  value={form.gift_description}
                  onChange={(e) => setForm({ ...form, gift_description: e.target.value })}
                  className={inputCls}
                  placeholder="Gold chain, Silver plate, etc."
                />
              </div>
            )}

            {(form.gift_type === 'gold' || form.gift_type === 'silver') && (
              <div>
                <label className={labelCls}>Weight (grams) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.gold_weight}
                  onChange={(e) => setForm({ ...form, gold_weight: e.target.value })}
                  className={inputCls}
                  placeholder="8.0"
                />
              </div>
            )}

            {(form.gift_type === 'gold' || form.gift_type === 'silver' || form.gift_type === 'gift') && (
              <div>
                <label className={labelCls}>Approximate Value (₹) (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.approximate_value}
                  onChange={(e) => setForm({ ...form, approximate_value: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 5000"
                />
              </div>
            )}

            <div>
              <label className={labelCls}>Relation</label>
              <select
                value={form.relation}
                onChange={(e) => setForm({ ...form, relation: e.target.value })}
                className={selectCls}
              >
                <option value="family">Family / குடும்பம்</option>
                <option value="friend">Friend / நண்பர்</option>
                <option value="colleague">Colleague / சக ஊழியர்</option>
                <option value="relative">Relative / உற்சவம்</option>
                <option value="neighbor">Neighbor / அகிலக்</option>
                <option value="business">Business / வணிகர்</option>
                <option value="other">Other / மற்றவர்</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Notes (Vellaiyar Co.)</label>
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className={inputCls}
                placeholder="Optional notes or Company name"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Entered By</label>
              <input
                value={form.entered_by}
                onChange={(e) => setForm({ ...form, entered_by: e.target.value })}
                className={inputCls}
                placeholder="Your name"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="bg-[#FFC107] text-gray-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50"
          >
            {adding ? 'Adding…' : '+ Add Entry'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-bold text-gray-900">Entries ({entries.length})</h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guest, place, note…"
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors w-52"
              />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter Buttons */}
              <div className="flex gap-1.5">
                {(['all', 'cash', 'online'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize ${
                      filter === f
                        ? 'bg-[#FFC107] text-gray-900 border-[#FFC107]'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'cash' ? 'Cash' : 'Online'}
                  </button>
                ))}
              </div>
              {/* Sort Dropdown */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as 'high' | 'low' | 'date')}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#FFC107] transition-colors"
              >
                <option value="date">Sort: Date (Newest)</option>
                <option value="high">Sort: High to Low</option>
                <option value="low">Sort: Low to High</option>
              </select>
            </div>
          </div>

        {filtered.length === 0 ? (
           <div className="text-center py-12 text-gray-300 text-sm">{entries.length === 0 ? 'No entries yet. Add the first one above.' : 'No results found.'}</div>
         ) : (
           <div className="divide-y divide-gray-50">
             {filtered.slice(0, visibleCount).map((entry) => (
               <div key={entry.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-full bg-[#FFF8E1] border border-[#FFE082] flex items-center justify-center text-[#B8860B] font-bold text-sm">
                     {entry.guest_name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <p className="font-semibold text-gray-900 text-sm">{entry.guest_name}</p>
                     <p className="text-xs text-gray-400 capitalize mt-0.5">
                       {entry.relation} · {entry.gift_type === 'gold' ? '✨ Gold' : entry.gift_type === 'silver' ? '🥈 Silver' : entry.gift_type === 'gift' ? '🎁 Gift' : entry.payment_mode}
                       {entry.city && ` · 📍 ${entry.city}`}
                       {entry.company && ` · ${entry.company}`}
                       {entry.occupation && ` · ${entry.occupation}`}
                       {entry.note && ` · (${entry.note})`}
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="font-bold text-[#B8860B]">
                     {entry.gift_type === 'gold' ? (
                       <span>{entry.gold_weight}g Gold {entry.approximate_value ? `· ₹${Number(entry.approximate_value).toLocaleString('en-IN')}` : ''}</span>
                     ) : entry.gift_type === 'silver' ? (
                       <span>{entry.gold_weight}g Silver {entry.approximate_value ? `· ₹${Number(entry.approximate_value).toLocaleString('en-IN')}` : ''}</span>
                     ) : entry.gift_type === 'gift' ? (
                       <span className="text-gray-600 font-semibold">{entry.gift_description} {entry.approximate_value ? `· ₹${Number(entry.approximate_value).toLocaleString('en-IN')}` : ''}</span>
                     ) : (
                       <span>₹{Number(entry.amount).toLocaleString('en-IN')}</span>
                     )}
                   </span>
                   <button
                     onClick={() => handleEdit(entry)}
                     className="text-gray-300 hover:text-[#FFC107] transition-colors text-sm"
                     title="Edit entry"
                   >
                     ✏️
                   </button>
                   <button onClick={() => setConfirmDeleteId(entry.id)} className="text-gray-200 hover:text-red-400 transition-colors text-xl leading-none">×</button>
                 </div>
               </div>
             ))}
             {filtered.length > visibleCount && (
               <div className="px-5 py-3 text-center">
                 <button
                   onClick={() => setVisibleCount(prev => prev + 20)}
                   className="text-sm text-[#FFC107] font-semibold hover:underline"
                 >
                   Load More ({filtered.length - visibleCount} more)
                 </button>
               </div>
             )}
           </div>
         )}

        {entries.length > 0 && (
          <div className="px-5 py-3.5 bg-[#FFF8E1] border-t border-[#FFE082] flex flex-wrap gap-4 justify-between items-center text-sm font-semibold">
            <span className="text-gray-500">{entries.length} entries</span>
            <div className="flex flex-wrap gap-4 text-xs md:text-sm text-[#B8860B]">
              <span>Cash: <strong className="text-green-700">₹{totalCash.toLocaleString('en-IN')}</strong></span>
              <span>Gold: <strong>{totalGold}g</strong></span>
              <span>Silver: <strong>{totalSilver}g</strong></span>
              <span>Gifts: <strong className="text-red-600">{totalGifts} items</strong></span>
            </div>
          </div>
        )}
      </div>

      {confirmDeleteId !== null && (
         <ConfirmDeleteModal
           isOpen={confirmDeleteId !== null}
           title="Delete Moi Entry"
           message="Are you sure you want to delete this payment entry? This action cannot be undone."
           onConfirm={() => handleDelete(confirmDeleteId)}
           onCancel={() => setConfirmDeleteId(null)}
           isLoading={deletingId === confirmDeleteId}
         />
       )}

       {/* Edit Modal */}
       {editingEntry && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingEntry(null)}>
           <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
             <div className="flex items-center justify-between mb-4">
               <h2 className="font-bold text-gray-900 text-lg">Edit Moi Entry</h2>
               <button
                 onClick={() => setEditingEntry(null)}
                 className="text-gray-400 hover:text-gray-600 text-xl"
               >
                 ×
               </button>
             </div>
             <form onSubmit={handleUpdate} className="space-y-4">
               {/* Gift Type Row */}
               <div>
                 <label className="block text-xs font-semibold text-gray-500 mb-1.5">Gift Type</label>
                 <div className="flex gap-2">
                   {(['cash', 'gold', 'silver', 'gift'] as const).map((t) => (
                     <button
                       key={t}
                       type="button"
                       onClick={() => setEditForm({ ...editForm, gift_type: t })}
                       className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-xl border transition-all capitalize ${
                         editForm.gift_type === t
                           ? 'bg-[#FFC107] text-gray-900 border-[#FFC107] shadow-sm'
                           : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                       }`}
                     >
                       {t === 'cash' ? '💵 Cash' : t === 'gold' ? '✨ Gold' : t === 'silver' ? '🥈 Silver' : '🎁 Gift'}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div>
                   <label className={labelCls}>Guest Name *</label>
                   <input
                     required
                     value={editForm.guest_name}
                     onChange={(e) => setEditForm({ ...editForm, guest_name: e.target.value })}
                     className={inputCls}
                     placeholder="Ramesh"
                   />
                 </div>
                 <div>
                   <label className={labelCls}>City / Place</label>
                   <input
                     value={editForm.city}
                     onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                     className={inputCls}
                     placeholder="Karaikudi"
                   />
                 </div>
                 <div>
                   <label className={labelCls}>Company</label>
                   <input
                     value={editForm.company}
                     onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                     className={inputCls}
                     placeholder="Company name (optional)"
                   />
                 </div>
                 <div>
                   <label className={labelCls}>Occupation</label>
                   <input
                     value={editForm.occupation}
                     onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                     className={inputCls}
                     placeholder="Occupation (optional)"
                   />
                 </div>

                 {/* Dynamic fields */}
                  {editForm.gift_type === 'cash' && (
                    <>
                      <div>
                        <label className={labelCls}>Amount (₹) *</label>
                        <input
                          required
                          type="number"
                          min="1"
                          step="0.01"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                          className={inputCls}
                          placeholder="1000"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Payment Mode</label>
                        <div className="flex gap-2 flex-wrap">
                          {(['cash', 'upi', 'card', 'cheque', 'other'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setEditForm({ ...editForm, payment_mode: mode })}
                              className={`flex-1 py-2 px-3 text-sm font-semibold rounded-xl border transition-all capitalize ${
                                editForm.payment_mode === mode
                                  ? 'bg-[#FFC107] text-gray-900 border-[#FFC107]'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {mode === 'cash' ? '💵 Cash' : mode === 'upi' ? '📱 UPI' : mode === 'card' ? '💳 Card' : mode === 'cheque' ? '📄 Cheque' : 'Other'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {editForm.payment_mode === 'upi' && (
                        <div>
                          <label className={labelCls}>UPI Ref ID (Optional)</label>
                          <input
                            value={editForm.upi_ref_id || ''}
                            onChange={(e) => setEditForm({ ...editForm, upi_ref_id: e.target.value })}
                            className={inputCls}
                            placeholder="UPI reference ID"
                          />
                        </div>
                      )}
                      {editForm.payment_mode === 'other' && (
                        <div>
                          <label className={labelCls}>Payment Details (Optional)</label>
                          <input
                            value={editForm.other_payment_details || ''}
                            onChange={(e) => setEditForm({ ...editForm, other_payment_details: e.target.value })}
                            className={inputCls}
                            placeholder="Bank transfer, etc."
                          />
                        </div>
                      )}
                    </>
                  )}

                 {(editForm.gift_type === 'gold' || editForm.gift_type === 'silver' || editForm.gift_type === 'gift') && (
                   <div>
                     <label className={labelCls}>Item Name *</label>
                     <input
                       required
                       type="text"
                       value={editForm.gift_description}
                       onChange={(e) => setEditForm({ ...editForm, gift_description: e.target.value })}
                       className={inputCls}
                       placeholder="Gold chain, Silver plate, etc."
                     />
                   </div>
                 )}

                 {(editForm.gift_type === 'gold' || editForm.gift_type === 'silver') && (
                   <div>
                     <label className={labelCls}>Weight (grams) *</label>
                     <input
                       required
                       type="number"
                       step="0.01"
                       min="0.01"
                       value={editForm.gold_weight}
                       onChange={(e) => setEditForm({ ...editForm, gold_weight: e.target.value })}
                       className={inputCls}
                       placeholder="8.0"
                     />
                   </div>
                 )}

                 {(editForm.gift_type === 'gold' || editForm.gift_type === 'silver' || editForm.gift_type === 'gift') && (
                   <div>
                     <label className={labelCls}>Approximate Value (₹) (Optional)</label>
                     <input
                       type="number"
                       step="0.01"
                       min="0"
                       value={editForm.approximate_value}
                       onChange={(e) => setEditForm({ ...editForm, approximate_value: e.target.value })}
                       className={inputCls}
                       placeholder="e.g. 5000"
                     />
                   </div>
                 )}

                 <div>
                   <label className={labelCls}>Relation</label>
                   <select
                     value={editForm.relation}
                     onChange={(e) => setEditForm({ ...editForm, relation: e.target.value })}
                     className={selectCls}
                   >
                     <option value="family">Family / குடும்பம்</option>
                     <option value="friend">Friend / நண்பர்</option>
                     <option value="colleague">Colleague / சக ஊழியர்</option>
                     <option value="relative">Relative / உற்சவம்</option>
                     <option value="neighbor">Neighbor / அகிலக்</option>
                     <option value="business">Business / வணிகர்</option>
                     <option value="other">Other / மற்றவர்</option>
                   </select>
                 </div>
                 <div>
                   <label className={labelCls}>Notes (Vellaiyar Co.)</label>
                   <input
                     value={editForm.note}
                     onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                     className={inputCls}
                     placeholder="Optional notes or Company name"
                   />
                 </div>
                 <div className="md:col-span-2">
                   <label className={labelCls}>Entered By</label>
                   <input
                     value={editForm.entered_by}
                     onChange={(e) => setEditForm({ ...editForm, entered_by: e.target.value })}
                     className={inputCls}
                     placeholder="Your name"
                   />
                 </div>
               </div>
               <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updating}
                    className="bg-[#FFC107] text-gray-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Updating…' : 'Update Entry'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDeleteId(editingEntry?.id || null);
                      setEditingEntry(null);
                    }}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </form>
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
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
        <h2 className="font-bold text-gray-900 mb-4">Upload Photos</h2>
        <div className="flex gap-3 flex-wrap">
          <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors flex-1 min-w-[180px]" />
          <label className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-[#FFC107] text-gray-900 hover:bg-[#E6AC00]'}`}>
            {uploading ? 'Uploading…' : '📸 Choose Photo'}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
        <p className="text-xs text-gray-300 mt-2">JPG, PNG, WEBP · Max 10MB</p>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-300 text-sm">No photos yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
              <Image src={photo.s3_url} alt={photo.caption || 'Wedding photo'} fill className="object-cover cursor-pointer" onClick={() => setPreview(photo)} />
              {photo.caption && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{photo.caption}</div>}
              <button onClick={() => setConfirmDeleteId(photo.id)} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
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
  const relEmoji: Record<string, string> = { family: '👨‍👩‍👧', friend: '👫', colleague: '💼', other: '🤝' };
   const payEmoji: Record<string, string> = { cash: '💵', upi: '📱', card: '💳', cheque: '📄', other: '💰' };
   const card = "bg-white border border-gray-100 rounded-2xl p-6 shadow-card";
   
   const cashPercent = total > 0 ? Math.round((cashTotal / total) * 100) : 0;
   const onlinePercent = total > 0 ? Math.round((onlineTotal / total) * 100) : 0;
   const otherPercent = total > 0 ? Math.round((otherTotal / total) * 100) : 0;
   const goldPercent = total > 0 ? Math.round((goldWeightTotal / total) * 100) : 0;
   const silverPercent = total > 0 ? Math.round((silverWeightTotal / total) * 100) : 0;

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
        alert('Failed to download PDF. Please try again.');
      }
    } catch {
        alert('Error downloading PDF. Please try again.');
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
        <div className={`${card} text-center`}><p className="text-3xl font-bold text-[#B8860B]">₹{total.toLocaleString('en-IN')}</p><p className="text-sm text-gray-400 mt-1">Total Moi Value</p></div>
        <div className={`${card} text-center`}><p className="text-3xl font-bold text-gray-700">{entries.length}</p><p className="text-sm text-gray-400 mt-1">Total Guests</p></div>
        <div className={`${card} text-center`}><p className="text-3xl font-bold text-gray-700">₹{entries.length ? Math.round(total / entries.length).toLocaleString('en-IN') : 0}</p><p className="text-sm text-gray-400 mt-1">Average per Guest</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className={card}>
          <h3 className="font-bold text-gray-900 mb-4">By Relation</h3>
          <div className="space-y-3">
            {Object.entries(byRelation).map(([rel, data]) => (
              <div key={rel} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span>{relEmoji[rel] || '👤'}</span><span className="text-sm text-gray-700 capitalize">{rel}</span><span className="text-xs text-gray-400">({data.count})</span></div>
                <span className="font-bold text-[#B8860B] text-sm">₹{data.total.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={card}>
          <h3 className="font-bold text-gray-900 mb-4">By Payment Mode</h3>
          <div className="space-y-3">
            {Object.entries(byPayment).map(([mode, data]) => (
              <div key={mode} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span>{payEmoji[mode] || '💰'}</span><span className="text-sm text-gray-700 capitalize">{mode}</span><span className="text-xs text-gray-400">({data.count})</span></div>
                <span className="font-bold text-[#B8860B] text-sm">₹{data.total.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={card}>
         <h3 className="font-bold text-gray-900 mb-4">Payment Type Breakdown</h3>
         <div className="space-y-3">
           <div>
             <div className="flex justify-between text-sm mb-1">
               <span className="text-gray-600">Cash</span>
               <span className="font-semibold text-green-700">₹{cashTotal.toLocaleString('en-IN')} ({cashPercent}%)</span>
             </div>
             <div className="w-full bg-gray-200 rounded-full h-2">
               <div className="bg-green-500 h-2 rounded-full" style={{ width: `${cashPercent}%` }}></div>
             </div>
           </div>
           <div>
             <div className="flex justify-between text-sm mb-1">
               <span className="text-gray-600">Online (UPI/Card/Cheque)</span>
               <span className="font-semibold text-blue-600">₹{onlineTotal.toLocaleString('en-IN')} ({onlinePercent}%)</span>
             </div>
             <div className="w-full bg-gray-200 rounded-full h-2">
               <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${onlinePercent}%` }}></div>
             </div>
           </div>
           <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Other</span>
                <span className="font-semibold text-orange-600">₹{otherTotal.toLocaleString('en-IN')} ({otherPercent}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${otherPercent}%` }}></div>
              </div>
            </div>
         </div>
      </div>

      <div className={card}>
         <h3 className="font-bold text-gray-900 mb-4">Non-Cash Contributions</h3>
         <div className="space-y-3">
           <div>
             <div className="flex justify-between text-sm mb-1">
               <span className="text-gray-600">Gold ({goldWeightTotal}g)</span>
               <span className="font-semibold text-yellow-700">₹{goldValueTotal.toLocaleString('en-IN')} ({goldPercent}%)</span>
             </div>
             <div className="w-full bg-gray-200 rounded-full h-2">
               <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${goldPercent}%` }}></div>
             </div>
           </div>
           <div>
             <div className="flex justify-between text-sm mb-1">
               <span className="text-gray-600">Silver ({silverWeightTotal}g)</span>
               <span className="font-semibold text-gray-700">₹{silverValueTotal.toLocaleString('en-IN')} ({silverPercent}%)</span>
             </div>
             <div className="w-full bg-gray-200 rounded-full h-2">
               <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${silverPercent}%` }}></div>
             </div>
           </div>
           <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Gifts ({giftCount} items)</span>
                <span className="font-semibold text-red-600">₹{giftValueTotal.toLocaleString('en-IN')}</span>
              </div>
              {giftValueTotal === 0 && (
                <p className="text-xs text-gray-400 mt-1">Value not recorded for some or all gifts</p>
              )}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-400 h-2 rounded-full" style={{ width: `${giftTotal > 0 ? Math.min(100, giftPercent) : 0}%` }}></div>
              </div>
            </div>
            {otherTotal > 0 && (
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-600">Other</span>
                 <span className="font-semibold text-orange-600">₹{otherTotal.toLocaleString('en-IN')} ({otherPercent}%)</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                 <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${otherPercent}%` }}></div>
               </div>
             </div>
           )}
           {goldTotal > 0 && (
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-600">Gold</span>
                 <span className="font-semibold text-yellow-700">{goldTotal}g ({goldPercent}%)</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                 <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${goldPercent}%` }}></div>
               </div>
             </div>
           )}
           {silverTotal > 0 && (
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-600">Silver</span>
                 <span className="font-semibold text-gray-600">{silverTotal}g ({silverPercent}%)</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                 <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${silverPercent}%` }}></div>
               </div>
             </div>
           )}
         </div>
       </div>

      {top3.length > 0 && (
        <div className={card}>
          <h3 className="font-bold text-gray-900 mb-4">🏆 Top 3 Contributors</h3>
          <div className="space-y-1">
            {top3.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{['🥇','🥈','🥉'][i]}</span>
                  <div><p className="font-semibold text-gray-900 text-sm">{e.guest_name}</p><p className="text-xs text-gray-400 capitalize">{e.relation}</p></div>
                </div>
                <span className="font-bold text-[#B8860B]">₹{Number(e.amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FFC107] text-gray-900 rounded-xl text-sm font-bold hover:bg-[#E6AC00] transition-colors"
        >
          📥 Download PDF
        </button>
        <button
          onClick={handleWhatsAppShare}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors"
        >
          📱 Share via WhatsApp
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
        alert(`Successfully uploaded ${data.count} invitations`);
      } else {
        alert(data.error || 'Failed to upload invitations');
      }
    } catch {
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Auto-match invitations with moi entries
  const matchedInvitations = invitations.map(inv => {
    const matchingEntry = entries.find(e => 
      e.guest_name.toLowerCase() === inv.name.toLowerCase() ||
      (e.city && e.city.toLowerCase() === inv.city.toLowerCase())
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
       <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
         <h2 className="font-bold text-gray-900 mb-4">Upload Invitation List</h2>
         <div className="flex gap-3 flex-wrap">
           <input
             ref={fileInputRef}
             type="file"
             accept=".csv,.xlsx"
             onChange={(e) => setFile(e.target.files?.[0] || null)}
             className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#FFC107] transition-colors flex-1 min-w-[180px]"
           />
           <button
             onClick={handleUpload}
             disabled={!file || uploading}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
               !file || uploading ? 'bg-gray-100 text-gray-400' : 'bg-[#FFC107] text-gray-900 hover:bg-[#E6AC00]'
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
             className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
           >
             📄 Sample Template
           </button>
         </div>
         <p className="text-xs text-gray-300 mt-2">CSV or XLSX format. Required columns: Name, Phone, Relation, City. <button onClick={() => {
           const csvContent = 'Name,Phone,Relation,City\nRamesh,9876543210,family,Chennai\nPriya,9876543211,friend,Bangalore\n';
           const blob = new Blob([csvContent], { type: 'text/csv' });
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = 'invitation-template.csv';
           a.click();
           URL.revokeObjectURL(url);
         }} className="text-[#FFC107] hover:underline">Download sample CSV</button></p>
       </div>

      {notInvitedButGaveMoi.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ Not in Invitation List</h3>
          <p className="text-sm text-yellow-700">
            {notInvitedButGaveMoi.length} person(s) gave moi but were not in the invitation list:
          </p>
          <ul className="mt-2 text-sm text-yellow-700">
            {notInvitedButGaveMoi.slice(0, 5).map(e => (
              <li key={e.id}>• {e.guest_name}</li>
            ))}
            {notInvitedButGaveMoi.length > 5 && <li>• and {notInvitedButGaveMoi.length - 5} more...</li>}
          </ul>
        </div>
      )}

      {invitedButDidNotAttend.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h3 className="font-bold text-blue-800 mb-2">📅 Invited but Not Attended</h3>
          <p className="text-sm text-blue-700">
            {invitedButDidNotAttend.length} person(s) were invited but haven&apos;t given moi yet.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
        <h3 className="font-bold text-gray-900 mb-4">Attendance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xl font-bold text-gray-700">{summary.invited}</p>
            <p className="text-xs text-gray-400">Invited</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <p className="text-xl font-bold text-green-700">{summary.came}</p>
            <p className="text-xs text-gray-400">Came</p>
          </div>
          <div className="text-center p-3 bg-[#FFF8E1] rounded-xl">
            <p className="text-xl font-bold text-[#B8860B]">{summary.gaveMoi}</p>
            <p className="text-xs text-gray-400">Gave Moi</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-xl">
            <p className="text-xl font-bold text-red-600">{summary.noShow}</p>
            <p className="text-xs text-gray-400">No Show</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-bold text-gray-900">Invitations ({invitations.length})</h2>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'invited', 'came', 'gave_moi', 'no_show'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize ${
                  filter === f
                    ? 'bg-[#FFC107] text-gray-900 border-[#FFC107]'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? 'All' : f === 'gave_moi' ? 'Gave Moi' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 border-b border-gray-100">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invitations…"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-300 text-sm">Loading invitations…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-300 text-sm">
            {invitations.length === 0 ? 'No invitations uploaded yet.' : 'No results found.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {filtered.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{inv.name}</p>
                  <p className="text-xs text-gray-400 capitalize">
                    {inv.relation} • {inv.phone} • {inv.city}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                  inv.status === 'gave_moi' ? 'bg-[#FFF8E1] text-[#B8860B]' :
                  inv.status === 'came' ? 'bg-green-100 text-green-700' :
                  inv.status === 'no_show' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
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
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-gray-700">{returnGifts.length}</p>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">Total Tracked</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-yellow-700">{pendingCount}</p>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">Pending</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-green-700">{returnedCount}</p>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">Returned</p>
        </div>
      </div>

      {/* Add Return Gift Form */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
        <h2 className="font-bold text-gray-900 mb-4">Add Return Gift</h2>
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
                      ? 'bg-[#FFC107] text-gray-900 border-[#FFC107]'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t === 'none' ? 'None' : t === 'cash' ? '💵 Cash' : t === 'gold' ? '✨ Gold' : '🎁 Gift'}
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
            className="bg-[#FFC107] text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Return Gift'}
          </button>
        </form>
      </div>

      {/* Return Gifts List */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-card">
        <div className="px-5 py-4 border-b border-gray-100">
           <h2 className="font-bold text-gray-900">Return Gifts ({returnGifts.length})</h2>
         </div>
         {loading ? (
           <div className="text-center py-12 text-gray-300 text-sm">Loading return gifts…</div>
         ) : returnGifts.length === 0 ? (
           <div className="text-center py-12 text-gray-300 text-sm">No return gifts tracked yet.</div>
         ) : (
           <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
             {returnGifts.map((r) => (
                 <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                   <div>
                     <p className="font-semibold text-gray-900 text-sm">{r.guest_name}</p>
                     <p className="text-xs text-gray-400">
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
                       r.status === 'returned' ? 'bg-green-100 text-green-700' :
                       r.status === 'not_applicable' ? 'bg-gray-100 text-gray-600' :
                       'bg-yellow-100 text-yellow-700'
                     }`}>
                       {r.status}
                     </span>
                     <button
                       onClick={() => handleEdit(r)}
                       className="text-gray-300 hover:text-[#FFC107] transition-colors text-sm"
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
             <h2 className="font-bold text-gray-900 text-lg">Edit Return Gift</h2>
             <button
               onClick={() => setEditingReturnGift(null)}
               className="text-gray-400 hover:text-gray-600 text-xl"
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
                         ? 'bg-[#FFC107] text-gray-900 border-[#FFC107]'
                         : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                     }`}
                   >
                     {t === 'none' ? 'None' : t === 'cash' ? '💵 Cash' : t === 'gold' ? '✨ Gold' : '🎁 Gift'}
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
                 className="bg-[#FFC107] text-gray-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50"
               >
                 {updating ? 'Updating…' : 'Update Return Gift'}
               </button>
               <button
                   type="button"
                   onClick={() => setEditingReturnGift(null)}
                   className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
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
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
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
