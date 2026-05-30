'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { eventsApi, moiApi, photosApi, Event, Photo } from '@/lib/api';

// In static export useParams() always returns the placeholder slug '_'.
// Read the real slug from the URL path instead.
function useSlug(): string {
  const [slug, setSlug] = useState('');
  useEffect(() => {
    // Path: /moiapp/e/<slug>  →  split and take last non-empty segment
    const parts = window.location.pathname.replace(/\/$/, '').split('/');
    const s = parts[parts.length - 1];
    setSlug(s === '_' ? '' : s);
  }, []);
  return slug;
}

type Step = 'event' | 'form' | 'success';
interface GuestForm {
  guest_name: string;
  amount: string;
  relation: string;
  payment_mode: string;
  note: string;
}

export default function PublicEventPage() {
  const slug = useSlug();
  const [event, setEvent]       = useState<Event | null>(null);
  const [photos, setPhotos]     = useState<Photo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep]         = useState<Step>('event');

  useEffect(() => {
    if (!slug) return;
    eventsApi.get(slug)
      .then((ev) => { setEvent(ev); return photosApi.list(ev.id); })
      .then(setPhotos)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
        <p className="text-[#666666] text-sm">Loading event…</p>
      </div>
    </div>
  );

  if (notFound || !event) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-center px-6">
      <div>
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-xl font-bold text-[#101010]">Event not found</h1>
        <p className="text-[#666666] text-sm mt-2">This link may be invalid or the event has been removed.</p>
        <Link href="/events" className="mt-4 inline-block text-[#FFC107] font-semibold underline text-sm">Browse all events</Link>
      </div>
    </div>
  );

  if (step === 'form')    return <MoiForm    event={event} onBack={() => setStep('event')} onSuccess={() => setStep('success')} />;
  if (step === 'success') return <SuccessView event={event} onBack={() => setStep('event')} />;

  return <EventDetailView event={event} photos={photos} onGiveMoi={() => setStep('form')} />;
}

// ── Event Detail View (TicketNadu layout) ─────────────────────────────────────
function EventDetailView({ event, photos, onGiveMoi }: { event: Event; photos: Photo[]; onGiveMoi: () => void }) {
  const [showMore, setShowMore]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const total      = Number(event.stats?.total || 0);
  const guestCount = Number(event.stats?.guest_count || 0);

  const weddingDate = new Date(event.wedding_date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white text-[#101010]">

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden px-4 py-3 flex justify-between items-center gap-5 border-b border-[#E8E8E8]">
        <Link href="/events" className="p-1 text-[#444444]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7.37 13.25L13.06 18.95L12 20L4.5 12.5L12 5L13.06 6.05L7.37 11.75H19.5V13.25H7.37Z" fill="#444444"/></svg>
        </Link>
        <h3 className="font-semibold text-base line-clamp-1 text-center w-full">
          {event.bride_name} &amp; {event.groom_name}
        </h3>
        <button onClick={handleCopy} className="p-1 text-[#444444]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16.8 22C16.05 22 15.41 21.74 14.89 21.21C14.37 20.69 14.11 20.06 14.11 19.31C14.11 19.21 14.14 18.96 14.21 18.58L7.1 14.39C6.86 14.64 6.57 14.84 6.24 14.98C5.91 15.12 5.55 15.19 5.18 15.19C4.43 15.19 3.8 14.93 3.28 14.4C2.75 13.88 2.49 13.24 2.49 12.5C2.49 11.76 2.75 11.12 3.28 10.6C3.8 10.07 4.43 9.81 5.18 9.81C5.55 9.81 5.91 9.88 6.24 10.02C6.57 10.16 6.86 10.36 7.1 10.61L14.21 6.43C14.17 6.31 14.15 6.19 14.13 6.07C14.12 5.95 14.11 5.83 14.11 5.69C14.11 4.94 14.37 4.31 14.89 3.79C15.42 3.26 16.05 3 16.8 3C17.55 3 18.19 3.26 18.71 3.79C19.23 4.31 19.49 4.95 19.49 5.69C19.49 6.44 19.23 7.08 18.71 7.6C18.18 8.12 17.55 8.38 16.8 8.38C16.42 8.38 16.07 8.31 15.74 8.17C15.41 8.02 15.13 7.83 14.89 7.58L7.77 11.76C7.81 11.88 7.84 12.01 7.86 12.12C7.87 12.24 7.88 12.37 7.88 12.5C7.88 12.63 7.87 12.76 7.86 12.88C7.84 12.99 7.81 13.12 7.77 13.24L14.89 17.43C15.13 17.18 15.41 16.98 15.74 16.83C16.07 16.69 16.42 16.62 16.8 16.62C17.55 16.62 18.18 16.88 18.71 17.4C19.23 17.93 19.49 18.56 19.49 19.31C19.49 20.06 19.23 20.69 18.71 21.22C18.18 21.74 17.55 22 16.8 22Z" fill="#444444"/></svg>
        </button>
      </div>

      {/* ── Banner image ── */}
      <div className="relative w-full px-4 lg:px-0 overflow-hidden pt-5 lg:pt-0 lg:flex justify-center lg:aspect-[1200/400]">
        {event.cover_photo ? (
          <>
            <Image
              src={event.cover_photo}
              alt={`${event.bride_name} & ${event.groom_name}`}
              width={1250}
              height={400}
              className="rounded-lg lg:rounded-none object-cover h-full w-auto"
            />
            <div
              className="hidden lg:block absolute w-full -z-10 inset-0"
              style={{ backgroundImage: `url(${event.cover_photo})`, backgroundSize: 'cover', backgroundPosition: 'center top', filter: 'blur(10px)' }}
            />
          </>
        ) : (
          <div className="w-full h-48 lg:h-full bg-gradient-to-br from-[#FFF8E1] to-[#FFFCF5] rounded-lg lg:rounded-none flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2">💍</div>
              <p className="text-[#B8860B] font-semibold text-sm">Wedding Event</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Main content: 6-col grid ── */}
      <section className="w-full lg:w-[80%] mx-auto lg:py-12">
        <div className="lg:grid grid-cols-6 relative gap-10 xl:gap-[72px] lg:pt-[56px]">

          {/* ── LEFT: col-span-4 ── */}
          <div className="px-4 lg:px-0 lg:col-span-4">

            {/* Category pill + title + date/venue */}
            <div className="pb-6 pt-4 lg:pt-0">
              <div className="flex items-center gap-1 border border-[#FFC107] bg-[#FFFCF5] ps-2 pe-3 py-1.5 rounded-full w-fit text-sm font-semibold text-[#FFC107] mb-3">
                <span>💍</span>
                <span>Wedding</span>
              </div>
              <h1 className="font-bold text-xl lg:text-[32px] leading-tight">
                {event.bride_name} &amp; {event.groom_name}
              </h1>
              <div className="pt-2 flex flex-col gap-2 text-[#444444] lg:flex-row lg:gap-6 lg:pt-3">
                <p className="flex gap-2 items-center font-medium text-base">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 9.26H19V6.76C19 6.68 18.97 6.61 18.9 6.55C18.84 6.48 18.77 6.45 18.69 6.45H5.31C5.23 6.45 5.16 6.48 5.1 6.55C5.03 6.61 5 6.68 5 6.76V9.26ZM5.31 21.95C4.8 21.95 4.37 21.78 4.02 21.43C3.67 21.08 3.5 20.65 3.5 20.14V6.76C3.5 6.25 3.67 5.83 4.02 5.48C4.37 5.13 4.8 4.95 5.31 4.95H6.69V2.84H8.23V4.95H15.81V2.84H17.31V4.95H18.69C19.2 4.95 19.62 5.13 19.97 5.48C20.32 5.83 20.5 6.25 20.5 6.76V12.22C20.26 12.12 20.01 12.03 19.76 11.97C19.51 11.9 19.26 11.85 19 11.81V10.76H5V20.14C5 20.22 5.03 20.29 5.1 20.35C5.16 20.42 5.23 20.45 5.31 20.45H11.81C11.89 20.73 12 20.99 12.12 21.24C12.24 21.48 12.37 21.72 12.52 21.95H5.31ZM18.19 22.95C16.94 22.95 15.88 22.51 15 21.64C14.13 20.76 13.69 19.7 13.69 18.45C13.69 17.2 14.13 16.14 15 15.26C15.88 14.39 16.94 13.95 18.19 13.95C19.44 13.95 20.5 14.39 21.38 15.26C22.25 16.14 22.69 17.2 22.69 18.45C22.69 19.7 22.25 20.76 21.38 21.64C20.5 22.51 19.44 22.95 18.19 22.95ZM19.86 20.74L20.48 20.12L18.63 18.27V15.51H17.75V18.63L19.86 20.74Z" fill="#444444"/></svg>
                  {weddingDate}
                </p>
                {event.venue && (
                  <p className="flex gap-2 items-center font-medium text-base text-[#444444]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 11.87C12.5 11.87 12.92 11.69 13.27 11.33C13.62 10.98 13.8 10.55 13.8 10.06C13.8 9.56 13.62 9.13 13.27 8.78C12.91 8.43 12.49 8.25 11.99 8.25C11.49 8.25 11.07 8.43 10.71 8.78C10.36 9.14 10.18 9.56 10.18 10.06C10.18 10.56 10.36 10.98 10.72 11.34C11.07 11.69 11.5 11.87 12 11.87ZM12 19.51C13.95 17.76 15.45 16.08 16.48 14.47C17.52 12.87 18.04 11.46 18.04 10.25C18.04 8.43 17.46 6.93 16.3 5.75C15.14 4.58 13.71 3.99 12 3.99C10.28 3.99 8.84 4.58 7.68 5.75C6.52 6.93 5.94 8.43 5.94 10.25C5.94 11.46 6.46 12.87 7.5 14.47C8.54 16.08 10.04 17.76 12 19.51ZM12 21.51C9.48 19.33 7.59 17.3 6.33 15.42C5.07 13.54 4.44 11.82 4.44 10.25C4.44 7.94 5.19 6.07 6.68 4.64C8.18 3.21 9.95 2.5 12 2.5C14.04 2.5 15.81 3.21 17.3 4.64C18.79 6.07 19.54 7.94 19.54 10.25C19.54 11.82 18.91 13.54 17.65 15.42C16.4 17.3 14.51 19.33 12 21.51Z" fill="#444444"/></svg>
                    {event.venue}
                  </p>
                )}
              </div>
            </div>

            {/* About */}
            {event.description && (
              <div className="py-6 border-y border-[#E8E8E8] flex flex-col gap-4">
                <h2 className="text-xl font-bold">About this Event</h2>
                <div className="text-[#444444] text-[15px] leading-relaxed">
                  <p className={showMore ? '' : 'line-clamp-4'}>{event.description}</p>
                </div>
                {event.description.length > 200 && (
                  <button onClick={() => setShowMore(!showMore)} className="underline font-semibold text-[#101010] w-fit text-sm">
                    {showMore ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* Stats */}
            {(total > 0 || guestCount > 0) && (
              <div className="py-6 border-b border-[#E8E8E8]">
                <h2 className="text-xl font-bold mb-4">Moi Summary</h2>
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-bold text-[#101010]">₹{total.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-[#666666] mt-0.5">Total Collected</p>
                  </div>
                  <div className="w-px bg-[#E8E8E8]" />
                  <div>
                    <p className="text-2xl font-bold text-[#101010]">{guestCount}</p>
                    <p className="text-sm text-[#666666] mt-0.5">Guests</p>
                  </div>
                </div>
              </div>
            )}

            {/* Photos */}
            {photos.length > 0 && (
              <div className="py-6 border-b border-[#E8E8E8]">
                <h2 className="text-xl font-bold mb-4">Photos</h2>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <Image src={photo.s3_url} alt={photo.caption || 'Wedding photo'} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event details */}
            <div className="pt-6 pb-4 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Event Details</h2>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <span className="text-[#444444] mt-0.5">📅</span>
                    <div>
                      <p className="text-xs text-[#666666]">Date</p>
                      <p className="font-medium text-[#101010]">{weddingDate}</p>
                    </div>
                  </div>
                  {event.venue && (
                    <div className="flex gap-3 items-start">
                      <span className="text-[#444444] mt-0.5">📍</span>
                      <div>
                        <p className="text-xs text-[#666666]">Venue</p>
                        <p className="font-medium text-[#101010]">{event.venue}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 items-start">
                    <span className="text-[#444444] mt-0.5">👰</span>
                    <div>
                      <p className="text-xs text-[#666666]">Bride</p>
                      <p className="font-medium text-[#101010]">{event.bride_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-[#444444] mt-0.5">🤵</span>
                    <div>
                      <p className="text-xs text-[#666666]">Groom</p>
                      <p className="font-medium text-[#101010]">{event.groom_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map — only shown when venue is set */}
              {event.venue && <VenueMap venue={event.venue} />}
            </div>

          </div>

          {/* ── RIGHT: col-span-2 sticky sidebar ── */}
          <div className="flex flex-col-reverse lg:flex-col-reverse lg:col-span-2 px-4 lg:px-0 pt-2 pb-20 lg:pb-3 lg:sticky lg:top-8 lg:pt-0 h-fit lg:gap-6">

            {/* Share button — desktop only */}
            <div className="hidden lg:flex justify-center border border-[#E8E8E8] rounded-xl">
              <button onClick={handleCopy} className="flex my-5 gap-2 items-center text-[#444444] font-medium text-base hover:text-[#101010] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16.8 22C16.05 22 15.41 21.74 14.89 21.21C14.37 20.69 14.11 20.06 14.11 19.31C14.11 19.21 14.14 18.96 14.21 18.58L7.1 14.39C6.86 14.64 6.57 14.84 6.24 14.98C5.91 15.12 5.55 15.19 5.18 15.19C4.43 15.19 3.8 14.93 3.28 14.4C2.75 13.88 2.49 13.24 2.49 12.5C2.49 11.76 2.75 11.12 3.28 10.6C3.8 10.07 4.43 9.81 5.18 9.81C5.55 9.81 5.91 9.88 6.24 10.02C6.57 10.16 6.86 10.36 7.1 10.61L14.21 6.43C14.17 6.31 14.15 6.19 14.13 6.07C14.12 5.95 14.11 5.83 14.11 5.69C14.11 4.94 14.37 4.31 14.89 3.79C15.42 3.26 16.05 3 16.8 3C17.55 3 18.19 3.26 18.71 3.79C19.23 4.31 19.49 4.95 19.49 5.69C19.49 6.44 19.23 7.08 18.71 7.6C18.18 8.12 17.55 8.38 16.8 8.38C16.42 8.38 16.07 8.31 15.74 8.17C15.41 8.02 15.13 7.83 14.89 7.58L7.77 11.76C7.81 11.88 7.84 12.01 7.86 12.12C7.87 12.24 7.88 12.37 7.88 12.5C7.88 12.63 7.87 12.76 7.86 12.88C7.84 12.99 7.81 13.12 7.77 13.24L14.89 17.43C15.13 17.18 15.41 16.98 15.74 16.83C16.07 16.69 16.42 16.62 16.8 16.62C17.55 16.62 18.18 16.88 18.71 17.4C19.23 17.93 19.49 18.56 19.49 19.31C19.49 20.06 19.23 20.69 18.71 21.22C18.18 21.74 17.55 22 16.8 22Z" fill="#444444"/></svg>
                <span className="underline">{copied ? 'Link copied!' : 'Share this event'}</span>
              </button>
            </div>

            {/* Organized by */}
            <div className="border border-[#E8E8E8] rounded-xl px-4 py-5 flex flex-col gap-4">
              <h3 className="font-bold text-[#000000] text-xl">Organized By</h3>
              <div className="flex gap-4 items-center border-b border-[#E8E8E8] pb-4">
                <div className="w-12 h-12 rounded-full bg-[#FFF8E1] border border-[#FFE082] flex items-center justify-center text-xl font-bold text-[#B8860B] shrink-0">
                  {event.bride_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-[#222222]">{event.bride_name} &amp; {event.groom_name}</h4>
                  {event.creator_name && (
                    <p className="text-sm text-[#666666] mt-0.5">Listed by {event.creator_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop: Give Moi card */}
            <div className="hidden lg:flex flex-col border border-[#E8E8E8] rounded-xl p-6 gap-5">
              <div>
                <p className="text-sm text-[#666666] mb-1">Wedding Gift</p>
                <h3 className="text-2xl font-bold text-[#101010]">Give Moi 💍</h3>
                <p className="text-sm text-[#666666] mt-1">மொய் கொடுக்க இங்கே அழுத்துங்கள்</p>
              </div>
              {(total > 0 || guestCount > 0) && (
                <div className="flex gap-4 text-sm text-[#666666]">
                  <span>👥 {guestCount} guests</span>
                  <span>₹{total.toLocaleString('en-IN')} collected</span>
                </div>
              )}
              <button
                onClick={onGiveMoi}
                className="bg-[#FFC107] border border-[#FFC107] h-[50px] flex justify-center items-center text-center text-[#000000] font-semibold rounded-lg cursor-pointer hover:bg-[#E6AC00] transition-colors"
              >
                Give Moi Now
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── Mobile: sticky bottom bar ── */}
      <div className="sticky bottom-0 left-0 flex justify-between bg-white py-4 px-4 items-center border-t border-[#F5F5F5] shadow-lg lg:hidden">
        <div className="flex-1">
          <p className="text-xs text-[#666666]">Wedding Gift</p>
          <h3 className="text-lg font-bold text-[#101010]">Give Moi 💍</h3>
        </div>
        <button
          onClick={onGiveMoi}
          className="bg-[#FFC107] border border-[#FFC107] flex-1 h-[50px] flex justify-center items-center rounded-lg font-semibold text-[#000000] hover:bg-[#E6AC00] transition-colors"
        >
          Give Moi Now
        </button>
      </div>

    </div>
  );
}

// ── Moi Form ──────────────────────────────────────────────────────────────────
function MoiForm({ event, onBack, onSuccess }: { event: Event; onBack: () => void; onSuccess: () => void }) {
  const [form, setForm]       = useState<GuestForm>({ guest_name: '', amount: '', relation: 'friend', payment_mode: 'cash', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const presets = [101, 201, 501, 1001, 2001, 5001];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guest_name.trim()) { setError('Please enter your name'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Please enter a valid amount'); return; }
    setError(''); setSubmitting(true);
    try {
      await moiApi.add({
        slug: event.slug,
        guest_name: form.guest_name.trim(),
        amount: parseFloat(form.amount),
        relation: form.relation as 'family' | 'friend' | 'colleague' | 'other',
        payment_mode: form.payment_mode as 'cash' | 'upi' | 'card' | 'cheque',
        note: form.note.trim(),
      });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-[#101010] placeholder-[#999] focus:outline-none focus:border-[#FFC107] transition-colors bg-white";

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E8E8E8] sticky top-0 bg-white z-10">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F5F5F5] text-[#444444] hover:bg-gray-200 transition-colors">←</button>
        <div>
          <h2 className="font-bold text-[#101010]">Give Moi</h2>
          <p className="text-xs text-[#666666]">{event.bride_name} &amp; {event.groom_name}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-36">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-[#101010] mb-2">Your Name <span className="text-[#FFC107]">*</span></label>
          <input type="text" required autoFocus value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} className={inputCls} placeholder="உங்கள் பெயர் / Your name" />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-[#101010] mb-2">Amount (₹) <span className="text-[#FFC107]">*</span></label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {presets.map((p) => (
              <button key={p} type="button" onClick={() => setForm({ ...form, amount: String(p) })}
                className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${form.amount === String(p) ? 'border-[#FFC107] bg-[#FFFCF5] text-[#B8860B]' : 'border-[#E8E8E8] text-[#444444] hover:border-[#FFC107]'}`}>
                ₹{p.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <input type="number" min="1" step="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="Or enter custom amount" />
        </div>

        {/* Relation */}
        <div>
          <label className="block text-sm font-semibold text-[#101010] mb-2">Relation</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ v: 'family', l: '👨‍👩‍👧 Family', t: 'குடும்பம்' }, { v: 'friend', l: '👫 Friend', t: 'நண்பர்' }, { v: 'colleague', l: '💼 Colleague', t: 'சக ஊழியர்' }, { v: 'other', l: '🤝 Other', t: 'மற்றவர்' }].map((r) => (
              <button key={r.v} type="button" onClick={() => setForm({ ...form, relation: r.v })}
                className={`py-3 px-3 rounded-xl text-left border-2 transition-colors ${form.relation === r.v ? 'border-[#FFC107] bg-[#FFFCF5]' : 'border-[#E8E8E8] hover:border-[#FFC107]'}`}>
                <p className="text-sm font-semibold text-[#101010]">{r.l}</p>
                <p className="text-xs text-[#666666]">{r.t}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Payment mode */}
        <div>
          <label className="block text-sm font-semibold text-[#101010] mb-2">Payment Mode</label>
          <div className="grid grid-cols-4 gap-2">
            {[{ v: 'cash', i: '💵', l: 'Cash' }, { v: 'upi', i: '📱', l: 'UPI' }, { v: 'card', i: '💳', l: 'Card' }, { v: 'cheque', i: '📄', l: 'Cheque' }].map((m) => (
              <button key={m.v} type="button" onClick={() => setForm({ ...form, payment_mode: m.v })}
                className={`py-3 rounded-xl text-center border-2 transition-colors ${form.payment_mode === m.v ? 'border-[#FFC107] bg-[#FFFCF5]' : 'border-[#E8E8E8] hover:border-[#FFC107]'}`}>
                <p className="text-xl">{m.i}</p>
                <p className="text-xs text-[#444444] mt-1 font-medium">{m.l}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-semibold text-[#101010] mb-2">Note <span className="text-[#999] font-normal">(optional)</span></label>
          <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputCls} placeholder="Any message for the couple…" />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>}
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E8E8] px-4 py-4">
        <div className="max-w-lg mx-auto">
          {form.guest_name && form.amount && (
            <div className="flex items-center justify-between bg-[#FFFCF5] border border-[#FFE082] rounded-xl px-4 py-2.5 mb-3">
              <span className="text-sm text-[#444444]">{form.guest_name}</span>
              <span className="font-bold text-[#B8860B]">₹{parseFloat(form.amount || '0').toLocaleString('en-IN')}</span>
            </div>
          )}
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-[#FFC107] border border-[#FFC107] h-[50px] flex justify-center items-center rounded-lg font-semibold text-[#000000] hover:bg-[#E6AC00] transition-colors disabled:opacity-50">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Submitting…
              </span>
            ) : '✓ Submit Moi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Success View ──────────────────────────────────────────────────────────────
function SuccessView({ event, onBack }: { event: Event; onBack: () => void }) {
  const [copied, setCopied] = useState('');
  const hasUpi  = !!event.upi_id;
  const hasBank = !!(event.account_number && event.ifsc_code);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10 max-w-lg mx-auto">
      {/* Confirmation */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-[#FFFCF5] border-2 border-[#FFE082] rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-[#101010] mb-1">Moi Recorded!</h1>
        <p className="text-[#666666] text-sm">மொய் வெற்றிகரமாக பதிவு செய்யப்பட்டது</p>
        <p className="text-[#999] text-sm mt-2">
          For <span className="font-semibold text-[#444444]">{event.bride_name} &amp; {event.groom_name}</span>
        </p>
      </div>

      {/* Payment instructions */}
      {(hasUpi || hasBank) && (
        <div className="space-y-4 mb-8">
          <div className="bg-[#FFFBEE] border border-[#FFE082] rounded-xl p-4">
            <p className="text-sm font-bold text-[#B8860B] mb-1">💸 Now send the money</p>
            <p className="text-xs text-[#666] leading-relaxed">
              Your entry has been recorded. Please transfer the amount using one of the methods below.
            </p>
          </div>

          {/* UPI */}
          {hasUpi && (
            <div className="border border-[#E8E8E8] rounded-xl overflow-hidden">
              <div className="bg-[#F0FFF4] px-4 py-3 border-b border-[#E8E8E8] flex items-center gap-2">
                <span className="text-lg">📱</span>
                <p className="font-semibold text-sm text-[#101010]">Pay via UPI</p>
                <span className="ml-auto text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Recommended</span>
              </div>
              <div className="p-4">
                {/* UPI QR code via free API */}
                <div className="flex items-center gap-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=${encodeURIComponent(event.upi_id!)}&pn=${encodeURIComponent(event.bride_name + ' & ' + event.groom_name)}&cu=INR`}
                    alt="UPI QR Code"
                    className="w-28 h-28 rounded-lg border border-[#E8E8E8]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#999] mb-1">UPI ID</p>
                    <p className="font-bold text-[#101010] text-sm break-all">{event.upi_id}</p>
                    <button
                      onClick={() => copyText(event.upi_id!, 'upi')}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#FFC107] hover:text-[#E6AC00] transition-colors"
                    >
                      {copied === 'upi' ? '✓ Copied!' : '📋 Copy UPI ID'}
                    </button>
                    <a
                      href={`upi://pay?pa=${encodeURIComponent(event.upi_id!)}&pn=${encodeURIComponent(event.bride_name + ' & ' + event.groom_name)}&cu=INR`}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white bg-[#FFC107] px-3 py-1.5 rounded-lg hover:bg-[#E6AC00] transition-colors w-fit"
                    >
                      Open UPI App →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bank transfer */}
          {hasBank && (
            <div className="border border-[#E8E8E8] rounded-xl overflow-hidden">
              <div className="bg-[#EFF6FF] px-4 py-3 border-b border-[#E8E8E8] flex items-center gap-2">
                <span className="text-lg">🏦</span>
                <p className="font-semibold text-sm text-[#101010]">Bank Transfer / NEFT / IMPS</p>
              </div>
              <div className="p-4 space-y-2.5">
                {[
                  { label: 'Account Holder', value: event.account_holder || event.bride_name + ' / ' + event.groom_name },
                  { label: 'Bank',           value: event.bank_name },
                  { label: 'Account No.',    value: event.account_number, copy: true },
                  { label: 'IFSC Code',      value: event.ifsc_code,      copy: true },
                ].filter((r) => r.value).map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] text-[#999]">{row.label}</p>
                      <p className="text-sm font-semibold text-[#101010] break-all">{row.value}</p>
                    </div>
                    {row.copy && (
                      <button
                        onClick={() => copyText(row.value!, row.label)}
                        className="shrink-0 text-xs text-[#FFC107] font-semibold hover:text-[#E6AC00]"
                      >
                        {copied === row.label ? '✓' : '📋'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cash note */}
          {!hasUpi && !hasBank && (
            <div className="border border-[#E8E8E8] rounded-xl p-4 text-center text-sm text-[#666]">
              💵 Please hand over the cash to the couple or their representative in person.
            </div>
          )}
        </div>
      )}

      {/* No payment details set */}
      {!hasUpi && !hasBank && (
        <div className="bg-[#fafafa] border border-[#E8E8E8] rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-[#666]">💵 Please hand over the cash to the couple in person.</p>
        </div>
      )}

      <div className="text-3xl text-center mb-6 space-x-2"><span>🎊</span><span>💍</span><span>🎉</span></div>

      <button onClick={onBack}
        className="w-full border-2 border-[#FFC107] text-[#B8860B] py-3.5 rounded-xl font-semibold hover:bg-[#FFFCF5] transition-colors">
        ← Back to Event
      </button>
      <p className="text-xs text-[#cccccc] mt-6 text-center">Powered by <span className="text-[#FFC107]">MoiApp</span></p>
    </div>
  );
}

// ── Venue Map ─────────────────────────────────────────────────────────────────
// Uses OpenStreetMap via nominatim (geocoding) + tile iframe — no API key needed.
function VenueMap({ venue }: { venue: string }) {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    // Geocode the venue string using Nominatim (free, no key)
    const query = encodeURIComponent(venue);
    fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then((r) => r.json())
      .then((results) => {
        if (!results.length) { setStatus('error'); return; }
        const { lat, lon } = results[0];
        // OpenStreetMap embed URL
        const url = `https://www.openstreetmap.org/export/embed.html?bbox=${Number(lon) - 0.01},${Number(lat) - 0.008},${Number(lon) + 0.01},${Number(lat) + 0.008}&layer=mapnik&marker=${lat},${lon}`;
        setMapUrl(url);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [venue]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`;

  return (
    <div className="border border-[#E8E8E8] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5]">
        <div className="flex items-center gap-2">
          <span className="text-base">📍</span>
          <div>
            <p className="text-sm font-semibold text-[#101010]">Venue Location</p>
            <p className="text-xs text-[#999] truncate max-w-[220px]">{venue}</p>
          </div>
        </div>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#FFC107] hover:text-[#E6AC00] transition-colors whitespace-nowrap"
        >
          Open in Maps
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>

      {/* Map area */}
      <div className="relative w-full h-[220px] bg-[#f5f5f5]">
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-[#999] text-sm">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
            Loading map…
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="text-3xl">🗺️</span>
            <p className="text-sm text-[#666]">Could not load map for this venue.</p>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#FFC107] hover:underline"
            >
              Search on Google Maps →
            </a>
          </div>
        )}

        {status === 'ready' && mapUrl && (
          <iframe
            src={mapUrl}
            title={`Map of ${venue}`}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>

      {/* Footer attribution */}
      {status === 'ready' && (
        <div className="px-4 py-2 bg-[#fafafa] border-t border-[#F5F5F5] flex items-center justify-between">
          <p className="text-[10px] text-[#bbb]">
            Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenStreetMap</a> contributors
          </p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#999] hover:text-[#666] transition-colors"
          >
            Get directions →
          </a>
        </div>
      )}
    </div>
  );
}
