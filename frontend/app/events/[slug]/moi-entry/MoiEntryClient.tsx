'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon, { type IconName } from '@/components/ui/Icon';
import { eventsApi, moiApi, Event, MoiEntry } from '@/lib/api';
import HostEntryShell from '@/components/event/HostEntryShell';
import EventContextCard from '@/components/event/EventContextCard';
import { useSlug } from '@/lib/useSlug';

type EntryType = 'collection' | 'advance';

const PRESETS = [101, 501, 1001];

export default function MoiEntryScreen() {
  const router = useRouter();
  const slug = useSlug(1); // /events/[slug]/moi-entry → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [entryType, setEntryType] = useState<EntryType>('collection');
  const [entryTime] = useState(() => new Date());

  const [form, setForm] = useState({
    guest_name: '',
    phone: '',
    city: '',
    company: '',
    occupation: '',
    relation: 'friend' as 'family' | 'friend' | 'colleague' | 'relative' | 'neighbor' | 'business' | 'other',
    amount: '',
    payment_mode: 'cash' as MoiEntry['payment_mode'],
    upi_ref_id: '',
    other_payment_details: '',
    note: '',
  });

  useEffect(() => {
    if (!slug) return; // wait for slug to resolve from window.location
    eventsApi.get(slug).then(setEvent).catch(() => router.push('/dashboard')).finally(() => setLoading(false));
    if (typeof window !== 'undefined') {
      const draft = sessionStorage.getItem(`host_moi_draft_${slug}`);
      if (draft) {
        try { setForm((f) => ({ ...f, ...JSON.parse(draft) })); } catch { /* ignore */ }
      }
      const pm = sessionStorage.getItem(`host_payment_mode_${slug}`);
      if (pm) {
        try {
          const parsed = JSON.parse(pm);
          setForm((f) => ({ ...f, payment_mode: parsed.mode }));
        } catch { /* ignore */ }
      }
    }
  }, [slug, router]);

  useEffect(() => {
    sessionStorage.setItem(`host_moi_draft_${slug}`, JSON.stringify(form));
  }, [form, slug]);

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!event || !form.guest_name || !form.amount) return;
    setSaving(true);
    setError('');
    try {
      await moiApi.add({
        event_id: event.id,
        guest_name: form.guest_name,
        phone: form.phone.trim() || null,
        relation: form.relation,
        city: form.city.trim() || undefined,
        company: form.company.trim() || undefined,
        occupation: form.occupation.trim() || undefined,
        amount: Number(form.amount),
        gift_type: 'cash',
        payment_mode: form.payment_mode,
        upi_ref_id: form.upi_ref_id?.trim() || null,
        other_payment_details: form.other_payment_details?.trim() || null,
        note: entryType === 'advance' ? `[Advance] ${form.note}` : form.note,
        entered_by: 'host_manual',
      });
      sessionStorage.removeItem(`host_moi_draft_${slug}`);
      router.push(`/events/${slug}/entries`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-tn-light flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-tn-yellow rounded-full animate-spin" />
      </div>
    );
  }

  const inp = 'w-full bg-white border border-tn-border rounded-xl px-4 py-3 text-sm text-tn-text placeholder-tn-subtle focus:outline-none focus:border-tn-yellow';

  return (
    <HostEntryShell slug={slug} title="Moi Entry" activeTab="entries" onBack={() => router.push(`/events/${slug}/entries`)} sidebarOverride="closed">
      <EventContextCard event={event} icon="calendar" detailsHref={`/events/${slug}/dashboard`} />
      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

      <p className="text-xs font-semibold text-tn-text mb-2">Entry Type</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { id: 'collection' as EntryType, label: 'Moi Collection', sub: 'Record amount contributed' },
          { id: 'advance' as EntryType, label: 'Advance / Top-up', sub: 'Record advance amount' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setEntryType(t.id)}
            className={`p-3 rounded-xl border-2 text-left ${entryType === t.id ? 'border-tn-yellow bg-tn-yellow-light' : 'border-tn-border bg-white'}`}
          >
            <div className={`w-4 h-4 rounded-full border-2 mb-2 ${entryType === t.id ? 'border-tn-yellow bg-tn-yellow' : 'border-[#D1D5DB]'}`} />
            <p className="text-xs font-bold text-tn-text">{t.label}</p>
            <p className="text-[10px] text-tn-muted">{t.sub}</p>
          </button>
        ))}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-tn-text">Contributor Name <span className="text-red-500">*</span></label>
          <button type="button" className="text-[10px] font-semibold text-tn-yellow">Add from Contacts</button>
        </div>
        <input required value={form.guest_name} onChange={(e) => update('guest_name', e.target.value)} className={inp} placeholder="Enter name" />
      </div>

      <div className="mb-4">
        <label className="text-xs font-semibold text-tn-text mb-1.5 block">Phone Number</label>
        <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inp} placeholder="Enter phone number (Optional)" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-semibold text-tn-text mb-1.5 block">City</label>
          <input value={form.city} onChange={(e) => update('city', e.target.value)} className={inp} placeholder="City" />
        </div>
        <div>
          <label className="text-xs font-semibold text-tn-text mb-1.5 block">Relationship</label>
          <select value={form.relation} onChange={(e) => update('relation', e.target.value)} className={inp}>
            <option value="family">Family</option>
            <option value="friend">Friend</option>
            <option value="colleague">Colleague</option>
            <option value="relative">Relative</option>
            <option value="neighbor">Neighbor</option>
            <option value="business">Business</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-semibold text-tn-text mb-1.5 block">Company</label>
          <input value={form.company} onChange={(e) => update('company', e.target.value)} className={inp} placeholder="Company (Optional)" />
        </div>
        <div>
          <label className="text-xs font-semibold text-tn-text mb-1.5 block">Occupation</label>
          <input value={form.occupation} onChange={(e) => update('occupation', e.target.value)} className={inp} placeholder="Occupation (Optional)" />
        </div>
      </div>

      <div className="mb-4">
         <label className="text-xs font-semibold text-tn-text mb-1.5 block">Amount (₹) <span className="text-red-500">*</span></label>
         <div className="flex gap-2 mb-2 flex-wrap">
           {PRESETS.map((a) => (
             <button key={a} type="button" onClick={() => update('amount', String(a))} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${form.amount === String(a) ? 'bg-tn-yellow text-white border-tn-yellow' : 'border-tn-border text-tn-muted'}`}>
               ₹{a.toLocaleString('en-IN')}
             </button>
           ))}
           <button type="button" onClick={() => update('amount', '')} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-tn-border text-tn-muted">Other</button>
         </div>
         <input required type="number" value={form.amount} onChange={(e) => update('amount', e.target.value)} className={inp} placeholder="Enter amount" />
       </div>

       <div className="mb-4">
         <label className="text-xs font-semibold text-tn-text mb-1.5 block">Payment Mode</label>
         <div className="grid grid-cols-3 gap-2">
           {[
             { id: 'cash', label: 'Cash', icon: 'wallet' as IconName },
             { id: 'upi', label: 'UPI', icon: 'wallet' as IconName },
             { id: 'card', label: 'Card', icon: 'wallet' as IconName },
             { id: 'cheque', label: 'Cheque', icon: 'list' as IconName },
             { id: 'gold', label: 'Gold', icon: 'sparkle' as IconName },
             { id: 'silver', label: 'Silver', icon: 'sparkle' as IconName },
             { id: 'gift', label: 'Gift', icon: 'gift' as IconName },
             { id: 'other', label: 'Other', icon: 'list' as IconName },
           ].map((m) => (
             <button
               key={m.id}
               type="button"
               onClick={() => {
                 if (m.id === 'gold' || m.id === 'silver' || m.id === 'gift') {
                   // Redirect to gift-entry for Gold/Silver/Gift
                   router.push(`/events/${slug}/gift-entry`);
                 } else {
                   setForm((f) => ({ ...f, payment_mode: m.id as MoiEntry['payment_mode'] }));
                 }
               }}
               className={`py-3 rounded-xl text-center border-2 transition-colors ${form.payment_mode === m.id ? 'border-tn-yellow bg-tn-yellow-light text-tn-gold' : 'border-tn-border text-tn-muted hover:border-tn-yellow'}`}
             >
                <span className="block text-lg text-tn-gold"><Icon name={m.icon} size={24} /></span>
                <span className="text-[10px] font-semibold">{m.label}</span>
             </button>
           ))}
         </div>
       </div>

       {/* UPI Ref ID - shown when UPI is selected */}
       {form.payment_mode === 'upi' && (
         <div className="mb-4">
           <label className="text-xs font-semibold text-tn-text mb-1.5 block">UPI Ref ID</label>
           <input value={form.upi_ref_id || ''} onChange={(e) => update('upi_ref_id', e.target.value)} className={inp} placeholder="Enter UPI reference ID" />
         </div>
       )}

       {/* Other Payment Details - shown when Other is selected */}
       {form.payment_mode === 'other' && (
         <div className="mb-4">
           <label className="text-xs font-semibold text-tn-text mb-1.5 block">Payment Details</label>
           <input value={form.other_payment_details || ''} onChange={(e) => update('other_payment_details', e.target.value)} className={inp} placeholder="Enter payment details" />
         </div>
       )}

      <div className="mb-4">
        <label className="text-xs font-semibold text-tn-text mb-1.5 block">Remarks (Optional)</label>
        <textarea rows={3} maxLength={100} value={form.note} onChange={(e) => update('note', e.target.value)} className={`${inp} resize-none`} placeholder="Add a note (Optional)" />
        <p className="text-[10px] text-tn-subtle text-right mt-1">{form.note.length}/100</p>
      </div>

      <div className="flex items-center justify-between bg-tn-light border border-tn-border rounded-xl px-4 py-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-tn-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {entryTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, {entryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <button type="button" className="text-[10px] font-semibold text-tn-yellow">Change</button>
      </div>

      <div className="bg-tn-yellow-light border border-tn-yellow-text rounded-xl p-3 mb-6 flex gap-2">
        <span className="text-tn-yellow font-bold">i</span>
        <p className="text-[11px] text-tn-yellow">This entry will be recorded under this function. You can view all entries in the dashboard.</p>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="flex-1 h-12 border-2 border-tn-yellow text-tn-yellow rounded-xl font-semibold text-sm">Cancel</button>
        <button type="button" onClick={handleSubmit} disabled={saving || !form.guest_name || !form.amount} className="flex-1 h-12 bg-tn-yellow text-white rounded-xl font-semibold text-sm disabled:opacity-40">
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
      </div>
    </HostEntryShell>
  );
}
