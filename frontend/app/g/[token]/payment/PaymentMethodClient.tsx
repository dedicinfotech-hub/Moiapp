'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi, moiApi, Event, paymentApi, RazorpayPaymentMethod } from '@/lib/api';
import GuestFlowHeader from '@/components/guest/GuestFlowHeader';
import Icon from '@/components/ui/Icon';
import { useSlug } from '@/lib/useSlug';
import { useTranslation } from '@/lib/i18n';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

type GuestData = {
  guest_name?: string;
  phone?: string;
  email?: string;
  city?: string;
  company?: string;
  occupation?: string;
  relation?: string;
  gift_type?: string;
  amount?: string;
  note?: string;
  event_title?: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
    reason?: string;
    source?: string;
    step?: string;
    code?: string;
  };
};

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector<HTMLScriptElement>('#razorpay-checkout-js');
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Razorpay checkout script failed to load.')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) resolve();
      else reject(new Error('Razorpay checkout script failed to initialize.'));
    };
    script.onerror = () => reject(new Error('Razorpay checkout script failed to load.'));
    document.body.appendChild(script);
  });
}

export default function PaymentMethodScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const token = useSlug(1); // /g/[token]/payment → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<RazorpayPaymentMethod>('upi');
  const [scanRef, setScanRef] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const paymentCompletedRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    eventsApi.getByGuestToken(token)
      .then((data) => {
        if (data.approval_status !== 'approved' || data.qr_enabled !== 1) router.push(`/g/${token}/expired`);
        else setEvent(data);
      })
      .catch(() => router.push(`/g/${token}/expired`))
      .finally(() => setLoading(false));

    const stored = sessionStorage.getItem(`guest_contribution_${token}`);
    if (stored) {
      try {
        setGuestData(JSON.parse(stored) as GuestData);
      } catch {
        router.push(`/g/${token}/form`);
      }
    } else {
      router.push(`/g/${token}/form`);
    }
  }, [token, router]);

  const amount = Number(guestData?.amount || 0);
  const fee = Math.round(amount * 0.0018) || 9;
  const total = amount + fee;
  const isCashContribution = (guestData?.gift_type || 'cash') === 'cash';

  const handlePay = async () => {
    if (!event || !token || !guestData?.guest_name) return;
    if (!isCashContribution) {
      setError('Payments are available for cash contributions only. Please edit the gift type or contact the host.');
      return;
    }
    if (amount <= 0) {
      setError('Contribution amount is required.');
      return;
    }

    if (selectedMethod === 'scan') {
      if (!event.upi_id) {
        setError('Host has not added a UPI ID for Scan & Pay. Please use Razorpay or contact the host.');
        return;
      }
      if (!scanRef.trim()) {
        setError('Enter the UPI reference / transaction ID shown after payment.');
        return;
      }

      setProcessing(true);
      setError('');
      try {
        const refId = scanRef.trim();
        const note = [guestData.note?.trim(), `Scan & Pay UPI: ${event.upi_id}`, `UPI Ref: ${refId}`].filter(Boolean).join(' · ');
        await moiApi.add({
          guest_token: token,
          guest_name: guestData.guest_name.trim(),
          city: guestData.city?.trim() || undefined,
          company: guestData.company?.trim() || undefined,
          occupation: guestData.occupation?.trim() || undefined,
          gift_type: (guestData.gift_type || 'cash') as 'cash' | 'gold' | 'silver' | 'gift',
          amount,
          relation: (guestData.relation || 'friend') as 'family' | 'friend' | 'colleague' | 'relative' | 'neighbor' | 'business' | 'other',
          payment_mode: 'upi',
          upi_ref_id: refId,
          other_payment_details: event.upi_id,
          note,
        });

        const transactionId = `SCAN${Date.now()}`;
        sessionStorage.setItem(`guest_contribution_${token}`, JSON.stringify({
          ...guestData,
          payment_method: 'scan',
          transaction_id: transactionId,
          payment_id: transactionId,
          fee,
          total,
          payment_status: 'paid',
          gift_type: guestData.gift_type || 'cash',
        }));
        sessionStorage.setItem(`guest_submitted_${token}`, 'true');
        router.push(`/g/${token}/receipt`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Scan & Pay confirmation failed. Please try again.');
      } finally {
        setProcessing(false);
      }
      return;
    }

    setProcessing(true);
    setError('');
    paymentCompletedRef.current = false;

    try {
      await loadRazorpayScript();
      const order = await paymentApi.createOrder({
        guest_token: token,
        payment_method: selectedMethod,
        guest_data: {
          guest_name: guestData.guest_name.trim(),
          phone: guestData.phone?.trim(),
          email: guestData.email?.trim(),
          city: guestData.city?.trim(),
          company: guestData.company?.trim(),
          occupation: guestData.occupation?.trim(),
          relation: (guestData.relation || 'friend') as 'family' | 'friend' | 'colleague' | 'relative' | 'neighbor' | 'business' | 'other',
          gift_type: (guestData.gift_type || 'cash') as 'cash' | 'gold' | 'silver' | 'gift',
          amount: amount.toFixed(2),
          note: guestData.note?.trim(),
        },
      });

      const RazorpayCtor = window.Razorpay;
      if (!RazorpayCtor) {
        throw new Error('Razorpay checkout failed to load.');
      }

      const razorpay = new RazorpayCtor({
        key: order.razorpay_key_id,
        amount: order.order.amount,
        currency: order.order.currency,
        name: 'Moi PassBook',
        description: `Moi contribution for ${order.event_title}`,
        order_id: order.order.id,
        handler: handleRazorpaySuccess,
        prefill: {
          name: order.guest_name,
          email: order.email || '',
          contact: order.phone || '',
        },
        theme: {
           color: '#FFC107',
         },
        modal: {
          ondismiss: () => {
            if (!paymentCompletedRef.current) {
              setProcessing(false);
              setError('Payment was not completed. Please try again or contact the host.');
            }
          },
        },
      });

      razorpay.on('payment.failed', (response: unknown) => {
        setProcessing(false);
        const typedResponse = response as RazorpayFailureResponse;
        const message = typedResponse.error?.description || 'Payment failed. Please try again.';
        setError(message);
      });

      razorpay.on('payment.success', () => {
        paymentCompletedRef.current = true;
      });

      razorpay.on('checkout.closed', () => {
        if (!paymentCompletedRef.current) {
          setProcessing(false);
        }
      });

      razorpay.open();
    } catch (err: unknown) {
      paymentCompletedRef.current = false;
      setProcessing(false);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    }
  };

  const handleRazorpaySuccess = async (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    if (!token || !guestData) return;

    paymentCompletedRef.current = true;

    try {
      const result = await paymentApi.verifyPayment({
        guest_token: token,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        payment_method: selectedMethod,
      });

      sessionStorage.setItem(`guest_contribution_${token}`, JSON.stringify({
        ...guestData,
        payment_method: selectedMethod,
        transaction_id: result.transaction_id,
        payment_id: result.payment_id,
        razorpay_order_id: result.order_id,
        local_order_id: result.id,
        fee,
        total,
        payment_status: 'paid',
        gift_type: guestData.gift_type || 'cash',
      }));
      sessionStorage.setItem(`guest_submitted_${token}`, 'true');
      router.push(`/g/${token}/receipt`);
    } catch (err: unknown) {
      paymentCompletedRef.current = false;
      setError(err instanceof Error ? err.message : 'Payment verification failed. Please contact the host.');
      setProcessing(false);
    }
  };

  if (loading || !event || !guestData) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" /></div>;
  }

  const title = event.custom_title || event.event_type;
  const hostUpiId = event.upi_id?.trim() || '';
  const hostName = event.creator_name || event.custom_title || event.event_type;
  const upiUrl = hostUpiId ? `upi://pay?pa=${encodeURIComponent(hostUpiId)}&pn=${encodeURIComponent(hostName)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Moi contribution for ' + hostName)}` : '';
  const scanQrUrl = upiUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}` : '';
  const copyUpiId = async () => {
    if (!hostUpiId) return;
    await navigator.clipboard.writeText(hostUpiId);
    setError('UPI ID copied. Complete the payment in your UPI app, then enter the UPI reference.');
  };
  const methods = [
    { id: 'upi' as RazorpayPaymentMethod, label: 'UPI', sub: 'Google Pay, PhonePe, Paytm', badge: 'Instant' },
    { id: 'card' as RazorpayPaymentMethod, label: 'Debit / Credit Card', sub: 'Visa, Mastercard, RuPay', badge: 'Instant' },
    { id: 'netbanking' as RazorpayPaymentMethod, label: 'Net Banking', sub: 'All major banks', badge: 'Instant' },
    { id: 'wallet' as RazorpayPaymentMethod, label: 'Wallets', sub: 'Paytm, Amazon Pay', badge: 'Instant' },
    { id: 'scan' as RazorpayPaymentMethod, label: 'Scan & Pay', sub: 'QR based payment', badge: 'Instant' },
  ];

  return (
    <div className="min-h-screen bg-tn-light">
      <GuestFlowHeader title={t('paymentTitle')} subtitle={title} backHref={`/g/${token}/form`} badge={t('secure')} />
      <main className="max-w-md mx-auto px-4 py-4 pb-8">
        {error && <div className="bg-tn-error-bg text-tn-error rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        <div className="bg-white border border-tn-border rounded-2xl p-4 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-tn-yellow/10 rounded-xl flex items-center justify-center text-tn-yellow">
                <Icon name="gift" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-tn-text">{t('moiGift')}</p>
                <p className="text-[10px] text-tn-muted">{t('from')}: {guestData.guest_name || 'Guest'}</p>
                <p className="text-[10px] text-tn-muted capitalize">{t('giftTypeLabel')}: {guestData.gift_type || 'cash'}</p>
              </div>
            </div>
            <button type="button" onClick={() => router.push(`/g/${token}/form`)} className="text-[10px] font-semibold text-tn-yellow">Edit Details</button>
          </div>
          <p className="text-2xl font-bold text-tn-yellow text-center">₹ {amount.toLocaleString('en-IN')}</p>
        </div>

        <p className="text-xs font-bold text-tn-text mb-3">{t('selectPaymentMethod')}</p>
        <div className="space-y-2 mb-4">
          {methods.map((m) => (
            <button key={m.id} type="button" onClick={() => setSelectedMethod(m.id)} className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left ${selectedMethod === m.id ? 'border-tn-yellow bg-tn-yellow/10' : 'border-tn-border bg-white'}`}>
              <div className={`w-4 h-4 rounded-full border-2 ${selectedMethod === m.id ? 'border-tn-yellow bg-tn-yellow' : 'border-tn-border'}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-tn-text">{m.label}</p>
                <p className="text-[10px] text-tn-muted">{m.sub}</p>
              </div>
              <span className="text-[9px] font-bold text-tn-success bg-tn-green-bg px-2 py-0.5 rounded-full">{m.badge}</span>
            </button>
          ))}
        </div>

        {selectedMethod === 'scan' && (
          <div className="bg-white border border-tn-border rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-tn-green-bg flex items-center justify-center text-tn-success">
                <Icon name="qr-code" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-tn-text">Scan & Pay with UPI</p>
                <p className="text-[10px] text-tn-muted">Pay directly to the host UPI ID</p>
              </div>
            </div>
            {hostUpiId ? (
              <>
                <div className="bg-white border border-tn-border rounded-xl p-3 mb-3 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={scanQrUrl} alt="Scan and pay UPI QR code" className="w-[220px] h-[220px] rounded-lg" />
                </div>
                <div className="bg-tn-light border border-tn-border rounded-xl p-3 mb-3 break-all text-sm">
                  <p className="text-[10px] text-tn-muted mb-1">Host UPI ID</p>
                  <p className="font-semibold text-tn-text">{hostUpiId}</p>
                </div>
                <button type="button" onClick={copyUpiId} className="w-full h-10 rounded-xl border border-tn-yellow text-tn-yellow font-semibold text-sm mb-3">
                  Copy UPI ID
                </button>
                <label className="block text-[10px] font-semibold text-tn-text mb-1">UPI Reference / Transaction ID</label>
                <input value={scanRef} onChange={(e) => setScanRef(e.target.value)} className="w-full border border-tn-border rounded-xl px-3 py-2.5 text-sm text-tn-text focus:outline-none focus:border-tn-yellow mb-3" placeholder="e.g. 409123456789" />
                <p className="text-[11px] text-tn-muted leading-relaxed">
                  Scan this QR, pay <strong>₹ {total.toFixed(2)}</strong>, then enter the UPI reference ID shown in your UPI app. The host will verify this reference.
                </p>
              </>
            ) : (
              <div className="bg-tn-warning/10 border border-tn-warning/30 rounded-xl p-3 text-[11px] text-tn-warning leading-relaxed">
                Host has not added a UPI ID in Settings yet. Please use Razorpay or contact the host.
              </div>
            )}
          </div>
        )}

        <div className="bg-tn-yellow/10 rounded-xl p-3 mb-4 flex gap-2 text-[11px] text-tn-text">
          <Icon name="shield" size={16} />
          <p>{t('securePaymentsNote')}</p>
        </div>

        <div className="bg-white border border-tn-border rounded-2xl p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between text-tn-muted"><span>{t('giftAmount')}</span><span>₹ {amount.toFixed(2)}</span></div>
          <div className="flex justify-between text-tn-muted"><span>{t('convenienceFee')}</span><span>₹ {fee.toFixed(2)}</span></div>
          <div className="border-t border-dashed border-tn-border pt-2 flex justify-between font-bold text-tn-yellow"><span>{t('totalAmount')}</span><span>₹ {total.toFixed(2)}</span></div>
        </div>

        <div className="bg-tn-green-bg border border-tn-success/30 rounded-xl p-3 mb-5 text-[11px] text-tn-success/80">
          {t('paymentThanks')}
        </div>

        <button type="button" onClick={handlePay} disabled={processing || amount <= 0 || !isCashContribution || (selectedMethod === 'scan' && (!hostUpiId || !scanRef.trim()))} className="w-full h-12 bg-tn-yellow text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          <Icon name="lock" size={16} /> {processing ? t('pleaseWait') : selectedMethod === 'scan' ? `${t('payNow')} ₹ ${total.toFixed(2)}` : `${t('payNow')} ₹ ${total.toFixed(2)}`}
        </button>
        <p className="text-center text-[10px] text-tn-subtle mt-3">{selectedMethod === 'scan' ? 'Direct UPI payment to host' : 'Secured by Razorpay'}</p>
      </main>
    </div>
  );
}
