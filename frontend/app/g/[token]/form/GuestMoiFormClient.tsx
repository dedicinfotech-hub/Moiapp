'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi, Event } from '@/lib/api';
import GuestFlowHeader from '@/components/guest/GuestFlowHeader';
import Icon, { IconName } from '@/components/ui/Icon';
import { useSlug } from '@/lib/useSlug';

type GiftType = 'cash' | 'gold' | 'silver' | 'gift';

export default function GuestMoiFormScreen() {
  const router = useRouter();
  const token = useSlug(1); // /g/[token]/form → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    guest_name: '',
    phone: '',
    email: '',
    city: '',
    relation: 'friend',
    company: '',
    occupation: '',
    gift_type: 'cash' as GiftType,
    amount: '',
    note: '',
  });

  useEffect(() => {
    if (!token) return;
    eventsApi.getByGuestToken(token).then((data) => {
      if (data.approval_status !== 'approved' || data.qr_enabled !== 1) router.push(`/g/${token}/expired`);
      else setEvent(data);
    }).catch(() => router.push(`/g/${token}/expired`)).finally(() => setLoading(false));
  }, [token, router]);

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSubmitting(true);
    setError('');
    try {
      sessionStorage.setItem(`guest_contribution_${token}`, JSON.stringify({ ...form, event_title: event.custom_title || event.event_type }));
      router.push(`/g/${token}/payment`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !event) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" /></div>;
  }

  const title = event.custom_title || event.event_type;
  const inp = 'w-full bg-white border border-tn-border rounded-xl px-4 py-3 text-sm text-tn-text placeholder-tn-muted focus:outline-none focus:border-tn-yellow';

  return (
    <div className="min-h-screen bg-tn-light">
      <GuestFlowHeader title="Guest Moi Form" subtitle={title} backHref={`/g/${token}/landing`} />
      <main className="max-w-md mx-auto px-4 py-4 pb-8">
        <div className="bg-tn-light border border-tn-border rounded-xl p-3 mb-5 flex gap-2">
          <Icon name="alert" size={18} className="text-tn-yellow font-bold" />
          <p className="text-[11px] text-tn-muted">Please fill in the details below to send your Moi (Gift). All fields marked with * are mandatory.</p>
        </div>
        {error && <div className="bg-tn-error-bg text-tn-error rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs font-bold text-tn-text">Personal Details</p>
          {[
            { key: 'guest_name', label: 'Full Name *', placeholder: 'Enter your full name', required: true },
            { key: 'phone', label: 'Mobile Number *', placeholder: 'Enter mobile number', required: true, type: 'tel' },
            { key: 'email', label: 'Email Address (Optional)', placeholder: 'Enter email' },
            { key: 'company', label: 'Organisation (Optional)', placeholder: 'Company name' },
            { key: 'occupation', label: 'Occupation (Optional)', placeholder: 'Your occupation' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-tn-text mb-1 block">{f.label}</label>
              <input required={f.required} type={f.type || 'text'} value={form[f.key as keyof typeof form]} onChange={(e) => update(f.key, e.target.value)} className={inp} placeholder={f.placeholder} />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-tn-text mb-1 block">City *</label>
            <input required value={form.city} onChange={(e) => update('city', e.target.value)} className={inp} placeholder="Select city" />
          </div>
          <div>
            <label className="text-xs font-semibold text-tn-text mb-1 block">Relationship with the Host *</label>
            <select required value={form.relation} onChange={(e) => update('relation', e.target.value)} className={inp}>
              {['family', 'friend', 'relative', 'colleague', 'neighbor', 'business', 'other'].map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          <p className="text-xs font-bold text-tn-text pt-2">Gift (Moi) Details</p>
          <p className="text-xs font-semibold text-tn-text">Select Gift Type *</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'cash' as GiftType, label: 'Cash', icon: 'wallet' as IconName },
              { id: 'gold' as GiftType, label: 'Gold', icon: 'sparkle' as IconName },
              { id: 'silver' as GiftType, label: 'Silver', icon: 'sparkle' as IconName },
              { id: 'gift' as GiftType, label: 'Others', icon: 'gift' as IconName },
            ].map((t) => (
              <button key={t.id} type="button" onClick={() => update('gift_type', t.id)} className={`p-2 rounded-xl border text-center ${form.gift_type === t.id ? 'border-tn-yellow bg-tn-yellow/10' : 'border-tn-border bg-white'}`}>
                <Icon name={t.icon} size={18} className="mx-auto block mb-1" />
                <span className="text-[10px] font-semibold">{t.label}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-tn-text mb-1 block">Gift Amount *</label>
            <input required type="number" value={form.amount} onChange={(e) => update('amount', e.target.value)} className={inp} placeholder="Enter amount" />
          </div>
          <div>
            <label className="text-xs font-semibold text-tn-text mb-1 block">Message (Optional)</label>
            <textarea rows={3} maxLength={200} value={form.note} onChange={(e) => update('note', e.target.value)} className={`${inp} resize-none`} placeholder="Your wishes..." />
            <p className="text-[10px] text-tn-muted text-right">{form.note.length}/200</p>
          </div>

          <div className="bg-tn-light rounded-xl p-3 mb-4 flex gap-2 text-[11px] text-tn-muted">
            <Icon name="lock" size={16} />
            <p>Your information is secure. We respect your privacy. Your details will only be used for this event.</p>
          </div>

          <button type="submit" disabled={submitting || !form.guest_name || !form.phone || !form.amount} className="w-full h-12 bg-tn-yellow text-white rounded-xl font-semibold text-sm disabled:opacity-40">
            {submitting ? 'Please wait…' : 'Continue to Payment'}
          </button>
        </form>
      </main>
    </div>
  );
}