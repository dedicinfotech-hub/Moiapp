'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon, { type IconName } from '@/components/ui/Icon';
import { eventsApi, Event } from '@/lib/api';
import HostEntryShell from '@/components/event/HostEntryShell';
import EventContextCard from '@/components/event/EventContextCard';
import { useSlug } from '@/lib/useSlug';

type PaymentMode = 'cash' | 'upi' | 'card' | 'cheque' | 'other';

const METHODS: { id: PaymentMode; label: string; desc: string; color: string; icon: IconName }[] = [
  { id: 'cash', label: 'Cash', desc: 'Received in cash', color: '#22C55E', icon: 'wallet' },
  { id: 'upi', label: 'UPI Payment', desc: 'Google Pay, PhonePe, Paytm, others', color: '#3B82F6', icon: 'wallet' },
  { id: 'other', label: 'Bank Transfer', desc: 'NEFT, RTGS, IMPS', color: '#6366F1', icon: 'list' },
  { id: 'card', label: 'Card Payment', desc: 'Debit Card / Credit Card', color: '#FFC107', icon: 'wallet' },
  { id: 'upi', label: 'Digital Wallet', desc: 'Paytm Wallet, Amazon Pay, etc.', color: '#F97316', icon: 'wallet' },
  { id: 'cheque', label: 'Cheque', desc: 'Received by cheque', color: '#14B8A6', icon: 'list' },
  { id: 'other', label: 'Other', desc: 'Any other payment method', color: '#9CA3AF', icon: 'list' },
];

export default function HostPaymentMethodScreen() {
  const router = useRouter();
  const slug = useSlug(1); // /events/[slug]/payment-method → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PaymentMode>('cash');
  const [selectedLabel, setSelectedLabel] = useState('Cash');

  useEffect(() => {
    eventsApi.get(slug).then(setEvent).catch(() => router.push('/dashboard')).finally(() => setLoading(false));
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`host_payment_mode_${slug}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSelected(parsed.mode || 'cash');
          setSelectedLabel(parsed.label || 'Cash');
        } catch { /* ignore */ }
      }
    }
  }, [slug, router]);

  const handleConfirm = () => {
    sessionStorage.setItem(`host_payment_mode_${slug}`, JSON.stringify({ mode: selected, label: selectedLabel }));
    router.push(`/events/${slug}/moi-entry`);
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <HostEntryShell slug={slug} title="Payment Method" activeTab="entries" onBack={() => router.push(`/events/${slug}/moi-entry`)} sidebarOverride="closed">
      <EventContextCard event={event} icon="gift" detailsHref={`/events/${slug}/dashboard`} />

      <h2 className="text-sm font-bold text-[#1F2937] mb-1">Select Payment Method</h2>
      <p className="text-xs text-[#6B7280] mb-4">Choose how the contributor made the payment.</p>

      <div className="space-y-2 mb-5">
        {METHODS.map((m, i) => {
          const isSelected = selectedLabel === m.label;
          return (
            <button
              key={`${m.id}-${i}`}
              type="button"
              onClick={() => { setSelected(m.id); setSelectedLabel(m.label); }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${isSelected ? 'border-[#FFC107] bg-[#F5F3FF]' : 'border-[#E5E7EB] bg-white'}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-[#FFC107]' : 'border-[#D1D5DB]'}`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-[#FFC107]" />}
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}18` }}>
                <Icon name={m.icon} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1F2937]">{m.label}</p>
                <p className="text-[11px] text-[#6B7280]">{m.desc}</p>
              </div>
              {isSelected && <span className="text-[10px] font-bold text-[#22C55E] bg-[#F0FFF4] px-2 py-0.5 rounded-full">Selected</span>}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          );
        })}
      </div>

      <div className="bg-[#F5F3FF] border border-[#EDE9FE] rounded-xl p-4 mb-6 flex gap-3">
        <div className="w-8 h-8 rounded-full bg-[#FFC107] text-white flex items-center justify-center text-sm font-bold shrink-0">i</div>
        <div>
          <p className="text-xs font-bold text-[#FFC107]">Why we collect payment method?</p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">This helps in better tracking, reporting and reconciliation.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.push(`/events/${slug}/moi-entry`)} className="flex-1 h-12 border-2 border-[#FFC107] text-[#FFC107] rounded-xl font-semibold text-sm">Cancel</button>
        <button type="button" onClick={handleConfirm} className="flex-1 h-12 bg-[#FFC107] text-white rounded-xl font-semibold text-sm">Confirm</button>
      </div>
    </HostEntryShell>
  );
}
