'use client';

import { useEffect, useState } from 'react';
import { eventsApi, moiApi, Event } from '@/lib/api';
import { getEventDisplayName } from '@/lib/eventHelpers';

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

  const [form, setForm] = useState({
    guest_name: '',
    city: '',
    relation: 'friend',
    company: '',
    occupation: '',
    method: 'gpay' as GiftMethod,
    amount: '',
    gold_weight: '',
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

  const inp = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-[#101010] placeholder-[#999] focus:outline-none focus:border-[#FFC107] bg-white';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !token) return;

    let gift_type: 'cash' | 'gold' | 'gift' = 'cash';
    let amount = 0;
    let gold_weight: number | null = null;
    let gift_description: string | null = null;
    let payment_mode: 'cash' | 'upi' | 'card' | 'cheque' = 'cash';

    if (form.method === 'gpay' || form.method === 'phonepe') {
      gift_type = 'cash';
      amount = parseFloat(form.amount || '0');
      if (amount <= 0) { setError('Amount is required'); return; }
      payment_mode = 'upi';
    } else if (form.method === 'cash') {
      gift_type = 'cash';
      amount = parseFloat(form.amount || '0');
      if (amount <= 0) { setError('Amount is required'); return; }
      payment_mode = 'cash';
    } else if (form.method === 'gold') {
      gift_type = 'gold';
      gold_weight = parseFloat(form.gold_weight || '0');
      if (!gold_weight || gold_weight <= 0) { setError('Gold weight (grams) is required'); return; }
    } else if (form.method === 'silver') {
      gift_type = 'gift';
      gift_description = form.gift_description.trim() ? `Silver: ${form.gift_description.trim()}` : 'Silver gift';
    } else {
      gift_type = 'gift';
      gift_description = form.gift_description.trim() || 'Gift';
    }

    setError('');
    setSubmitting(true);
    try {
      const noteParts = [form.note.trim()];
      if (form.method === 'gpay') noteParts.unshift('GPay');
      if (form.method === 'phonepe') noteParts.unshift('PhonePe');
      await moiApi.add({
        guest_token: token,
        guest_name: form.guest_name.trim(),
        city: form.city.trim() || undefined,
        company: form.company.trim() || undefined,
        occupation: form.occupation.trim() || undefined,
        gift_type,
        amount,
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
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-6 text-center">
        <div>
          <p className="text-5xl mb-3">🔒</p>
          {errorType === 'private' ? (
            <>
              <h1 className="text-lg font-bold text-[#101010]">Private Event</h1>
              <p className="text-sm text-[#666] mt-2">This is a private event. You need an invitation to access this page.</p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-bold text-[#101010]">This event is no longer accepting moi</h1>
              <p className="text-sm text-[#666] mt-2">Please contact the host.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-6 text-center">
        <div className="max-w-sm">
          <p className="text-5xl mb-3">🙏</p>
          <h1 className="text-xl font-bold text-[#101010]">Your moi has been recorded. Thank you!</h1>
          <p className="text-sm text-[#666] mt-2">உங்கள் மொய் பதிவு செய்யப்பட்டது. நன்றி!</p>
          <p className="text-xs text-[#999] mt-4">{getEventDisplayName(event)}</p>
        </div>
      </div>
    );
  }

  const methods: { id: GiftMethod; label: string; icon: string }[] = [
    { id: 'gpay', label: 'GPay', icon: '📱' },
    { id: 'phonepe', label: 'PhonePe', icon: '📱' },
    { id: 'cash', label: 'Cash', icon: '💵' },
    { id: 'gold', label: 'Gold', icon: '✨' },
    { id: 'silver', label: 'Silver', icon: '🥈' },
    { id: 'gift', label: 'Gift', icon: '🎁' },
  ];

  const needsAmount = ['gpay', 'phonepe', 'cash'].includes(form.method);
  const needsGold = form.method === 'gold';
  const needsGiftDesc = form.method === 'silver' || form.method === 'gift';

  const hostFirstName = (event.creator_name || '').split(' ')[0];
  const eventCity = event.city || '';

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="bg-[#FFC107] px-4 py-5 text-center">
        <p className="text-xs font-semibold text-black/70 uppercase tracking-wide">MoiApp</p>
        <h1 className="text-lg font-bold text-black mt-1">{getEventDisplayName(event)}</h1>
        <p className="text-xs text-black/80 mt-0.5">Host: {hostFirstName}</p>
        {eventCity && <p className="text-[10px] text-black/60 mt-0.5">{eventCity}</p>}
        <p className="text-[10px] text-black/60 mt-1">No app download required</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-10">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1">Your Name</label>
          <input className={inp} value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder="Optional" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1">City</label>
            <input className={inp} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Optional" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1">Relationship</label>
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
            <label className="block text-xs font-semibold text-[#555] mb-1">Company</label>
            <input className={inp} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Optional" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1">Occupation</label>
            <input className={inp} value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="Optional" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#555] mb-2">Payment / Gift Type</label>
          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setForm({ ...form, method: m.id })}
                className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  form.method === m.id ? 'border-[#FFC107] bg-[#FFFCF5]' : 'border-[#E8E8E8] bg-white'
                }`}
              >
                <span className="block text-lg">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {needsAmount && (
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1">Amount (₹) <span className="text-[#FFC107]">*</span></label>
            <input type="number" min="1" className={inp} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 1001" />
          </div>
        )}

        {needsGold && (
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1">Gold weight (grams)</label>
            <input type="number" step="0.01" min="0" className={inp} value={form.gold_weight} onChange={(e) => setForm({ ...form, gold_weight: e.target.value })} />
          </div>
        )}

        {needsGiftDesc && (
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1">{form.method === 'silver' ? 'Silver details' : 'Gift description'}</label>
            <input className={inp} value={form.gift_description} onChange={(e) => setForm({ ...form, gift_description: e.target.value })} placeholder="Optional" />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1">Note</label>
          <input className={inp} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" />
        </div>

        <button
          type="submit"
          disabled={submitting || submitted}
          className="w-full bg-[#FFC107] text-black font-bold py-3.5 rounded-xl hover:bg-[#E6AC00] disabled:opacity-50 transition-colors"
        >
          {submitted ? 'Submitted ✓' : submitting ? 'Saving…' : 'Submit Moi'}
        </button>
      </form>
    </div>
  );
}
