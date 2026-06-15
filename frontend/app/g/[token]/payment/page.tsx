'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventsApi, moiApi, Event } from '@/lib/api';
import GuestFlowHeader from '@/components/guest/GuestFlowHeader';
import Icon from '@/components/ui/Icon';

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'scan';

export default function PaymentMethodScreen() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [guestData, setGuestData] = useState<Record<string, string>>({});

  useEffect(() => {
    eventsApi.getByGuestToken(token).then((data) => {
      if (data.approval_status !== 'approved' || data.qr_enabled !== 1) router.push(`/g/${token}/expired`);
      else setEvent(data);
    }).catch(() => router.push(`/g/${token}/expired`)).finally(() => setLoading(false));

    const stored = sessionStorage.getItem(`guest_contribution_${token}`);
    if (stored) {
      try { setGuestData(JSON.parse(stored)); } catch { router.push(`/g/${token}/form`); }
    } else {
      router.push(`/g/${token}/form`);
    }
  }, [token, router]);

  const amount = Number(guestData.amount || 0);
  const fee = Math.round(amount * 0.0018) || 9;
  const total = amount + fee;

  const handlePay = async () => {
    if (!event || !guestData.guest_name) return;
    setProcessing(true);
    setError('');

    const paymentModeMap: Record<PaymentMethod, 'upi' | 'card' | 'cash' | 'other'> = {
      upi: 'upi', card: 'card', netbanking: 'other', wallet: 'upi', scan: 'upi',
    };

    const giftType = (guestData.gift_type || 'cash') as 'cash' | 'gold' | 'silver' | 'gift';

    try {
      await moiApi.add({
        guest_token: token,
        guest_name: guestData.guest_name.trim(),
        city: guestData.city?.trim() || undefined,
        company: guestData.company?.trim() || undefined,
        occupation: guestData.occupation?.trim() || undefined,
        gift_type: giftType === 'silver' ? 'gift' : giftType,
        amount,
        relation: (guestData.relation || 'friend') as 'family' | 'friend' | 'colleague' | 'relative' | 'neighbor' | 'business' | 'other',
        payment_mode: paymentModeMap[selectedMethod],
        note: [guestData.note, `Paid via ${selectedMethod}`].filter(Boolean).join(' · '),
      });

      const txnId = `TXN${Date.now()}`;
      sessionStorage.setItem(`guest_contribution_${token}`, JSON.stringify({
        ...guestData,
        payment_method: selectedMethod,
        transaction_id: txnId,
        fee,
        total,
      }));
      sessionStorage.setItem(`guest_submitted_${token}`, 'true');
      router.push(`/g/${token}/success`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !event) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-200 border-t-[#7C3AED] rounded-full animate-spin" /></div>;
  }

  const title = event.custom_title || event.event_type;
  const methods = [
    { id: 'upi' as PaymentMethod, label: 'UPI', sub: 'Google Pay, PhonePe, Paytm', badge: 'Instant' },
    { id: 'card' as PaymentMethod, label: 'Debit / Credit Card', sub: 'Visa, Mastercard, RuPay', badge: 'Instant' },
    { id: 'netbanking' as PaymentMethod, label: 'Net Banking', sub: 'All major banks', badge: 'Instant' },
    { id: 'wallet' as PaymentMethod, label: 'Wallets', sub: 'Paytm, Amazon Pay', badge: 'Instant' },
    { id: 'scan' as PaymentMethod, label: 'Scan & Pay', sub: 'QR based payment', badge: 'Instant' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <GuestFlowHeader title="Payment" subtitle={title} backHref={`/g/${token}/form`} badge="Secure Payment" />
      <main className="max-w-md mx-auto px-4 py-4 pb-8">
        {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-[#F5F3FF] rounded-xl flex items-center justify-center text-[#7C3AED]">
                <Icon name="gift" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1F2937]">Moi (Gift)</p>
                <p className="text-[10px] text-[#6B7280]">From: {guestData.guest_name || 'Guest'}</p>
                <p className="text-[10px] text-[#6B7280] capitalize">Gift Type: {guestData.gift_type || 'cash'}</p>
              </div>
            </div>
            <button type="button" onClick={() => router.push(`/g/${token}/form`)} className="text-[10px] font-semibold text-[#7C3AED]">Edit Details</button>
          </div>
          <p className="text-2xl font-bold text-[#4B218B] text-center">₹ {amount.toLocaleString('en-IN')}</p>
        </div>

        <p className="text-xs font-bold text-[#1F2937] mb-3">Select Payment Method</p>
        <div className="space-y-2 mb-4">
          {methods.map((m) => (
            <button key={m.id} type="button" onClick={() => setSelectedMethod(m.id)} className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left ${selectedMethod === m.id ? 'border-[#7C3AED] bg-[#F5F3FF]' : 'border-[#E5E7EB] bg-white'}`}>
              <div className={`w-4 h-4 rounded-full border-2 ${selectedMethod === m.id ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-[#D1D5DB]'}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1F2937]">{m.label}</p>
                <p className="text-[10px] text-[#6B7280]">{m.sub}</p>
              </div>
              <span className="text-[9px] font-bold text-[#22C55E] bg-[#F0FFF4] px-2 py-0.5 rounded-full">{m.badge}</span>
            </button>
          ))}
        </div>

        <div className="bg-[#F5F3FF] rounded-xl p-3 mb-4 flex gap-2 text-[11px] text-[#4B218B]">
          <Icon name="shield" size={16} />
          <p>100% Secure Payments. Your payment details are encrypted and safe with us.</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between text-[#6B7280]"><span>Gift Amount</span><span>₹ {amount.toFixed(2)}</span></div>
          <div className="flex justify-between text-[#6B7280]"><span>Convenience Fee</span><span>₹ {fee.toFixed(2)}</span></div>
          <div className="border-t border-dashed border-[#E5E7EB] pt-2 flex justify-between font-bold text-[#4B218B]"><span>Total Amount</span><span>₹ {total.toFixed(2)}</span></div>
        </div>

        <div className="bg-[#F0FFF4] border border-[#BBF7D0] rounded-xl p-3 mb-5 text-[11px] text-[#166534]">
          Thank you for your contribution! Your generosity makes this celebration even more special.
        </div>

        <button type="button" onClick={handlePay} disabled={processing || amount <= 0} className="w-full h-12 bg-[#4B218B] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          <Icon name="lock" size={16} /> {processing ? 'Processing…' : `Pay ₹ ${total.toFixed(2)}`}
        </button>
        <p className="text-center text-[10px] text-[#9CA3AF] mt-3">Secured by Razorpay</p>
      </main>
    </div>
  );
}
