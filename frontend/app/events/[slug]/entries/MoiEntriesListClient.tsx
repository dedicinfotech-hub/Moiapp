'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { eventsApi, moiApi, Event, MoiEntry } from '@/lib/api';
import HostEntryShell from '@/components/event/HostEntryShell';
import EventContextCard from '@/components/event/EventContextCard';
import ConfirmModal from '@/components/ConfirmModal';
import { useSlug } from '@/lib/useSlug';

type SortKey = 'newest' | 'oldest' | 'high' | 'low';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#FFC107', '#22C55E', '#3B82F6', '#F97316', '#FFC107'];

export default function MoiEntriesListScreen() {
  const router = useRouter();
  const slug = useSlug(1); // /events/[slug]/entries → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [entries, setEntries] = useState<MoiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ guest_name: '', amount: '', relation: 'friend', note: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);


  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const eventData = await eventsApi.get(slug);
        setEvent(eventData);
        const entriesData = await moiApi.list(eventData.id);
        setEntries(entriesData.entries || []);
      } catch {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => {
        if (!q) return true;
        return (
          e.guest_name.toLowerCase().includes(q) ||
          (e.relation || '').toLowerCase().includes(q) ||
          (e.city || '').toLowerCase().includes(q) ||
          (e.company || '').toLowerCase().includes(q) ||
          (e.occupation || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const ta = new Date(a.created_at).getTime();
        const tb = new Date(b.created_at).getTime();
        if (sort === 'newest') return tb - ta;
        if (sort === 'oldest') return ta - tb;
        const av = Number(a.amount);
        const bv = Number(b.amount);
        return sort === 'high' ? bv - av : av - bv;
      });
  }, [entries, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const totalCollection = entries.reduce((s, e) => s + Number(e.amount), 0);
  const totalCash = entries.filter((e) => e.payment_mode === 'cash' || e.gift_type === 'cash').reduce((s, e) => s + Number(e.amount), 0);
  const totalOthers = totalCollection - totalCash;

  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Amount', 'Type', 'Payment Mode', 'Date'];
    const rows = filtered.map((e) => [e.guest_name, e.phone || '', e.amount, e.gift_type, e.payment_mode, new Date(e.created_at).toLocaleString('en-IN')]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `moi-entries-${slug}.csv`;
    link.click();
  };

  const openEdit = (entry: MoiEntry) => {
    setEditId(entry.id);
    setEditForm({
      guest_name: entry.guest_name,
      amount: String(entry.amount ?? ''),
      relation: entry.relation || 'friend',
      note: entry.note || '',
    });
  };

  const saveEdit = async () => {
    if (!editId || !event) return;
    setSaving(true);
    try {
      await moiApi.update(editId, {
        guest_name: editForm.guest_name,
        amount: Number(editForm.amount) || 0,
        relation: editForm.relation as MoiEntry['relation'],
        note: editForm.note,
      });
      setEntries((prev) => prev.map((e) => e.id === editId ? { ...e, guest_name: editForm.guest_name, amount: Number(editForm.amount) || 0, relation: editForm.relation as MoiEntry['relation'], note: editForm.note } : e));
      setEditId(null);
    } catch {
      // handled by toast
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (id: number) => {
    if (!event) return;
    setDeletingId(id);
    try {
      await moiApi.delete(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // handled by toast
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-tn-light flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Collection', value: `₹${totalCollection.toLocaleString('en-IN')}`, color: '#FFC107' },
    { label: 'Total Entries', value: String(entries.length), color: '#22C55E' },
    { label: 'Cash', value: `₹${totalCash.toLocaleString('en-IN')}`, color: '#3B82F6' },
    { label: 'Others', value: `₹${totalOthers.toLocaleString('en-IN')}`, color: '#F97316' },
  ];

  const getStatBg = (color: string) => {
    if (color === '#FFC107') return 'bg-tn-yellow/10';
    if (color === '#22C55E') return 'bg-tn-success/10';
    if (color === '#3B82F6') return 'bg-tn-blue-soft/10';
    if (color === '#F97316') return 'bg-tn-warning/10';
    return 'bg-tn-purple-bg';
  };

  return (
    <HostEntryShell slug={slug} title="Moi Entries" activeTab="entries" onBack={() => router.push(`/events/${slug}/dashboard`)} sidebarOverride="closed">
      <EventContextCard event={event} icon="gift" detailsHref={`/events/${slug}/dashboard`} />

      <div className="grid grid-cols-4 gap-2 mb-5">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white border border-tn-border rounded-xl p-2 text-center ${getStatBg(s.color)}`}>
            <div className="w-6 h-6 rounded-lg mx-auto mb-1 flex items-center justify-center" style={{ backgroundColor: `${s.color}18` }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            </div>
            <p className="text-[8px] text-tn-muted leading-tight">{s.label}</p>
            <p className="text-[10px] font-bold text-tn-text mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white border border-tn-border rounded-xl pl-9 pr-3 py-2.5 text-xs"
            placeholder="Search name, phone, relation..."
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-tn-subtle" width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="text-[10px] border border-tn-border rounded-xl px-2 py-2.5 bg-white text-tn-muted"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="high">High → Low</option>
          <option value="low">Low → High</option>
        </select>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-tn-text">All Entries ({filtered.length})</p>
        <p className="text-[10px] text-tn-muted">Page {pageSafe} / {totalPages}</p>
      </div>

      <div className="space-y-0 bg-white border border-tn-border rounded-2xl overflow-hidden mb-24">
        {pageItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-tn-subtle">No entries found</p>
        ) : (
          pageItems.map((entry, i) => (
            <div key={entry.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-tn-border' : ''}`}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                {initials(entry.guest_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-tn-text truncate">{entry.guest_name}</p>
                <div className="flex gap-1 mt-1 flex-wrap items-center">
                  <span className="text-[9px] font-medium bg-tn-green-bg text-tn-success px-1.5 py-0.5 rounded-full capitalize">{entry.payment_mode}</span>
                  <span className="text-[9px] font-medium bg-tn-purple-bg text-tn-yellow px-1.5 py-0.5 rounded-full capitalize inline-flex items-center gap-1">
                    {entry.gift_type === 'gift' ? <><Icon name="gift" size={12} /> Gift</> : entry.note?.includes('[Advance]') ? 'Advance' : 'Moi Collection'}
                  </span>
                  {entry.relation && (
                    <span className="text-[9px] font-medium bg-tn-warning/20 text-tn-warning px-1.5 py-0.5 rounded-full capitalize">{entry.relation}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-tn-text">
                  {entry.gift_type === 'gift' && !entry.amount ? 'Gift' : `₹${Number(entry.amount).toLocaleString('en-IN')}`}
                </p>
                <p className="text-[9px] text-tn-subtle">
                  {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(entry.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button type="button" onClick={() => openEdit(entry)} className="text-[10px] font-semibold text-tn-yellow">Edit</button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(entry.id)}
                  className="text-[10px] font-semibold text-tn-error"
                >
                  {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Delete Entry"
        message="Are you sure you want to delete this moi entry?"
        confirmText="Delete"
        variant="danger"
        onConfirm={() => { if (confirmDeleteId) confirmDelete(confirmDeleteId); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {filtered.length > pageSize && (
        <div className="fixed bottom-[68px] left-0 right-0 px-4 pb-3 bg-gradient-to-t from-tn-light via-tn-light to-transparent pt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="w-full h-12 bg-white border border-tn-border rounded-xl font-semibold text-xs text-tn-muted"
          >
            Load More ({filtered.length - pageSafe * pageSize} remaining)
          </button>
        </div>
      )}

      <div className="bottom-[68px] left-0 right-0 px-4 bg-gradient-to-t from-tn-light via-tn-light to-transparent pt-4 pb-3">
        <div className="max-w-lg mx-auto grid grid-cols-2 md:grid-cols-4 gap-2">
          <button type="button" onClick={() => router.push(`/events/${slug}/moi-entry`)} className="h-12 bg-tn-yellow text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-1">
            <span className="text-lg">+</span> Manual
          </button>
          <button type="button" onClick={() => router.push(`/events/${slug}/voice-entry`)} className="h-12 bg-tn-blue-soft text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            Voice
          </button>
          <button type="button" onClick={() => router.push(`/events/${slug}/gift-entry`)} className="h-12 bg-tn-warning text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v4"/><rect x="4" y="12" width="16" height="8" rx="2"/><path d="M12 12v4"/><path d="M8 16h1"/><path d="M15 16h1"/></svg>
            Gift
          </button>
          <button type="button" onClick={handleExportCSV} className="h-12 border border-tn-border bg-white rounded-xl font-semibold text-xs text-tn-muted flex items-center justify-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
        </div>
      </div>

      {editId !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-3">
            <p className="text-sm font-bold text-tn-text">Edit Entry</p>
            <div>
              <label className="text-[10px] font-semibold text-tn-muted">Guest Name</label>
              <input
                value={editForm.guest_name}
                onChange={(e) => setEditForm((f) => ({ ...f, guest_name: e.target.value }))}
                className="mt-1 w-full border border-tn-border rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-tn-muted">Amount (₹)</label>
              <input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                className="mt-1 w-full border border-tn-border rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-tn-muted">Relation</label>
              <select
                value={editForm.relation}
                onChange={(e) => setEditForm((f) => ({ ...f, relation: e.target.value }))}
                className="mt-1 w-full border border-tn-border rounded-xl px-3 py-2 text-xs"
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
            <div>
              <label className="text-[10px] font-semibold text-tn-muted">Note</label>
              <textarea
                value={editForm.note}
                onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                className="mt-1 w-full border border-tn-border rounded-xl px-3 py-2 text-xs"
                rows={2}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setEditId(null)} className="flex-1 h-10 rounded-xl border border-tn-border text-xs font-semibold text-tn-muted">Cancel</button>
              <button type="button" onClick={saveEdit} disabled={saving} className="flex-1 h-10 rounded-xl bg-tn-yellow text-white text-xs font-semibold">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </HostEntryShell>
  );
}
