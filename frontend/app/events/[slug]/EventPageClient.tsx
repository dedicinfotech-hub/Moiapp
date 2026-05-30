'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { eventsApi, moiApi, photosApi, exportCSV, Event, MoiEntry, Photo } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// In static export useParams() always returns the placeholder slug '_'.
// Read the real slug from the URL path instead.
function useSlug(): string {
  const [slug, setSlug] = useState('');
  useEffect(() => {
    const parts = window.location.pathname.replace(/\/$/, '').split('/');
    const s = parts[parts.length - 1];
    setSlug(s === '_' ? '' : s);
  }, []);
  return slug;
}

type Tab = 'moi' | 'photos' | 'summary';

const inputCls  = "w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors";
const labelCls  = "block text-xs font-semibold text-gray-500 mb-1";
const selectCls = `${inputCls} appearance-none bg-white`;

export default function EventPage() {
  const slug = useSlug();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [event, setEvent]     = useState<Event | null>(null);
  const [entries, setEntries] = useState<MoiEntry[]>([]);
  const [photos, setPhotos]   = useState<Photo[]>([]);
  const [tab, setTab]         = useState<Tab>('moi');
  const [loading, setLoading] = useState(true);

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

  const total    = entries.reduce((s, e) => s + Number(e.amount), 0);
  const shareUrl = `${window.location.origin}/e/${event.slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-5">
          ← Dashboard
        </Link>

        {/* Event header */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-card">
          <div className="h-1 bg-[#FFC107] rounded-full mb-5 -mx-6 -mt-6 rounded-t-2xl" />
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{event.bride_name} & {event.groom_name}</h1>
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

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-[#B8860B]">₹{total.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400 mt-1">Total Moi</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-gray-700">{entries.length}</p>
              <p className="text-xs text-gray-400 mt-1">Guests</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-gray-700">{photos.length}</p>
              <p className="text-xs text-gray-400 mt-1">Photos</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-6 w-fit shadow-card">
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
    </div>
  );
}

// ── Moi Tab ───────────────────────────────────────────────────────────────────
function MoiTab({ eventId, entries, onAdd, onDelete }: { eventId: number; entries: MoiEntry[]; onAdd: (e: MoiEntry) => void; onDelete: (id: number) => void }) {
  const [form, setForm] = useState({ guest_name: '', amount: '', relation: 'friend', payment_mode: 'cash', note: '', entered_by: '' });
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await moiApi.add({ ...form, amount: parseFloat(form.amount), event_id: eventId, relation: form.relation as MoiEntry['relation'], payment_mode: form.payment_mode as MoiEntry['payment_mode'] });
      onAdd({ id: res.id, event_id: eventId, guest_name: form.guest_name, amount: parseFloat(form.amount), relation: form.relation as MoiEntry['relation'], payment_mode: form.payment_mode as MoiEntry['payment_mode'], note: form.note, entered_by: form.entered_by, created_at: new Date().toISOString() });
      setForm({ guest_name: '', amount: '', relation: 'friend', payment_mode: 'cash', note: '', entered_by: '' });
    } finally {
      setAdding(false);
    }
  };

  const filtered = entries.filter((e) => e.guest_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
        <h2 className="font-bold text-gray-900 mb-4">Add Moi Entry</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={labelCls}>Guest Name *</label><input required value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} className={inputCls} placeholder="Murugan" /></div>
            <div><label className={labelCls}>Amount (₹) *</label><input required type="number" min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="1000" /></div>
            <div><label className={labelCls}>Relation</label>
              <select value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} className={selectCls}>
                <option value="family">Family / குடும்பம்</option>
                <option value="friend">Friend / நண்பர்</option>
                <option value="colleague">Colleague / சக ஊழியர்</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div><label className={labelCls}>Payment Mode</label>
              <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })} className={selectCls}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div><label className={labelCls}>Note</label><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputCls} placeholder="Optional note" /></div>
            <div><label className={labelCls}>Entered By</label><input value={form.entered_by} onChange={(e) => setForm({ ...form, entered_by: e.target.value })} className={inputCls} placeholder="Your name" /></div>
          </div>
          <button type="submit" disabled={adding} className="bg-[#FFC107] text-gray-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50">
            {adding ? 'Adding…' : '+ Add Entry'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Entries ({entries.length})</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guest…" className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors w-44" />
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
                    <p className="text-xs text-gray-400 capitalize">{entry.relation} · {entry.payment_mode}{entry.note && ` · ${entry.note}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#B8860B]">₹{Number(entry.amount).toLocaleString('en-IN')}</span>
                  <button onClick={async () => { if (!confirm('Delete this entry?')) return; await moiApi.delete(entry.id); onDelete(entry.id); }} className="text-gray-200 hover:text-red-400 transition-colors text-xl leading-none">×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <div className="px-5 py-3.5 bg-[#FFF8E1] border-t border-[#FFE082] flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-500">Total</span>
            <span className="font-bold text-[#B8860B] text-lg">₹{entries.reduce((s, e) => s + Number(e.amount), 0).toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Photos Tab ────────────────────────────────────────────────────────────────
function PhotosTab({ eventId, photos, onAdd, onDelete }: { eventId: number; photos: Photo[]; onAdd: (p: Photo) => void; onDelete: (id: number) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Photo | null>(null);

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
              <button onClick={async () => { if (!confirm('Delete?')) return; await photosApi.delete(photo.id); onDelete(photo.id); }} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
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
