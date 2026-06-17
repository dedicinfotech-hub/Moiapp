'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventsApi, Event } from '@/lib/api';
import Icon, { IconName } from '@/components/ui/Icon';

export default function ContributionReceiptScreen() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestData, setGuestData] = useState<{
    guest_name?: string;
    amount?: string;
    gift_type?: string;
    transaction_id?: string;
  } | null>(null);

  useEffect(() => {
    eventsApi.getByGuestToken(token).then(setEvent).catch(() => setEvent(null)).finally(() => setLoading(false));
    const stored = sessionStorage.getItem(`guest_contribution_${token}`);
    if (stored) {
      try { setGuestData(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [token]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-200 border-t-[#7C3AED] rounded-full animate-spin" /></div>;
  }

  const guestName = guestData?.guest_name || 'Guest';
  const amount = Number(guestData?.amount || 0);
  const giftType = guestData?.gift_type || 'cash';
  const transactionId = guestData?.transaction_id || `TXN${Date.now()}`;
  const hostNames = event?.custom_title || (event?.bride_name && event?.groom_name ? `${event.bride_name} & ${event.groom_name}` : 'The Host');

  return (
    <div className="min-h-screen bg-[#FFFBF5] px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6 relative">
          <div className="w-16 h-16 bg-[#F0FFF4] rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-[#22C55E]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Thank You!</h1>
          <p className="text-sm text-[#6B7280] mt-2">Dear {guestName},</p>
          <p className="text-sm text-[#6B7280]">Thank you for your thoughtful contribution towards our special occasion.</p>
          <p className="text-sm font-bold text-[#22C55E] mt-2">Your Moi has been received successfully.</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="gift" size={18} className="text-[#7C3AED]" />
            <h3 className="text-sm font-bold text-[#4B218B]">Contribution Details</h3>
          </div>
          {[
            { icon: 'users' as IconName, label: 'Name', value: guestName },
            { icon: 'gift' as IconName, label: 'Gift Type', value: giftType.charAt(0).toUpperCase() + giftType.slice(1) },
            { icon: 'wallet' as IconName, label: 'Amount', value: `₹ ${amount.toLocaleString('en-IN')}`, highlight: true },
            { icon: 'list' as IconName, label: 'Transaction ID', value: transactionId },
            { icon: 'calendar' as IconName, label: 'Date & Time', value: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
              <div className="flex items-center gap-2 text-xs text-[#6B7280]"><Icon name={row.icon} size={14} />{row.label}</div>
              <span className={`text-xs font-semibold ${row.highlight ? 'text-[#4B218B]' : 'text-[#1F2937]'}`}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#F5F3FF] border border-[#EDE9FE] rounded-2xl p-5 mb-6 relative">
          <span className="text-4xl text-[#7C3AED] opacity-30 absolute top-2 left-4">&ldquo;</span>
          <p className="text-sm font-bold text-[#4B218B] mb-2">A Message from the Host</p>
          <p className="text-sm text-[#6B7280] italic pl-2">Your blessings and support mean a lot to us. Thank you for being part of our celebration.</p>
          <p className="text-xs text-[#6B7280] text-right mt-3 font-semibold">— {hostNames}</p>
        </div>

        <div className="space-y-3">
          <button type="button" onClick={() => window.print()} className="w-full h-12 bg-[#4B218B] text-white rounded-xl font-semibold text-sm">Download Receipt</button>
          <button type="button" onClick={() => navigator.share?.({ title: 'Moi Contribution', text: `I contributed ₹${amount} to ${hostNames}` })} className="w-full h-12 border-2 border-[#7C3AED] text-[#7C3AED] rounded-xl font-semibold text-sm">Share Confirmation</button>
          <button type="button" onClick={() => router.push('/')} className="w-full h-12 border-2 border-[#7C3AED] text-[#7C3AED] rounded-xl font-semibold text-sm">Back to Home</button>
        </div>

        <p className="text-center text-xs text-[#9CA3AF] mt-6">We look forward to celebrating with you!</p>
      </div>
    </div>
  );
}