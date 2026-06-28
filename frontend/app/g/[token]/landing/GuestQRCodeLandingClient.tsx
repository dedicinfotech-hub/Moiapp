'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { eventsApi, Event } from '@/lib/api';
import Icon, { IconName } from '@/components/ui/Icon';
import { useSlug } from '@/lib/useSlug';

export default function GuestQRCodeLandingScreen() {
  const token = useSlug(1); // /g/[token]/landing → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (!token) return;
    setOrigin(window.location.origin);
    eventsApi.getByGuestToken(token).then((data) => {
      if (data.approval_status !== 'approved' || data.qr_enabled !== 1) setNotFound(true);
      else setEvent(data);
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [token]);

  const paymentLink = `${origin}/g/${token}/form`;
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentLink)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" /></div>;
  if (notFound || !event) return <div className="min-h-screen flex items-center justify-center px-6 text-center text-tn-muted">Event not found or link expired</div>;

  const title = event.custom_title || (event.bride_name && event.groom_name ? `${event.bride_name} & ${event.groom_name}` : event.event_type);
  const dateStr = event.wedding_date ? new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' }) : '—';

  return (
    <div className="min-h-screen bg-tn-yellow-bg relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-tn-yellow/10 to-transparent pointer-events-none" />
      <div className="max-w-md mx-auto px-5 py-8 relative z-10">
        <h1 className="text-2xl font-bold text-tn-text text-center font-serif mb-1">{title}</h1>
        <div className="flex flex-wrap justify-center gap-3 text-[10px] text-tn-muted mb-6">
          <span className="inline-flex items-center gap-1"><Icon name="calendar" size={12} /> {dateStr}</span>
          <span>|</span>
          <span className="inline-flex items-center gap-1"><Icon name="map" size={12} /> {event.venue || event.city}</span>
          <span>|</span>
          <span className="inline-flex items-center gap-1 capitalize"><Icon name="users" size={12} /> {event.event_type}</span>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-tn-border p-6 mb-6 text-center">
          <div className="w-12 h-12 bg-tn-yellow/10 rounded-full flex items-center justify-center mx-auto mb-3 text-xl text-tn-yellow">
            <Icon name="gift" size={24} />
          </div>
          <h2 className="text-lg font-bold text-tn-text mb-1">Scan to Send Your Moi</h2>
          <p className="text-xs text-tn-muted mb-4">Scan this QR code to open the guest form and contribute your moi online.</p>
          <img src={qrDataUrl} alt="QR Code" className="w-44 h-44 mx-auto mb-4" />
          <p className="text-xs text-tn-subtle mb-2">— OR —</p>
          <p className="text-xs text-tn-muted mb-2">Open the link in your browser</p>
          <div className="bg-tn-yellow/10 rounded-xl p-3 flex items-center gap-2">
            <span className="text-tn-yellow text-xs truncate flex-1 font-semibold">{paymentLink}</span>
            <button onClick={handleCopy} className="text-tn-yellow text-xs font-bold shrink-0">{copied ? <Icon name="check" size={12} /> : 'Copy'}</button>
          </div>
          <p className="text-[10px] text-tn-subtle mt-3">This link is unique to this function.</p>
          <Link href={`/g/${token}/form`} className="mt-4 block w-full py-3 bg-tn-yellow text-white rounded-xl font-semibold text-sm">Continue to Form</Link>
        </div>

        <h3 className="text-sm font-bold text-tn-text text-center mb-4">— How it Works —</h3>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { icon: 'list' as IconName, label: 'Fill Guest Form', sub: 'Enter your details' },
            { icon: 'wallet' as IconName, label: 'Make Payment', sub: 'Choose amount' },
            { icon: 'check' as IconName, label: 'Payment Success', sub: 'Recorded successfully' },
            { icon: 'gift' as IconName, label: 'Thank You', sub: 'Receive confirmation' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-lg mb-1 text-tn-yellow"><Icon name={s.icon} size={18} /></div>
              <p className="text-[9px] font-bold text-tn-text">{s.label}</p>
              <p className="text-[8px] text-tn-subtle">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-tn-warning/10 border border-tn-warning/30 rounded-2xl p-4 flex gap-2 text-[10px]">
          <div className="flex-1 flex gap-2"><Icon name="shield" size={14} className="mt-0.5" /><p><span className="font-bold text-tn-text">100% Secure & Trusted</span><span className="block text-tn-muted">Your information and payments are safe.</span></p></div>
          <div className="flex-1 flex gap-2"><Icon name="lock" size={14} className="mt-0.5" /><p><span className="font-bold text-tn-text">Encrypted Payments</span><span className="block text-tn-muted">SSL Secured.</span></p></div>
        </div>
        <p className="text-center text-[10px] text-tn-subtle mt-6">Need Help? Contact the host or event organizer.</p>
      </div>
    </div>
  );
}