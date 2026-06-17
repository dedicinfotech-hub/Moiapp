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
    return <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" /></div>;
  }

  const dateStr = event.wedding_date ? new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' }) : '—';

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <CreateFlowHeader title="QR Code for Guest Payment" onBack={() => router.push(`/events/${slug}/dashboard`)} />
      <main className="max-w-lg mx-auto px-4 py-4 pb-8">
        <p className="text-xs text-[#6B7280] text-center mb-4">Generate QR code and share with your guests to receive Moi.</p>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex justify-end mb-2">
            <button type="button" onClick={() => router.push(`/events/${slug}/dashboard`)} className="text-[10px] font-semibold text-[#FFC107] border border-[#FFC107] px-3 py-1 rounded-lg">Edit Event</button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-[9px] text-[#6B7280] uppercase">Date</p><p className="text-xs font-semibold text-[#1F2937] mt-1">{dateStr}</p></div>
            <div><p className="text-[9px] text-[#6B7280] uppercase">Location</p><p className="text-xs font-semibold text-[#1F2937] mt-1">{event.venue || event.city || '—'}</p></div>
            <div><p className="text-[9px] text-[#6B7280] uppercase">Event</p><p className="text-xs font-semibold text-[#1F2937] mt-1 capitalize">{event.event_type}</p></div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-bold text-[#1F2937] mb-3">Your Guest Payment Page Link</h3>
          <div className="flex gap-2">
            <input readOnly value={paymentLink} className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[10px] text-[#6B7280]" />
            <button onClick={handleCopy} className="px-4 py-2.5 bg-[#FFC107] text-white rounded-xl text-xs font-semibold">{copied ? 'Copied!' : 'Copy Link'}</button>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-4">
          <h3 className="text-sm font-bold text-[#1F2937] mb-4">Your Payment QR Code</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-48 h-48 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-center shrink-0">
              {qrDataUrl ? <img src={qrDataUrl} alt="QR" className="w-40 h-40" /> : <span className="text-xs text-[#9CA3AF]">Unavailable</span>}
            </div>
            <div className="flex-1 w-full space-y-2">
              <button onClick={() => { const a = document.createElement('a'); a.href = qrDataUrl; a.download = 'qr.png'; a.click(); }} className="w-full py-2.5 bg-[#FFC107] text-white rounded-xl text-xs font-semibold">Download QR</button>
              <button onClick={handleShare} className="w-full py-2.5 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#6B7280]">Share QR</button>
              <button onClick={() => window.print()} className="w-full py-2.5 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#6B7280]">Print QR</button>
            </div>
          </div>
          <div className="mt-4 bg-[#F0FFF4] border border-[#BBF7D0] rounded-xl p-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#22C55E] rounded-full" />
            <p className="text-xs font-semibold text-[#22C55E]">This QR code links to your guest payment page.</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-bold text-[#1F2937] text-center mb-4">How it works for your guests</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            {['Scan QR', 'Fill Details', 'Make Payment', 'Thank You'].map((step, i) => (
              <div key={step}>
                <div className="w-8 h-8 rounded-full bg-[#FFF7ED] text-[#FFC107] text-xs font-bold flex items-center justify-center mx-auto mb-1">{i + 1}</div>
                <p className="text-[9px] font-semibold text-[#1F2937]">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
          <h3 className="text-sm font-bold text-[#1F2937] mb-3">Share QR with your guests</h3>
          <div className="grid grid-cols-2 gap-2">
            {['WhatsApp Share', 'Email Share', 'Download Poster', 'Print QR Standee'].map((label) => (
              <button key={label} type="button" onClick={handleShare} className="py-3 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#6B7280] hover:bg-[#F9FAFB]">{label}</button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {['Facebook', 'Instagram', 'Customize QR', 'More'].map((label) => (
              <button key={label} type="button" onClick={handleShare} className="py-2 border border-[#E5E7EB] rounded-xl text-[10px] font-semibold text-[#6B7280] hover:bg-[#F9FAFB]">{label}</button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
