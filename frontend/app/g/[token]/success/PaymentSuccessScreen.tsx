'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { useSlug } from '@/lib/useSlug';
import { useTranslation } from '@/lib/i18n';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const token = useSlug(1);

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

  const nextSteps = [t('receiptEmail'), t('hostNotified'), t('moiRecorded')];

  return (
    <div className="min-h-screen bg-tn-light px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="w-20 h-20 bg-tn-green-bg rounded-full flex items-center justify-center border-4 border-tn-success">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-tn-success"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-tn-text mb-1">{t('paymentSuccessful')}</h1>
        <p className="text-sm text-tn-muted mb-4">{t('paymentThanks')}</p>

        <div className="inline-flex items-center gap-2 bg-tn-green-bg border border-tn-success/30 rounded-full px-4 py-2 mb-6 text-xs font-semibold text-tn-success">
          <span>✓</span> {t('txnId')}: {transactionId}
          <button type="button" onClick={handleCopyTxn} className="text-tn-yellow ml-1">{t('copyLink')}</button>
        </div>

        <div className="bg-white border border-tn-border rounded-2xl p-4 mb-4 text-left">
          <h3 className="text-sm font-bold text-tn-text mb-3">{t('paymentSummary')}</h3>
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-tn-border">
              <div className="w-10 h-10 bg-tn-yellow/10 rounded-xl flex items-center justify-center text-tn-yellow">
                <Icon name="gift" size={20} />
              </div>
              <div className="flex-1">
              <p className="text-sm font-semibold text-tn-text">{t('moiGift')}</p>
              <p className="text-[10px] text-tn-muted">{t('from')}: {guestData?.guest_name || 'Guest'}</p>
              <p className="text-[10px] text-tn-muted capitalize">{t('giftTypeLabel')}: {guestData?.gift_type || 'cash'}</p>
            </div>
            <button type="button" onClick={() => router.push(`/g/${token}/receipt`)} className="text-[10px] font-semibold text-tn-yellow">{t('viewReceipt')} &gt;</button>
          </div>
          <div className="space-y-1 text-sm text-tn-muted">
            <div className="flex justify-between"><span>{t('giftAmount')}</span><span>₹ {amount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>{t('convenienceFee')}</span><span>₹ {fee.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-tn-yellow pt-2 border-t border-dashed"><span>{t('totalAmount')}</span><span>₹ {total.toFixed(2)}</span></div>
          </div>
          <div className="mt-3 bg-tn-yellow/10 rounded-lg p-2 text-[10px] text-tn-text flex gap-2">
            <Icon name="shield" size={14} /> {t('securePaymentsNote')}
          </div>
        </div>

        <div className="bg-white border border-tn-border rounded-2xl overflow-hidden mb-6 text-left">
          <p className="text-xs font-bold text-tn-text px-4 pt-4 pb-2">{t('whatsNext')}</p>
          {nextSteps.map((text) => (
            <div key={text} className="flex items-center justify-between px-4 py-3 border-t border-tn-border text-xs text-tn-muted">
              <span>{text}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-tn-subtle"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button type="button" onClick={() => router.push('/')} className="w-full h-12 bg-tn-yellow text-white rounded-xl font-semibold text-sm">{t('backToHome')}</button>
          <button type="button" onClick={() => router.push(`/g/${token}/receipt`)} className="w-full h-12 border-2 border-tn-yellow text-tn-yellow rounded-xl font-semibold text-sm">{t('downloadReceipt')}</button>
        </div>
      </div>
    </div>
  );
}
