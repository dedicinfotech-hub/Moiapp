'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { eventsApi, moiApi, Event } from '@/lib/api';
import { getEventDisplayName } from '@/lib/eventHelpers';
import Icon, { IconName } from '@/components/ui/Icon';

function useToken(): string {
  const [token, setToken] = useState('');
  useEffect(() => {
    let path = window.location.pathname.split('?')[0].split('#')[0];
    path = path.replace(/\/(index\.html?)$/i, '').replace(/\/$/, '');
    const parts = path.split('/');
    const t = parts[parts.length - 1];
    setToken(t === '_' ? '' : t);
  }, []);
  return token;
}

type GiftMethod = 'gpay' | 'phonepe' | 'cash' | 'gold' | 'silver' | 'gift';

export default function GuestPaymentClient() {
  const token = useToken();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorType, setErrorType] = useState<'private' | 'closed' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [upiReference, setUpiReference] = useState('');
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'gpay' | 'phonepe' | 'upi' | null>(null);

  const [form, setForm] = useState({
    guest_name: '',
    city: '',
    relation: 'friend',
    company: '',
    occupation: '',
    method: 'gpay' as GiftMethod,
    amount: '',
    gold_weight: '',
    item_name: '',
    gift_description: '',
    note: '',
  });

  useEffect(() => {
    if (!token) return;
    eventsApi.getByGuestToken(token)
      .then((ev) => {
        if (ev.approval_status !== 'approved' || ev.qr_enabled !== 1) {
          setErrorType('closed');
          setNotFound(true);
          return;
        }
        setEvent(ev);
      })
      .catch((err) => {
        const msg = (err as Error)?.message || '';
        if (msg.includes('private_event')) {
          setErrorType('private');
        } else if (msg.includes('event_closed')) {
          setErrorType('closed');
        } else {
          setErrorType('private');
        }
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const inp = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-tn-text placeholder-tn-subtle focus:outline-none focus:border-tn-yellow bg-white';

  const openUpiLink = (app: 'gpay' | 'phonepe' | 'upi') => {
    if (!event || !form.amount) return;
    const amount = parseFloat(form.amount);
    if (amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    const hostName = event.creator_name || event.custom_title || event.event_type;
    const upiId = event.upi_id || '';
    if (!upiId) {
      setError('Host has not added a UPI ID. Please use Razorpay or contact the host.');
      return;
    }
    const note = encodeURIComponent(`Moi contribution for ${hostName}`);
    let url: string;
    if (app === 'gpay') {
      url = `gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(hostName)}&am=${amount.toFixed(2)}&cu=INR&tn=${note}`;
    } else if (app === 'phonepe') {
      url = `phonepe://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(hostName)}&am=${amount.toFixed(2)}&cu=INR&tn=${note}`;
    } else {
      url = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(hostName)}&am=${amount.toFixed(2)}&cu=INR&tn=${note}`;
    }
    setPaymentMethod(app);
    setAwaitingPayment(true);
    setUpiReference('');
    setError('');
    window.open(url, '_blank');
  };

  const handleUpiConfirm = async () => {
    if (!event || !token) return;
    if (!upiReference.trim()) {
      setError('Please enter the UPI reference / transaction ID');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const amount = parseFloat(form.amount || '0');
      let gift_type: 'cash' | 'gold' | 'silver' | 'gift' = 'cash';
      let gold_weight: number | null = null;
      let gift_description: string | null = null;

      if (form.method === 'gold') {
        gift_type = 'gold';
        gold_weight = form.gold_weight.trim() ? parseFloat(form.gold_weight) : null;
        gift_description = form.item_name.trim() || 'Gold gift';
      } else if (form.method === 'silver') {
        gift_type = 'gift';
        gold_weight = form.gold_weight.trim() ? parseFloat(form.gold_weight) : null;
        gift_description = form.item_name.trim() ? `Silver: ${form.item_name.trim()}` : 'Silver gift';
      } else if (form.method === 'gift') {
        gift_type = 'gift';
        gift_description = form.item_name.trim() || 'Gift';
      }

      const noteParts = [form.note.trim(), `${paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'phonepe' ? 'PhonePe' : 'UPI'}: ${upiReference.trim()}`].filter(Boolean).join(' · ');
      await moiApi.add({
        guest_token: token,
        guest_name: form.guest_name.trim(),
        city: form.city.trim() || undefined,
        company: form.company.trim() || undefined,
        occupation: form.occupation.trim() || undefined,
        gift_type,
        amount: amount > 0 ? amount : undefined,
        gold_weight,
        gift_description,
        relation: form.relation as 'family' | 'friend' | 'colleague' | 'relative' | 'neighbor' | 'business' | 'other',
        payment_mode: 'upi',
        upi_ref_id: upiReference.trim(),
        other_payment_details: event.upi_id,
        note: noteParts,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save your moi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!event || !token) return;

    if (!form.guest_name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!form.city.trim()) {
      setError('Please enter your city');
      return;
    }

    let gift_type: 'cash' | 'gold' | 'silver' | 'gift' = 'cash';
    let amount = 0;
    let gold_weight: number | null = null;
    let gift_description: string | null = null;
    let payment_mode: 'cash' | 'upi' | 'card' | 'cheque' = 'cash';

    if (form.method === 'gpay' || form.method === 'phonepe') {
      openUpiLink(form.method);
      return;
    } else if (form.method === 'cash') {
      gift_type = 'cash';
      amount = parseFloat(form.amount || '0');
      if (amount <= 0) { setError('Amount is required'); return; }
      payment_mode = 'cash';
    } else if (form.method === 'gold') {
      gift_type = 'gold';
      gold_weight = form.gold_weight.trim() ? parseFloat(form.gold_weight) : null;
      gift_description = form.item_name.trim() || 'Gold gift';
    } else if (form.method === 'silver') {
      gift_type = 'gift';
      gold_weight = form.gold_weight.trim() ? parseFloat(form.gold_weight) : null;
      gift_description = form.item_name.trim() ? `Silver: ${form.item_name.trim()}` : 'Silver gift';
    } else {
      gift_type = 'gift';
      gift_description = form.item_name.trim() || 'Gift';
    }

    setError('');
    setSubmitting(true);
    try {
      const noteParts = [form.note.trim()];
      await moiApi.add({
        guest_token: token,
        guest_name: form.guest_name.trim(),
        city: form.city.trim() || undefined,
        company: form.company.trim() || undefined,
        occupation: form.occupation.trim() || undefined,
        gift_type,
        amount: amount > 0 ? amount : undefined,
        gold_weight,
        gift_description,
        relation: form.relation as 'family' | 'friend' | 'colleague' | 'relative' | 'neighbor' | 'business' | 'other',
        payment_mode,
        note: noteParts.filter(Boolean).join(' · '),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save your moi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tn-light">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-tn-yellow rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tn-light px-6 text-center">
        <div>
          <Icon name="lock" size={48} className="mb-3 text-tn-yellow" />
          {errorType === 'private' ? (
            <>
              <h1 className="text-lg font-bold text-tn-text">Private Event</h1>
              <p className="text-sm text-tn-muted mt-2">This is a private event. You need an invitation to access this page.</p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-bold text-tn-text">This event is no longer accepting moi</h1>
              <p className="text-sm text-tn-muted mt-2">Please contact the host.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tn-light px-6 text-center">
        <div className="max-w-sm">
          <Icon name="check" size={48} className="mb-3 text-tn-yellow" />
          <h1 className="text-xl font-bold text-tn-text">Your moi has been recorded. Thank you!</h1>
          <p className="text-sm text-tn-muted mt-2">உங்கள் மொய் பதிவு செய்யப்பட்டது. நன்றி!</p>
          <p className="text-xs text-tn-subtle mt-4">{getEventDisplayName(event)}</p>
        </div>
      </div>
    );
  }

  const giftMethods: { id: GiftMethod; label: string; icon: IconName }[] = [
    { id: 'cash', label: 'Cash', icon: 'wallet' },
    { id: 'gold', label: 'Gold', icon: 'sparkle' },
    { id: 'silver', label: 'Silver', icon: 'sparkle' },
    { id: 'gift', label: 'Gift', icon: 'gift' },
  ];

  const upiMethods = [
    { id: 'gpay' as const, label: 'GPay', icon: 'wallet' as IconName },
    { id: 'phonepe' as const, label: 'PhonePe', icon: 'wallet' as IconName },
    { id: 'upi' as const, label: 'Any UPI App', icon: 'wallet' as IconName },
  ];

  const razorpayMethods = [
    { id: 'card' as const, label: 'Debit / Credit Card', icon: 'credit-card' as IconName },
    { id: 'netbanking' as const, label: 'Net Banking', icon: 'building' as IconName },
    { id: 'wallet' as const, label: 'Wallets', icon: 'wallet' as IconName },
  ];

  const needsAmount = form.method === 'cash';
  const needsItemName = ['gold', 'silver', 'gift'].includes(form.method);
  const needsWeight = ['gold', 'silver'].includes(form.method);
  const needsGiftDesc = form.method === 'silver' || form.method === 'gift';

  const hostFirstName = (event.creator_name || '').split(' ')[0];
  const eventCity = event.city || '';

  return (
    <div className="min-h-screen bg-tn-light">
      <div className="bg-tn-yellow px-4 py-5 text-center">
        <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">MoiApp</p>
        <h1 className="text-lg font-bold text-white mt-1">{getEventDisplayName(event)}</h1>
        <p className="text-xs text-white/90 mt-0.5">Host: {hostFirstName}</p>
        {eventCity && <p className="text-[10px] text-white/70 mt-0.5">{eventCity}</p>}
        <p className="text-[10px] text-white/70 mt-1">No app download required</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-10">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

        <div>
          <label className="block text-xs font-semibold text-tn-muted mb-1">Your Name <span className="text-red-500">*</span></label>
          <input required className={inp} value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder="Enter your full name" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1">City <span className="text-red-500">*</span></label>
            <input required className={inp} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Enter your city" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1">Relationship</label>
            <select className={inp} value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
              <option value="family">Family</option>
              <option value="friend">Friend</option>
              <option value="relative">Relative</option>
              <option value="colleague">Colleague</option>
              <option value="neighbor">Neighbor</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1">Company</label>
            <input className={inp} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Optional" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1">Occupation</label>
            <input className={inp} value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="Optional" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-tn-muted mb-2">Gift Type</label>
          <div className="grid grid-cols-4 gap-2">
            {giftMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setForm({ ...form, method: m.id }); setAwaitingPayment(false); setPaymentMethod(null); }}
                className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  form.method === m.id ? 'border-tn-yellow bg-tn-yellow-light' : 'border-tn-border bg-white'
                }`}
              >
                <Icon name={m.icon} size={18} className="mx-auto mb-0.5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-tn-muted mb-2">Pay Online via</label>
          <div className="grid grid-cols-3 gap-2">
            {upiMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => openUpiLink(m.id)}
                className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  paymentMethod === m.id ? 'border-tn-yellow bg-tn-yellow-light' : 'border-tn-border bg-white'
                }`}
              >
                <Icon name={m.icon} size={18} className="mx-auto mb-0.5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-tn-muted mb-2">More Payment Options</label>
          <div className="grid grid-cols-3 gap-2">
            {razorpayMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => router.push(`/g/${token}/payment`)}
                className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  form.method === m.id ? 'border-tn-yellow bg-tn-yellow-light' : 'border-tn-border bg-white'
                }`}
              >
                <Icon name={m.icon} size={18} className="mx-auto mb-0.5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {needsAmount && (
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1">Amount (₹) <span className="text-tn-yellow">*</span></label>
            <input type="number" min="1" className={inp} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 1001" />
          </div>
        )}

        {needsItemName && (
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1">Item Name <span className="text-red-500">*</span></label>
            <input required className={inp} value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder={form.method === 'gold' ? 'e.g. Gold chain, Ring' : form.method === 'silver' ? 'e.g. Silver plate, Coin' : 'e.g. Watch, Bag'} />
          </div>
        )}

        {needsWeight && (
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1">{form.method === 'gold' ? 'Gold weight (grams)' : 'Silver weight (grams)'} <span className="text-tn-subtle">(Optional)</span></label>
            <input type="number" step="0.01" min="0" className={inp} value={form.gold_weight} onChange={(e) => setForm({ ...form, gold_weight: e.target.value })} placeholder="e.g. 10" />
          </div>
        )}

        {needsGiftDesc && (
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1">Additional details</label>
            <input className={inp} value={form.gift_description} onChange={(e) => setForm({ ...form, gift_description: e.target.value })} placeholder="Optional" />
          </div>
        )}

        {awaitingPayment && paymentMethod && (
          <div className="bg-[#F5F3FF] border border-[#EDE9FE] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#4B218B] mb-2">
              {paymentMethod === 'gpay' ? 'GPay' : paymentMethod === 'phonepe' ? 'PhonePe' : 'UPI'} payment link opened. Complete the payment in your app, then enter the UPI reference below.
            </p>
            <label className="block text-xs font-semibold text-tn-muted mb-1">UPI Reference / Transaction ID <span className="text-red-500">*</span></label>
            <input
              required
              className={inp}
              value={upiReference}
              onChange={(e) => setUpiReference(e.target.value)}
              placeholder="e.g. 409123456789"
            />
            <button
              type="button"
              onClick={handleUpiConfirm}
              disabled={submitting}
              className="w-full mt-3 h-12 bg-[#4B218B] text-white rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Confirm Payment'}
            </button>
          </div>
        )}

        {!awaitingPayment && (
          <>
            <div>
              <label className="block text-xs font-semibold text-tn-muted mb-1">Note</label>
              <input className={inp} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" />
            </div>

            <button
              type="submit"
              disabled={submitting || submitted}
              className="w-full bg-tn-yellow text-white font-bold py-3.5 rounded-xl hover:bg-tn-yellow-2 disabled:opacity-50 transition-colors"
            >
              {submitted ? 'Submitted ✓' : submitting ? 'Saving…' : 'Submit Moi'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
