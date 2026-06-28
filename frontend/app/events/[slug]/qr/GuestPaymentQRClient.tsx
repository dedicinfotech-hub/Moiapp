'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi, Event } from '@/lib/api';
import { CreateFlowHeader } from '@/components/event/EventLayout';
import { useSlug } from '@/lib/useSlug';

export default function GuestPaymentQRScreen() {
  const router = useRouter();
  const slug = useSlug(1); // /events/[slug]/qr → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (!slug) return;
    setOrigin(window.location.origin);
    eventsApi.get(slug).then(setEvent).catch(() => router.push('/dashboard')).finally(() => setLoading(false));
  }, [slug, router]);

  const paymentLink = event?.guest_token ? `${origin}/g/${event.guest_token}/form` : '';
  const qrDataUrl = paymentLink ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(paymentLink)}` : '';

  const handleCopy = async () => {
    if (!paymentLink) return;
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!paymentLink || !navigator.share) return handleCopy();
    try {
      await navigator.share({ title: event?.custom_title || 'Moi', url: paymentLink });
    } catch { /* ignore */ }
  };

  if (loading || !event) {
    return <div className="min-h-screen bg-tn-light flex items-center justify-center"><div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" /></div>;
  }

  const dateStr = event.wedding_date ? new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' }) : '—';

  return (
    <div className="min-h-screen bg-tn-light">
      <CreateFlowHeader title="QR Code for Guest Payment" onBack={() => router.push(`/events/${slug}/dashboard`)} />
      <main className="max-w-lg mx-auto px-4 py-4 pb-8">
        <p className="text-xs text-tn-muted text-center mb-4">Generate QR code and share with your guests to receive Moi.</p>

        <div className="bg-white border border-tn-border rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex justify-end mb-2">
            <button type="button" onClick={() => router.push(`/events/${slug}/dashboard`)} className="text-[10px] font-semibold text-tn-yellow border border-tn-yellow px-3 py-1 rounded-lg">Edit Event</button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-[9px] text-tn-muted uppercase">Date</p><p className="text-xs font-semibold text-tn-text mt-1">{dateStr}</p></div>
            <div><p className="text-[9px] text-tn-muted uppercase">Location</p><p className="text-xs font-semibold text-tn-text mt-1">{event.venue || event.city || '—'}</p></div>
            <div><p className="text-[9px] text-tn-muted uppercase">Event</p><p className="text-xs font-semibold text-tn-text mt-1 capitalize">{event.event_type}</p></div>
          </div>
        </div>

        <div className="bg-white border border-tn-border rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-bold text-tn-text mb-3">Your Guest Payment Page Link</h3>
          <div className="flex gap-2">
            <input readOnly value={paymentLink} className="flex-1 bg-tn-light border border-tn-border rounded-xl px-3 py-2.5 text-[10px] text-tn-muted" />
            <button onClick={handleCopy} className="px-4 py-2.5 bg-tn-yellow text-white rounded-xl text-xs font-semibold">{copied ? 'Copied!' : 'Copy Link'}</button>
          </div>
        </div>

        <div className="bg-white border border-tn-border rounded-2xl p-5 mb-4">
          <h3 className="text-sm font-bold text-tn-text mb-4">Your Payment QR Code</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-48 h-48 bg-white border border-tn-border rounded-2xl flex items-center justify-center shrink-0">
              {qrDataUrl ? <img src={qrDataUrl} alt="QR" className="w-40 h-40" /> : <span className="text-xs text-tn-subtle">Unavailable</span>}
            </div>
            <div className="flex-1 w-full space-y-2">
              <button onClick={() => { const a = document.createElement('a'); a.href = qrDataUrl; a.download = 'qr.png'; a.click(); }} className="w-full py-2.5 bg-tn-yellow text-white rounded-xl text-xs font-semibold">Download QR</button>
              <button onClick={handleShare} className="w-full py-2.5 border border-tn-border rounded-xl text-xs font-semibold text-tn-muted">Share QR</button>
              <button onClick={() => window.print()} className="w-full py-2.5 border border-tn-border rounded-xl text-xs font-semibold text-tn-muted">Print QR</button>
            </div>
          </div>
          <div className="mt-4 bg-tn-green-bg border border-tn-success/30 rounded-xl p-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-tn-success rounded-full" />
            <p className="text-xs font-semibold text-tn-success">This QR code links to your guest payment page.</p>
          </div>
        </div>

        <div className="bg-white border border-tn-border rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-bold text-tn-text text-center mb-4">How it works for your guests</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            {['Scan QR', 'Fill Details', 'Make Payment', 'Thank You'].map((step, i) => (
              <div key={step}>
                <div className="w-8 h-8 rounded-full bg-tn-warning/20 text-tn-yellow text-xs font-bold flex items-center justify-center mx-auto mb-1">{i + 1}</div>
                <p className="text-[9px] font-semibold text-tn-text">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-tn-border rounded-2xl p-4">
          <h3 className="text-sm font-bold text-tn-text mb-3">Share QR with your guests</h3>
          <div className="grid grid-cols-2 gap-2">
            {['WhatsApp Share', 'Email Share', 'Download Poster', 'Print QR Standee'].map((label) => (
              <button key={label} type="button" onClick={handleShare} className="py-3 border border-tn-border rounded-xl text-xs font-semibold text-tn-muted hover:bg-tn-light">{label}</button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {['Facebook', 'Instagram', 'Customize QR', 'More'].map((label) => (
              <button key={label} type="button" onClick={handleShare} className="py-2 border border-tn-border rounded-xl text-[10px] font-semibold text-tn-muted hover:bg-tn-light">{label}</button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
