'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { useSlug } from '@/lib/useSlug';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const token = useSlug(1); // /g/[token]/success → skip 1 segment

  const [guestData, setGuestData] = useState<{
    guest_name?: string;
    amount?: string;
    gift_type?: string;
    payment_method?: string;
    transaction_id?: string;
    fee?: number;
    total?: number;
  } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`guest_contribution_${token}`);
    if (stored) {
      try { setGuestData(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [token]);

  const amount = Number(guestData?.amount || 0);
  const fee = guestData?.fee ?? 9;
  const total = guestData?.total ?? amount + fee;
  const transactionId = guestData?.transaction_id || `TXN${Date.now()}`;

  const handleCopyTxn = async () => {
    await navigator.clipboard.writeText(transactionId);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="w-20 h-20 bg-[#F0FFF4] rounded-full flex items-center justify-center border-4 border-[#22C55E]">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">Payment Successful!</h1>
        <p className="text-sm text-[#6B7280] mb-4">Thank you for your contribution. Your Moi (Gift) has been sent successfully.</p>

        <div className="inline-flex items-center gap-2 bg-[#F0FFF4] border border-[#BBF7D0] rounded-full px-4 py-2 mb-6 text-xs font-semibold text-[#22C55E]">
          <span>✓</span> Transaction ID: {transactionId}
          <button type="button" onClick={handleCopyTxn} className="text-[#7C3AED] ml-1">Copy</button>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4 text-left">
          <h3 className="text-sm font-bold text-[#1F2937] mb-3">Payment Summary</h3>
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#F3F4F6]">
              <div className="w-10 h-10 bg-[#F5F3FF] rounded-xl flex items-center justify-center text-[#7C3AED]">
                <Icon name="gift" size={20} />
              </div>
              <div className="flex-1">
              <p className="text-sm font-semibold">Moi (Gift)</p>
              <p className="text-[10px] text-[#6B7280]">From: {guestData?.guest_name || 'Guest'}</p>
              <p className="text-[10px] text-[#6B7280] capitalize">Gift Type: {guestData?.gift_type || 'cash'}</p>
            </div>
            <button type="button" onClick={() => router.push(`/g/${token}/receipt`)} className="text-[10px] font-semibold text-[#7C3AED]">View Details &gt;</button>
          </div>
          <div className="space-y-1 text-sm text-[#6B7280]">
            <div className="flex justify-between"><span>Gift Amount</span><span>₹ {amount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Convenience Fee</span><span>₹ {fee.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-[#4B218B] pt-2 border-t border-dashed"><span>Total Amount</span><span>₹ {total.toFixed(2)}</span></div>
          </div>
          <div className="mt-3 bg-[#F5F3FF] rounded-lg p-2 text-[10px] text-[#4B218B] flex gap-2">
            <Icon name="shield" size={14} /> 100% Secure Payments. Your payment details are encrypted and safe with us.
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden mb-6 text-left">
          <p className="text-xs font-bold text-[#1F2937] px-4 pt-4 pb-2">What&apos;s Next?</p>
          {[
            'We have sent the payment receipt to your email.',
            'The host will be notified about your contribution.',
            'You can view your contribution in My Contributions.',
          ].map((text) => (
            <div key={text} className="flex items-center justify-between px-4 py-3 border-t border-[#F3F4F6] text-xs text-[#6B7280]">
              <span>{text}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button type="button" onClick={() => router.push('/')} className="w-full h-12 bg-[#4B218B] text-white rounded-xl font-semibold text-sm">Back to Home</button>
          <button type="button" onClick={() => router.push(`/g/${token}/receipt`)} className="w-full h-12 border-2 border-[#7C3AED] text-[#7C3AED] rounded-xl font-semibold text-sm">Download Receipt</button>
        </div>
      </div>
    </div>
  );
}
