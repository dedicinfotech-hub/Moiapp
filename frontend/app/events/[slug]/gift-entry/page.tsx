'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Icon, { type IconName } from '@/components/ui/Icon';
import { eventsApi, moiApi, Event } from '@/lib/api';
import HostEntryShell from '@/components/event/HostEntryShell';
import EventContextCard from '@/components/event/EventContextCard';

type GiftType = 'gift' | 'cash' | 'other' | 'gold' | 'silver';

const PRESETS = [501, 1001, 5001];

export default function GiftEntryScreen() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [receivedOn, setReceivedOn] = useState(() => new Date().toISOString().split('T')[0]);

  const [form, setForm] = useState({
    gift_type: 'gift' as GiftType,
    guest_name: '',
    phone: '',
    description: '',
    estimated_value: '',
    gold_weight: '',
    note: '',
  });

  useEffect(() => {
    eventsApi.get(slug).then(setEvent).catch(() => router.push('/dashboard')).finally(() => setLoading(false));
  }, [slug, router]);

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!event || !form.guest_name || !form.description) return;
    if ((form.gift_type === 'gold' || form.gift_type === 'silver') && !form.gold_weight) {
      setError('Weight is required for Gold/Silver entries');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const giftTypeMap: Record<GiftType, 'cash' | 'gold' | 'silver' | 'gift'> = {
        gift: 'gift',
        cash: 'cash',
        other: 'gift',
        gold: 'gold',
        silver: 'silver',
      };
      await moiApi.add({
        event_id: event.id,
        guest_name: form.guest_name,
        phone: form.phone || null,
        relation: 'other',
        gift_type: giftTypeMap[form.gift_type],
        gift_description: form.description,
        gold_weight: form.gift_type === 'gold' || form.gift_type === 'silver' ? Number(form.gold_weight) : null,
        approximate_value: form.estimated_value ? Number(form.estimated_value) : null,
        amount: form.estimated_value ? Number(form.estimated_value) : 0,
        payment_mode: 'cash',
        note: `${form.note}${receivedOn ? ` · Received ${receivedOn}` : ''}`,
        entered_by: 'host_manual',
      });
      router.push(`/events/${slug}/entries`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save gift entry');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
      </div>
    );
  }

  const inp = 'w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FFC107]';

  return (
    <HostEntryShell slug={slug} title="Gift Entry" activeTab="gift" onBack={() => router.push(`/events/${slug}/entries`)}>
      <EventContextCard event={event} icon="gift" detailsHref={`/events/${slug}/dashboard`} />
      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

      <p className="text-xs font-semibold text-[#1F2937] mb-2">Gift Type <span className="text-red-500">*</span></p>
       <div className="grid grid-cols-3 gap-2 mb-5">
         {[
           { id: 'gift' as GiftType, label: 'Physical Gift', sub: 'Items / Products', icon: 'gift' as IconName },
           { id: 'cash' as GiftType, label: 'Envelope / Cash Gift', sub: 'Cash in envelope', icon: 'wallet' as IconName },
           { id: 'other' as GiftType, label: 'Voucher / Gift Card', sub: 'Vouchers or cards', icon: 'wallet' as IconName },
           { id: 'gold' as GiftType, label: 'Gold', sub: 'Gold items', icon: 'sparkle' as IconName },
           { id: 'silver' as GiftType, label: 'Silver', sub: 'Silver items', icon: 'sparkle' as IconName },
         ].map((t) => (
           <button key={t.id} type="button" onClick={() => update('gift_type', t.id)} className={`p-2.5 rounded-xl border-2 text-center ${form.gift_type === t.id ? 'border-[#FFC107] bg-[#F5F3FF]' : 'border-[#E5E7EB] bg-white'}`}>
             <span className="text-lg block mb-1 text-[#FFC107]"><Icon name={t.icon} size={24} /></span>
              <p className="text-[10px] font-bold text-[#1F2937] leading-tight">{t.label}</p>
             <p className="text-[9px] text-[#6B7280]">{t.sub}</p>
           </button>
         ))}
       </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[#1F2937]">Contributor Name <span className="text-red-500">*</span></label>
          <button type="button" className="text-[10px] font-semibold text-[#FFC107]">Add from Contacts</button>
        </div>
        <input required value={form.guest_name} onChange={(e) => update('guest_name', e.target.value)} className={inp} placeholder="Enter contributor name" />
      </div>

      <div className="mb-4">
        <label className="text-xs font-semibold text-[#1F2937] mb-1.5 block">Phone Number (Optional)</label>
        <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inp} placeholder="Enter phone number" />
      </div>

      <div className="mb-4">
        <label className="text-xs font-semibold text-[#1F2937] mb-1.5 block">Gift Description / Item <span className="text-red-500">*</span></label>
        <textarea rows={2} maxLength={100} value={form.description} onChange={(e) => update('description', e.target.value)} className={`${inp} resize-none`} placeholder="e.g., Mixer Grinder, Dining Set, Gold Necklace" />
        <p className="text-[10px] text-[#9CA3AF] text-right mt-1">{form.description.length}/100</p>
      </div>

      {(form.gift_type === 'gold' || form.gift_type === 'silver') && (
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#1F2937] mb-1.5 block">
            Weight (g) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.gold_weight}
            onChange={(e) => update('gold_weight', e.target.value)}
            className={inp}
            placeholder="Enter weight in grams"
          />
        </div>
      )}

      <div className="mb-4">
        <label className="text-xs font-semibold text-tn-text mb-1.5 block">Estimated Value (₹) <span className="text-tn-subtle font-normal">(optional)</span></label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {PRESETS.map((a) => (
            <button key={a} type="button" onClick={() => update('estimated_value', String(a))} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${form.estimated_value === String(a) ? 'bg-tn-yellow text-white border-tn-yellow' : 'border-tn-border text-tn-muted'}`}>
              ₹{a.toLocaleString('en-IN')}
            </button>
          ))}
          <button type="button" onClick={() => update('estimated_value', '')} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-tn-border text-tn-muted">Other</button>
        </div>
        <input type="number" value={form.estimated_value} onChange={(e) => update('estimated_value', e.target.value)} className={inp} placeholder="Enter estimated value (optional)" />
      </div>

      <div className="mb-4">
        <label className="text-xs font-semibold text-[#1F2937] mb-1.5 block">Received On <span className="text-red-500">*</span></label>
        <input type="date" value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} className={inp} />
      </div>

      <div className="mb-4">
        <label className="text-xs font-semibold text-[#1F2937] mb-1.5 block">Remarks (Optional)</label>
        <textarea rows={2} maxLength={100} value={form.note} onChange={(e) => update('note', e.target.value)} className={`${inp} resize-none`} placeholder="Add any remarks" />
        <p className="text-[10px] text-[#9CA3AF] text-right mt-1">{form.note.length}/100</p>
      </div>

      <div className="bg-[#F5F3FF] border border-[#EDE9FE] rounded-xl p-3 mb-6 flex gap-2">
        <span className="text-[#FFC107] font-bold">i</span>
        <p className="text-[11px] text-[#FFC107]">This gift entry will be recorded under this function. You can view all entries in the dashboard.</p>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="flex-1 h-12 border-2 border-[#FFC107] text-[#FFC107] rounded-xl font-semibold text-sm">Cancel</button>
        <button type="button" onClick={handleSubmit} disabled={saving || !form.guest_name || !form.description} className="flex-1 h-12 bg-[#FFC107] text-white rounded-xl font-semibold text-sm disabled:opacity-40">
          {saving ? 'Saving…' : 'Save Gift Entry'}
        </button>
      </div>
    </HostEntryShell>
  );
}
