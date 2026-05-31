'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { eventsApi, moiApi, photosApi, exportCSV, Event, MoiEntry, Photo } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

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

type Tab = 'moi' | 'photos' | 'summary';

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

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    eventsApi.get(slug).then((ev) => {
      setEvent(ev);
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

  const totalCash = entries.filter(e => e.gift_type === 'cash' || !e.gift_type).reduce((s, e) => s + Number(e.amount), 0);
  const totalGold = entries.filter(e => e.gift_type === 'gold').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
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
                {event.bride_name} &amp; {event.groom_name}
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

              {/* Event header */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
                <div className="h-1 bg-[#FFC107] rounded-full mb-5 -mx-6 -mt-6 rounded-t-2xl" />
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{event.bride_name} &amp; {event.groom_name}</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      📅 {new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {event.venue && <span> · 📍 {event.venue}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap shrink-0">
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
                {(['moi', 'photos', 'summary'] as Tab[]).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-[#FFC107] text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}>
                    {t === 'moi' ? '📋 Moi Register' : t === 'photos' ? '📸 Photos' : '📊 Summary'}
                  </button>
                ))}
              </div>

              {tab === 'moi'     && <MoiTab     eventId={event.id} entries={entries} onAdd={(e) => setEntries([e, ...entries])} onDelete={(id) => setEntries(entries.filter((e) => e.id !== id))} />}
              {tab === 'photos'  && <PhotosTab  eventId={event.id} photos={photos}   onAdd={(p) => setPhotos([p, ...photos])}   onDelete={(id) => setPhotos(photos.filter((p) => p.id !== id))} />}
              {tab === 'summary' && <SummaryTab entries={entries} />}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// ── Moi Tab ───────────────────────────────────────────────────────────────────
function MoiTab({ eventId, entries, onAdd, onDelete }: { eventId: number; entries: MoiEntry[]; onAdd: (e: MoiEntry) => void; onDelete: (id: number) => void }) {
  const [form, setForm] = useState({
    guest_name: '',
    city: '',
    gift_type: 'cash' as 'cash' | 'gold' | 'gift',
    amount: '',
    gold_weight: '',
    gift_description: '',
    relation: 'friend',
    payment_mode: 'cash',
    note: '',
    entered_by: ''
  });
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [isListening, setIsListening] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const amountVal = form.gift_type === 'cash' ? parseFloat(form.amount || '0') : 0;
      const goldVal = form.gift_type === 'gold' ? parseFloat(form.gold_weight || '0') : null;
      const giftDescVal = form.gift_type === 'gift' ? form.gift_description : null;

      const res = await moiApi.add({
        ...form,
        city: form.city || null,
        amount: amountVal,
        gold_weight: goldVal,
        gift_description: giftDescVal,
        event_id: eventId,
        relation: form.relation as MoiEntry['relation'],
        payment_mode: form.payment_mode as MoiEntry['payment_mode']
      });

      onAdd({
        id: res.id,
        event_id: eventId,
        guest_name: form.guest_name,
        city: form.city || null,
        gift_type: form.gift_type,
        amount: amountVal,
        gold_weight: goldVal,
        gift_description: giftDescVal,
        relation: form.relation as MoiEntry['relation'],
        payment_mode: form.payment_mode as MoiEntry['payment_mode'],
        note: form.note,
        entered_by: form.entered_by,
        created_at: new Date().toISOString()
      });

      setForm(prev => ({
        ...prev,
        guest_name: '',
        city: '',
        amount: '',
        gold_weight: '',
        gift_description: '',
        note: ''
      }));
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    } finally {
      setAdding(false);
    }
  };

  const startSpeechRecognition = () => {
    const win = window as Window & typeof globalThis & {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    const rec = new SpeechRecognition() as {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onstart: () => void;
      onend: () => void;
      onerror: () => void;
      onresult: (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
      start: () => void;
    };
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      parseVoiceInput(text);
    };
    rec.start();
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
    let gift_type: 'cash' | 'gold' | 'gift' = 'cash';

    if (/family|family member/i.test(text)) relation = 'family';
    else if (/friend|friends/i.test(text)) relation = 'friend';
    else if (/colleague|office/i.test(text)) relation = 'colleague';
    else if (/other/i.test(text)) relation = 'other';

    const isGold = /gold|grams|sovereign|gold|gram/i.test(text);
    const isGift = /gift|present|silver|vessel|plate|cup/i.test(text);

    if (isGold) {
      gift_type = 'gold';
      if (numbers && numbers.length > 0) {
        gold_weight = numbers[0];
      }
    } else if (isGift) {
      gift_type = 'gift';
      const match = text.match(/(?:gift|present)\s+(.*)/i) || text.match(/(silver.*|plate.*|vessel.*|clock.*)/i);
      gift_description = match ? match[1] : 'Gift item';
    } else {
      gift_type = 'cash';
      if (numbers && numbers.length > 0) {
        amount = numbers[0];
      }
    }

    const ignoreWords = ['friend', 'friends', 'family', 'colleague', 'other', 'gold', 'gift', 'gram', 'grams', 'grams gold', 'silver', 'cash', 'upi', 'card', 'cheque', 'rupees', 'rupee', 'in', 'at', 'from'];
    const candidates = words.filter(w => !ignoreWords.includes(w.toLowerCase()) && !/^\d+(\.\d+)?$/.test(w));

    if (candidates.length > 0) {
      name = candidates[0].charAt(0).toUpperCase() + candidates[0].slice(1);
    }
    if (candidates.length > 1) {
      city = candidates.slice(1).join(' ').trim();
      city = city.charAt(0).toUpperCase() + city.slice(1);
    }

    setForm(prev => ({
      ...prev,
      guest_name: name || prev.guest_name,
      city: city || prev.city,
      gift_type,
      amount: amount || prev.amount,
      gold_weight: gold_weight || prev.gold_weight,
      gift_description: gift_description || prev.gift_description,
      relation
    }));
  };

  const filtered = entries.filter((e) =>
    e.guest_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.city && e.city.toLowerCase().includes(search.toLowerCase())) ||
    (e.note && e.note.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCash = entries.filter(e => e.gift_type === 'cash' || !e.gift_type).reduce((s, e) => s + Number(e.amount), 0);
  const totalGold = entries.filter(e => e.gift_type === 'gold').reduce((s, e) => s + Number(e.gold_weight || 0), 0);
  const totalGifts = entries.filter(e => e.gift_type === 'gift').length;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Add Moi Entry</h2>
          <button
            type="button"
            onClick={startSpeechRecognition}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isListening
                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-500'
            }`}
            title="Click to speak: e.g., 'Ramesh 500 Chennai' or 'Karthik 8 grams gold'"
          >
            <span>🎙️</span>
            <span>{isListening ? 'Listening...' : 'Voice Entry'}</span>
          </button>
        </div>

        <form onSubmit={handleAdd} className="space-y-4">
          {/* Gift Type Row */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Gift Type</label>
            <div className="flex gap-2">
              {(['cash', 'gold', 'gift'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, gift_type: t })}
                  className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-xl border transition-all capitalize ${
                    form.gift_type === t
                      ? 'bg-[#FFC107] text-gray-900 border-[#FFC107] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t === 'cash' ? '💵 Cash' : t === 'gold' ? '✨ Gold' : '🎁 Gift'}
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
                  <select
                    value={form.payment_mode}
                    onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                    className={selectCls}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </>
            )}

            {form.gift_type === 'gold' && (
              <div>
                <label className={labelCls}>Gold Weight (grams) *</label>
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

            {form.gift_type === 'gift' && (
              <div>
                <label className={labelCls}>Gift Description *</label>
                <input
                  required
                  type="text"
                  value={form.gift_description}
                  onChange={(e) => setForm({ ...form, gift_description: e.target.value })}
                  className={inputCls}
                  placeholder="Silver plate, wall clock, etc."
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
                <option value="other">Other</option>
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
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-bold text-gray-900">Entries ({entries.length})</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guest, place, note…"
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors w-52"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-300 text-sm">{entries.length === 0 ? 'No entries yet. Add the first one above.' : 'No results found.'}</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#FFF8E1] border border-[#FFE082] flex items-center justify-center text-[#B8860B] font-bold text-sm">
                    {entry.guest_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{entry.guest_name}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">
                      {entry.relation} · {entry.gift_type === 'gold' ? 'Gold ✨' : entry.gift_type === 'gift' ? 'Gift 🎁' : entry.payment_mode}
                      {entry.city && ` · 📍 ${entry.city}`}
                      {entry.note && ` · (${entry.note})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#B8860B]">
                    {entry.gift_type === 'gold' ? (
                      <span>{entry.gold_weight}g Gold</span>
                    ) : entry.gift_type === 'gift' ? (
                      <span className="text-gray-600 font-semibold">{entry.gift_description}</span>
                    ) : (
                      <span>₹{Number(entry.amount).toLocaleString('en-IN')}</span>
                    )}
                  </span>
                  <button onClick={() => setConfirmDeleteId(entry.id)} className="text-gray-200 hover:text-red-400 transition-colors text-xl leading-none">×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <div className="px-5 py-3.5 bg-[#FFF8E1] border-t border-[#FFE082] flex flex-wrap gap-4 justify-between items-center text-sm font-semibold">
            <span className="text-gray-500">{entries.length} entries</span>
            <div className="flex flex-wrap gap-4 text-xs md:text-sm text-[#B8860B]">
              <span>Cash: <strong className="text-green-700">₹{totalCash.toLocaleString('en-IN')}</strong></span>
              <span>Gold: <strong>{totalGold}g</strong></span>
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
function SummaryTab({ entries }: { entries: MoiEntry[] }) {
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const byRelation = entries.reduce<Record<string, { count: number; total: number }>>((acc, e) => {
    if (!acc[e.relation]) acc[e.relation] = { count: 0, total: 0 };
    acc[e.relation].count++; acc[e.relation].total += Number(e.amount); return acc;
  }, {});
  const byPayment = entries.reduce<Record<string, { count: number; total: number }>>((acc, e) => {
    if (!acc[e.payment_mode]) acc[e.payment_mode] = { count: 0, total: 0 };
    acc[e.payment_mode].count++; acc[e.payment_mode].total += Number(e.amount); return acc;
  }, {});
  const top5 = [...entries].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5);
  const relEmoji: Record<string, string> = { family: '👨‍👩‍👧', friend: '👫', colleague: '💼', other: '🤝' };
  const payEmoji: Record<string, string> = { cash: '💵', upi: '📱', card: '💳', cheque: '📄' };
  const card = "bg-white border border-gray-100 rounded-2xl p-6 shadow-card";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${card} text-center`}><p className="text-3xl font-bold text-[#B8860B]">₹{total.toLocaleString('en-IN')}</p><p className="text-sm text-gray-400 mt-1">Total Moi Collected</p></div>
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

      {top5.length > 0 && (
        <div className={card}>
          <h3 className="font-bold text-gray-900 mb-4">🏆 Top Contributors</h3>
          <div className="space-y-1">
            {top5.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                  <div><p className="font-semibold text-gray-900 text-sm">{e.guest_name}</p><p className="text-xs text-gray-400 capitalize">{e.relation}</p></div>
                </div>
                <span className="font-bold text-[#B8860B]">₹{Number(e.amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
