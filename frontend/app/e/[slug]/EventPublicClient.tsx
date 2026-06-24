'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon, { type IconName } from '@/components/ui/Icon';
import { eventsApi, moiApi, photosApi, Event, Photo, paymentApi, RazorpayPaymentMethod } from '@/lib/api';
import { useFeatures } from '@/lib/features';
import { canAcceptGuestMoi } from '@/lib/eventHelpers';

// In static export useParams() always returns the placeholder slug '_'.
// Read the real slug from the URL path instead.
function useSlug(): string {
  const [slug, setSlug] = useState('');
  useEffect(() => {
    let path = window.location.pathname.split('?')[0].split('#')[0];
    path = path.replace(/\/(index\.html?)$/i, '');
    path = path.replace(/\/$/, '');
    const parts = path.split('/');
    const s = parts[parts.length - 1];
    setSlug(s === '_' ? '' : s);
  }, []);
  return slug;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

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

type Step = 'event' | 'form' | 'payment' | 'success' | 'thankyou';
interface GuestForm {
  guest_name: string;
  city: string;
  relation: string;
  company: string;
  occupation: string;
  gift_type: 'cash' | 'gold' | 'silver' | 'gift';
  amount: string;
  gold_weight: string;
  gift_description: string;
  item_name: string;
  approx_value: string;
  note: string;
}

function getEventIcon(eventType: string): IconName {
  const icons: Record<string, IconName> = {
    wedding: 'wedding',
    birthday: 'gift',
    engagement: 'wedding',
    valakaappu: 'sparkle',
    housewarming: 'venue',
    graduation: 'sparkle',
    custom: 'sparkle',
  };
  return icons[eventType] || 'wedding';
}

function getEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    wedding: 'Wedding',
    birthday: 'Birthday',
    engagement: 'Engagement',
    valakaappu: 'Valakaappu',
    housewarming: 'Housewarming',
    graduation: 'Graduation',
    custom: 'Custom Event',
  };
  return labels[eventType] || 'Event';
}

function PublicGuestNavbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-tn-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-tn-text">
          <span className="w-8 h-8 rounded-xl bg-tn-yellow text-white flex items-center justify-center shadow-sm">M</span>
          <span className="text-sm">MoiApp</span>
        </Link>
        <Link href="/" className="text-xs font-semibold text-tn-text bg-tn-light border border-tn-border px-3 py-2 rounded-full hover:bg-tn-yellow-bg transition-colors">
          Home
        </Link>
      </div>
    </nav>
  );
}

export default function PublicEventPage() {
  const slug = useSlug();
  const [event, setEvent]       = useState<Event | null>(null);
  const [photos, setPhotos]     = useState<Photo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep]         = useState<Step>('event');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    eventsApi.get(slug)
      .then((ev) => { setEvent(ev); return photosApi.list(ev.id); })
      .then(setPhotos)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <>
      <PublicGuestNavbar />
      <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
        <p className="text-[#666666] text-sm">Loading event…</p>
      </div>
    </div>
    </>
  );

  if (notFound || !event) return (
    <>
      <PublicGuestNavbar />
      <div className="min-h-screen bg-white flex items-center justify-center text-center px-6">
        <div>
          <div className="mb-4 text-tn-gold">
            <Icon name="sad" size={48} />
          </div>
          <h1 className="text-xl font-bold text-[#101010]">Event not found</h1>
        <p className="text-[#666666] text-sm mt-2">This link may be invalid or the event has been removed.</p>
        <Link href="/events" className="mt-4 inline-block text-[#FFC107] font-semibold underline text-sm">Browse all events</Link>
      </div>
    </div>
    </>
  );

  if (step === 'form') {
    if (!canAcceptGuestMoi(event)) {
      return <><PublicGuestNavbar /><EventDetailView event={event} photos={photos} onGiveMoi={() => {}} guestMoiClosed shareUrl={shareUrl} /></>;
    }
    return <><PublicGuestNavbar /><MoiForm event={event} onBack={() => setStep('event')} onNext={(formData) => { (window as Window & { __guestForm?: GuestForm }).__guestForm = formData; setStep('payment'); }} /></>;
  }
  if (step === 'payment') return <><PublicGuestNavbar /><PaymentMethod event={event} onBack={() => setStep('form')} onSuccess={(txn) => { (window as Window & { __txn?: { transactionId: string; amount: number; method: string; date: string } }).__txn = txn; setStep('success'); }} /></>;
  if (step === 'success') return <><PublicGuestNavbar /><SuccessView event={event} onBack={() => setStep('event')} onContinue={() => setStep('thankyou')} txn={(window as Window & { __txn?: { transactionId: string; amount: number; method: string; date: string } }).__txn} /></>;
  if (step === 'thankyou') return <><PublicGuestNavbar /><ThankYouScreen event={event} onBack={() => setStep('event')} txn={(window as Window & { __txn?: { transactionId: string; amount: number; method: string; date: string } }).__txn} /></>;

  return <><PublicGuestNavbar /><EventDetailView event={event} photos={photos} onGiveMoi={() => setStep('form')} guestMoiClosed={!canAcceptGuestMoi(event)} shareUrl={shareUrl} /></>;
}

// ── Event Detail View (TicketNadu layout) ─────────────────────────────────────
function EventDetailView({ event, photos, onGiveMoi, guestMoiClosed, shareUrl }: { event: Event; photos: Photo[]; onGiveMoi: () => void; guestMoiClosed?: boolean; shareUrl?: string }) {
  const [showMore, setShowMore]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const guestCount = Number(event.stats?.guest_count || 0);
  const weddingDate = new Date(event.wedding_date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const handleShare = async () => {
    if (!shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event.bride_name || ''} & ${event.groom_name || ''} Wedding`,
          text: 'Give Moi for the wedding!',
          url: shareUrl,
        });
      } catch {
        // User cancelled — no action needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard blocked — silent fallback
      }
    }
  };

  return (
    <div className="bg-white text-[#101010]">

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden px-4 py-3 flex justify-between items-center gap-3 border-b border-[#E8E8E8]">
        <Link href="/events" className="p-1 text-[#444444] shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7.37 13.25L13.06 18.95L12 20L4.5 12.5L12 5L13.06 6.05L7.37 11.75H19.5V13.25H7.37Z" fill="#444444"/></svg>
        </Link>
        <h3 className="font-semibold text-base line-clamp-1 text-center flex-1">
          {event.bride_name || ''} &amp; {event.groom_name || ''}
        </h3>
        {/* WhatsApp share */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${event.bride_name || ''} & ${event.groom_name || ''} Wedding — Give Moi here: ${shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 shrink-0"
          title="Share on WhatsApp"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366"/>
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.401A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.952 7.952 0 01-4.054-1.107l-.29-.173-3.006.845.838-3.065-.19-.314A7.953 7.953 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" fill="#25D366"/>
          </svg>
        </a>
        {/* Native share / copy link */}
        <button onClick={handleShare} className="p-1 text-[#444444] shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16.8 22C16.05 22 15.41 21.74 14.89 21.21C14.37 20.69 14.11 20.06 14.11 19.31C14.11 19.21 14.14 18.96 14.21 18.58L7.1 14.39C6.86 14.64 6.57 14.84 6.24 14.98C5.91 15.12 5.55 15.19 5.18 15.19C4.43 15.19 3.8 14.93 3.28 14.4C2.75 13.88 2.49 13.24 2.49 12.5C2.49 11.76 2.75 11.12 3.28 10.6C3.8 10.07 4.43 9.81 5.18 9.81C5.55 9.81 5.91 9.88 6.24 10.02C6.57 10.16 6.86 10.36 7.1 10.61L14.21 6.43C14.17 6.31 14.15 6.19 14.13 6.07C14.12 5.95 14.11 5.83 14.11 5.69C14.11 4.94 14.37 4.31 14.89 3.79C15.42 3.26 16.05 3 16.8 3C17.55 3 18.19 3.26 18.71 3.79C19.23 4.31 19.49 4.95 19.49 5.69C19.49 6.44 19.23 7.08 18.71 7.6C18.18 8.12 17.55 8.38 16.8 8.38C16.42 8.38 16.07 8.31 15.74 8.17C15.41 8.02 15.13 7.83 14.89 7.58L7.77 11.76C7.81 11.88 7.84 12.01 7.86 12.12C7.87 12.24 7.88 12.37 7.88 12.5C7.88 12.63 7.87 12.76 7.86 12.88C7.84 12.99 7.81 13.12 7.77 13.24L14.89 17.43C15.13 17.18 15.41 16.98 15.74 16.83C16.07 16.69 16.42 16.62 16.8 16.62C17.55 16.62 18.18 16.88 18.71 17.4C19.23 17.93 19.49 18.56 19.49 19.31C19.49 20.06 19.23 20.69 18.71 21.22C18.18 21.74 17.55 22 16.8 22Z" fill="#444444"/></svg>
        </button>
      </div>

      {/* ── Banner image ── */}
      <div className="relative w-full px-4 lg:px-0 overflow-hidden pt-5 lg:pt-0 lg:flex justify-center lg:aspect-[1200/400]">
        {event.cover_photo ? (
          <>
            <Image
              src={event.cover_photo}
              alt={`${event.bride_name || ''} & ${event.groom_name || ''}`}
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
              <div className="mb-2 text-[#B8860B]">
                <Icon name={getEventIcon(event.event_type)} size={44} />
              </div>
              <p className="text-[#B8860B] font-semibold text-sm">{getEventLabel(event.event_type)} Event</p>
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
                 <Icon name={getEventIcon(event.event_type)} size={16} />
                 <span>{getEventLabel(event.event_type)}</span>
               </div>
              <h1 className="font-bold text-xl lg:text-[32px] leading-tight">
                {event.bride_name || ''} &amp; {event.groom_name || ''}
              </h1>
              <div className="pt-2 flex flex-col gap-2 text-[#444444] lg:flex-row lg:gap-6 lg:pt-3">
                <p className="flex gap-2 items-center font-medium text-base">
                  <Icon name="calendar" size={20} />
                  {weddingDate}
                </p>
                {event.venue && (
                  <p className="flex gap-2 items-center font-medium text-base text-[#444444]">
                    <Icon name="map" size={20} />
                    {event.venue}
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.venue)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFC107] text-xs font-semibold underline ml-1 whitespace-nowrap"
                    >
                      ↗ Map
                    </a>
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
            {guestCount > 0 && (
              <div className="py-6 border-b border-[#E8E8E8]">
                <h2 className="text-xl font-bold mb-4">Moi Summary</h2>
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-bold text-[#101010]">{guestCount}</p>
                    <p className="text-sm text-[#666666] mt-0.5">Guests registered</p>
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
                    <span className="text-[#444444] mt-0.5"><Icon name="calendar" size={16} /></span>
                    <div>
                      <p className="text-xs text-[#666666]">Date</p>
                      <p className="font-medium text-[#101010]">{weddingDate}</p>
                    </div>
                  </div>
                  {event.venue && (
                    <>
                      <div className="flex gap-3 items-start">
                        <span className="text-[#444444] mt-0.5"><Icon name="map" size={16} /></span>
                        <div>
                          <p className="text-xs text-[#666666]">Venue</p>
                          <p className="font-medium text-[#101010]">{event.venue}</p>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(event.venue)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FFC107] text-xs font-semibold underline mt-0.5 inline-block"
                          >
                            ↗ Open in Maps
                          </a>
                        </div>
                      </div>
                      {/* Inline map — visible immediately below venue on all viewports */}
                      <VenueMap venue={event.venue} />
                    </>
                  )}
                  {event.event_type === 'wedding' && (
                   <>
                     <div className="flex gap-3 items-start">
                       <span className="text-[#444444] mt-0.5"><Icon name="wedding" size={16} /></span>
                       <div>
                         <p className="text-xs text-[#666666]">Bride</p>
                         <p className="font-medium text-[#101010]">{event.bride_name || ''}</p>
                       </div>
                     </div>
                     <div className="flex gap-3 items-start">
                       <span className="text-[#444444] mt-0.5"><Icon name="users" size={16} /></span>
                       <div>
                         <p className="text-xs text-[#666666]">Groom</p>
                         <p className="font-medium text-[#101010]">{event.groom_name || ''}</p>
                       </div>
                     </div>
                   </>
                   )}
                   {event.event_type === 'graduation' && (
                   <div className="flex gap-3 items-start">
                     <span className="text-[#444444] mt-0.5"><Icon name="sparkle" size={16} /></span>
                     <div>
                       <p className="text-xs text-[#666666]">Graduate</p>
                       <p className="font-medium text-[#101010]">{event.graduate_name || ''}</p>
                     </div>
                   </div>
                   )}
                   {event.event_type === 'housewarming' && (
                   <>
                     <div className="flex gap-3 items-start">
                       <span className="text-[#444444] mt-0.5"><Icon name="users" size={16} /></span>
                       <div>
                         <p className="text-xs text-[#666666]">Host</p>
                         <p className="font-medium text-[#101010]">{event.host_name || ''}</p>
                       </div>
                     </div>
                     {event.spouse_name && (
                      <div className="flex gap-3 items-start">
                        <span className="text-[#444444] mt-0.5"><Icon name="users" size={16} /></span>
                        <div>
                         <p className="text-xs text-[#666666]">Spouse</p>
                         <p className="font-medium text-[#101010]">{event.spouse_name || ''}</p>
                       </div>
                     </div>
                     )}
                   </>
                   )}
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT: col-span-2 sticky sidebar ── */}
          <div className="flex flex-col-reverse lg:flex-col-reverse lg:col-span-2 px-4 lg:px-0 pt-2 pb-20 lg:pb-3 lg:sticky lg:top-8 lg:pt-0 h-fit lg:gap-6">

            {/* Share panel — desktop only */}
            <div className="hidden lg:block border border-[#E8E8E8] rounded-xl px-4 py-4">
              <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">Share this event</p>
              <div className="flex gap-2">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${event.bride_name || ''} & ${event.groom_name || ''} Wedding — Give Moi here: ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-[#E8E8E8] hover:border-[#25D366] hover:bg-[#F0FFF4] transition-colors group"
                  title="Share on WhatsApp"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366"/>
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.401A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.952 7.952 0 01-4.054-1.107l-.29-.173-3.006.845.838-3.065-.19-.314A7.953 7.953 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" fill="#25D366"/>
                  </svg>
                  <span className="text-[11px] font-semibold text-[#444] group-hover:text-[#25D366]">WhatsApp</span>
                </a>

                {/* Copy link */}
                <button
                  onClick={handleShare}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-[#E8E8E8] hover:border-[#FFC107] hover:bg-[#FFFCF5] transition-colors group"
                  title="Copy link"
                >
                  {copied ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#22c55e"/></svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="#666"/></svg>
                  )}
                  <span className={`text-[11px] font-semibold transition-colors ${copied ? 'text-[#22c55e]' : 'text-[#444] group-hover:text-[#B8860B]'}`}>
                    {copied ? 'Copied!' : 'Copy Link'}
                  </span>
                </button>
              </div>
            </div>

            {/* Organized by */}
            <div className="border border-[#E8E8E8] rounded-xl px-4 py-5 flex flex-col gap-4">
              <h3 className="font-bold text-[#000000] text-xl">Organized By</h3>
              <div className="flex gap-4 items-center border-b border-[#E8E8E8] pb-4">
                <div className="w-12 h-12 rounded-full bg-[#FFF8E1] border border-[#FFE082] flex items-center justify-center text-xl font-bold text-[#B8860B] shrink-0">
                  {event.bride_name?.charAt(0) || '?'}
                </div>
                <div>
                  <h4 className="font-semibold text-[#222222]">
            {event.event_type === 'graduation' 
              ? event.graduate_name 
              : event.event_type === 'birthday'
              ? event.birthday_person_name
              : event.event_type === 'housewarming'
              ? `${event.host_name || ''}${event.spouse_name ? ' & ' + event.spouse_name : ''}`
              : event.event_type === 'custom'
              ? event.custom_title
              : `${event.bride_name || ''} & ${event.groom_name || ''}`}
          </h4>
                  {event.creator_name && (
                    <p className="text-sm text-[#666666] mt-0.5">Listed by {event.creator_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop: Give Moi card */}
            <div className="hidden lg:flex flex-col border border-[#E8E8E8] rounded-xl p-6 gap-5">
              <div>
                <p className="text-sm text-[#666666] mb-1">{getEventLabel(event.event_type)} Gift</p>
               <h3 className="text-2xl font-bold text-[#101010] flex items-center gap-2">Give Moi <Icon name={getEventIcon(event.event_type)} size={24} /></h3>
                <p className="text-sm text-[#666666] mt-1">மொய் கொடுக்க இங்கே அழுத்துங்கள்</p>
              </div>
              {guestMoiClosed ? (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  {event.event_mode === 'past'
                    ? 'This is a past event — guest moi collection is not available.'
                    : 'Guest payments will open after admin approves this function.'}
                </p>
              ) : (
                <>
                  {guestCount > 0 && (
                    <div className="flex gap-4 text-sm text-[#666666]">
                      <span className="inline-flex items-center gap-1"><Icon name="users" size={14} /> {guestCount} guests registered</span>
                    </div>
                  )}
                  <button
                    onClick={onGiveMoi}
                    className="bg-[#FFC107] border border-[#FFC107] h-[50px] flex justify-center items-center text-center text-[#000000] font-semibold rounded-lg cursor-pointer hover:bg-[#E6AC00] transition-colors"
                  >
                    Give Moi Now
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── Mobile: sticky bottom bar ── */}
      {!guestMoiClosed && (
        <div className="sticky bottom-0 left-0 flex justify-between bg-white py-4 px-4 items-center border-t border-[#F5F5F5] shadow-lg lg:hidden">
          <div className="flex-1">
            <p className="text-xs text-[#666666]">{getEventLabel(event.event_type)} Gift</p>
             <h3 className="text-lg font-bold text-[#101010] flex items-center gap-1">Give Moi <Icon name={getEventIcon(event.event_type)} size={18} /></h3>
          </div>
          <button
            onClick={onGiveMoi}
            className="bg-[#FFC107] border border-[#FFC107] flex-1 h-[50px] flex justify-center items-center rounded-lg font-semibold text-[#000000] hover:bg-[#E6AC00] transition-colors"
          >
            Give Moi Now
          </button>
        </div>
      )}

    </div>
  );
}

// ── Moi Form ──────────────────────────────────────────────────────────────────
function MoiForm({ event, onBack, onNext }: { event: Event; onBack: () => void; onNext: (data: GuestForm) => void }) {
  const [form, setForm]       = useState<GuestForm>({ guest_name: '', city: '', relation: 'friend', company: '', occupation: '', gift_type: 'cash', amount: '', gold_weight: '', gift_description: '', item_name: '', approx_value: '', note: '' });
  const [error, setError]     = useState('');
  const presets = [101, 201, 501, 1001, 2001, 5001];

  const relationshipOptions = [
    { v: 'family', l: 'Family' },
    { v: 'friend', l: 'Friend' },
    { v: 'colleague', l: 'Colleague' },
    { v: 'relative', l: 'Relative' },
    { v: 'neighbor', l: 'Neighbor' },
    { v: 'business', l: 'Business' },
    { v: 'other', l: 'Other' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guest_name.trim()) { setError('Please enter your name'); return; }
    if (!form.city.trim()) { setError('Please enter your city'); return; }
    if (form.gift_type === 'cash' && (!form.amount || parseFloat(form.amount) <= 0)) {
      setError('Please enter a valid amount'); return;
    }
    if (form.gift_type === 'gold' && (!form.gold_weight || parseFloat(form.gold_weight) <= 0)) {
      setError('Please enter gold weight in grams'); return;
    }
    if ((form.gift_type === 'silver' || form.gift_type === 'gift') && !form.item_name.trim()) {
      setError('Please enter the item name'); return;
    }
    setError('');
    onNext(form);
  };

  const inputCls = "w-full border-2 border-tn-border rounded-xl px-4 py-3 text-base text-tn-text placeholder-tn-subtle focus:outline-none focus:border-tn-yellow transition-colors bg-white";

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-tn-border sticky top-0 bg-white z-10">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-tn-light text-tn-muted hover:bg-gray-200 transition-colors">←</button>
        <div>
          <h2 className="font-bold text-tn-text">Guest Moi Form</h2>
          <p className="text-xs text-tn-subtle">
            {event.event_type === 'graduation'
              ? event.graduate_name
              : event.event_type === 'birthday'
              ? event.birthday_person_name
              : event.event_type === 'housewarming'
              ? `${event.host_name || ''}${event.spouse_name ? ' & ' + event.spouse_name : ''}`
              : event.event_type === 'custom'
              ? event.custom_title
              : `${event.bride_name || ''} & ${event.groom_name || ''}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-36">
        <p className="text-xs font-bold text-tn-text">Personal Details</p>
        <div>
          <label className="block text-sm font-semibold text-tn-text mb-2">Your Name <span className="text-tn-yellow">*</span></label>
          <input type="text" required autoFocus value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} className={inputCls} placeholder="உங்கள் பெயர் / Your name" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-tn-text mb-2">City <span className="text-tn-yellow">*</span></label>
            <input type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} placeholder="Your city" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-tn-text mb-2">Relationship <span className="text-tn-yellow">*</span></label>
            <select required value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} className={inputCls}>
              {relationshipOptions.map((r) => (
                <option key={r.v} value={r.v}>{r.l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-tn-text mb-2">Company <span className="text-tn-subtle font-normal">(optional)</span></label>
            <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} placeholder="Company name" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-tn-text mb-2">Occupation <span className="text-tn-subtle font-normal">(optional)</span></label>
            <input type="text" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inputCls} placeholder="Your occupation" />
          </div>
        </div>

        <p className="text-xs font-bold text-tn-text pt-2">Contribution Details</p>
        <div>
          <label className="block text-sm font-semibold text-tn-text mb-2">Select Gift Type <span className="text-tn-yellow">*</span></label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: 'cash', i: 'wallet' as IconName, l: 'Cash' },
              { v: 'gold', i: 'sparkle' as IconName, l: 'Gold' },
              { v: 'silver', i: 'sparkle' as IconName, l: 'Silver' },
              { v: 'gift', i: 'gift' as IconName, l: 'Gift' },
            ].map((t) => (
              <button key={t.v} type="button"
                onClick={() => setForm({ ...form, gift_type: t.v as GuestForm['gift_type'] })}
                className={`py-3 rounded-xl text-center border-2 transition-colors ${form.gift_type === t.v ? 'border-tn-yellow bg-tn-yellow-bg text-tn-gold' : 'border-tn-border text-tn-muted hover:border-tn-yellow'}`}>
                <p className="text-xl text-tn-gold"><Icon name={t.i} size={24} /></p>
                <p className="text-[10px] font-semibold mt-1">{t.l}</p>
              </button>
            ))}
          </div>
        </div>

        {form.gift_type === 'cash' && (
          <div>
            <label className="block text-sm font-semibold text-tn-text mb-2">Amount (₹) <span className="text-tn-yellow">*</span></label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {presets.map((p) => (
                <button key={p} type="button" onClick={() => setForm({ ...form, amount: String(p) })}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${form.amount === String(p) ? 'border-tn-yellow bg-tn-yellow-bg text-tn-gold' : 'border-tn-border text-tn-muted hover:border-tn-yellow'}`}>
                  ₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
            <input type="number" min="1" step="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="Or enter custom amount" />
          </div>
        )}

        {(form.gift_type === 'gold' || form.gift_type === 'silver') && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-tn-text mb-2">Item Name <span className="text-tn-yellow">*</span></label>
              <input type="text" required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} className={inputCls} placeholder={form.gift_type === 'gold' ? 'e.g. Gold chain' : 'e.g. Silver plate'} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-tn-text mb-2">{form.gift_type === 'gold' ? 'Weight (grams)' : 'Approx Value (₹)'} <span className="text-tn-yellow">*</span></label>
              <input type={form.gift_type === 'gold' ? 'number' : 'number'} min="0.01" step="0.01" value={form.gift_type === 'gold' ? form.gold_weight : form.approx_value} onChange={(e) => setForm({ ...form, [form.gift_type === 'gold' ? 'gold_weight' : 'approx_value']: e.target.value })} className={inputCls} placeholder={form.gift_type === 'gold' ? 'e.g. 8' : 'e.g. 2500'} />
            </div>
          </div>
        )}

        {form.gift_type === 'gift' && (
          <div>
            <label className="block text-sm font-semibold text-tn-text mb-2">Gift Name <span className="text-tn-yellow">*</span></label>
            <input type="text" required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} className={inputCls} placeholder="e.g. Wall clock, photo frame" />
            <div className="mt-3">
              <label className="block text-sm font-semibold text-tn-text mb-2">Approx Value (₹) <span className="text-tn-subtle font-normal">(optional)</span></label>
              <input type="number" min="0" step="1" value={form.approx_value} onChange={(e) => setForm({ ...form, approx_value: e.target.value })} className={inputCls} placeholder="e.g. 1500" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-tn-text mb-2">Message <span className="text-tn-subtle font-normal">(optional)</span></label>
          <textarea rows={3} maxLength={200} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={`${inputCls} resize-none`} placeholder="Your wishes..." />
          <p className="text-[10px] text-tn-subtle text-right">{form.note.length}/200</p>
        </div>

        <div className="bg-tn-yellow-bg rounded-xl p-3 flex gap-2 text-[11px] text-tn-gold border border-tn-gold-border">
          <Icon name="lock" size={16} />
          <p>Your information is secure. We respect your privacy. Your details will only be used for this event.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>}
      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-tn-border px-4 py-4">
        <div className="max-w-lg mx-auto">
          <button type="submit" onClick={handleSubmit}
            className="w-full bg-tn-yellow border border-tn-yellow h-[50px] flex justify-center items-center rounded-lg font-semibold text-white hover:bg-tn-yellow-2 transition-colors">
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );

}
// ── Venue Map ─────────────────────────────────────────────────────────────────
// Shows a Google Maps embed immediately (no API key needed for the embed URL),
// with an OpenStreetMap iframe as fallback if the embed fails.
function VenueMap({ venue }: { venue: string }) {
  const googleMapsUrl  = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`;
  const googleEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(venue)}&output=embed&z=15`;

  return (
    <div className="border border-[#E8E8E8] rounded-xl overflow-hidden">
      {/* Map iframe — Google Maps embed, loads immediately, no API key required */}
      <div className="relative w-full h-[220px] bg-[#f0f0f0]">
        <iframe
          src={googleEmbedUrl}
          title={`Map of ${venue}`}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-[#fafafa] border-t border-[#F5F5F5] flex items-center justify-between">
        <p className="text-xs text-[#888] truncate max-w-[60%]">📍 {venue}</p>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-semibold text-[#FFC107] hover:text-[#E6AC00] transition-colors whitespace-nowrap"
        >
          Open in Maps
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </div>
  );
}

// ── Payment Method ─────────────────────────────────────────────────────────────
type PaymentMethod = RazorpayPaymentMethod;
type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

function PaymentMethod({ event, onBack, onSuccess }: { event: Event; onBack: () => void; onSuccess: (txn: { transactionId: string; amount: number; method: string; date: string }) => void }) {
  const form = (window as Window & { __guestForm?: GuestForm }).__guestForm;
  const paymentCompletedRef = useRef(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [scanRef, setScanRef] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!form) { onBack(); return null; }

  const amount = parseFloat(form.amount || '0');
  const fee = Math.round(amount * 0.0018) || 9;
  const total = amount + fee;

  const handleRazorpaySuccess = async (response: RazorpaySuccessResponse) => {
    if (!form) return;

    paymentCompletedRef.current = true;

    try {
      const result = await paymentApi.verifyPayment({
        event_slug: event.slug,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        payment_method: selectedMethod,
      });

      const dateStr = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      onSuccess({ transactionId: result.transaction_id, amount: total, method: selectedMethod, date: dateStr });
    } catch (err: unknown) {
      paymentCompletedRef.current = false;
      setError(err instanceof Error ? err.message : 'Payment verification failed. Please contact the host.');
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    if ((form.gift_type || 'cash') !== 'cash') {
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
        const note = [form.note.trim(), `Scan & Pay UPI: ${event.upi_id}`, `UPI Ref: ${refId}`].filter(Boolean).join(' · ');
        await moiApi.add({
          slug: event.slug,
          guest_name: form.guest_name.trim(),
          city: form.city.trim() || undefined,
          company: form.company.trim() || undefined,
          occupation: form.occupation.trim() || undefined,
          gift_type: (form.gift_type || 'cash') as 'cash' | 'gold' | 'silver' | 'gift',
          amount,
          relation: form.relation as 'family' | 'friend' | 'colleague' | 'relative' | 'neighbor' | 'business' | 'other',
          payment_mode: 'upi',
          upi_ref_id: refId,
          other_payment_details: event.upi_id,
          note,
        });
        onSuccess({ transactionId: `SCAN${Date.now()}`, amount: total, method: selectedMethod, date: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) });
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
      const RazorpayCtor = window.Razorpay;
      if (!RazorpayCtor) {
        throw new Error('Razorpay checkout failed to load.');
      }

      const order = await paymentApi.createOrder({
        event_slug: event.slug,
        payment_method: selectedMethod,
        guest_data: {
          guest_name: form.guest_name.trim(),
          city: form.city.trim() || undefined,
          company: form.company.trim() || undefined,
          occupation: form.occupation.trim() || undefined,
          relation: form.relation as 'family' | 'friend' | 'colleague' | 'relative' | 'neighbor' | 'business' | 'other',
          gift_type: (form.gift_type || 'cash') as 'cash' | 'gold' | 'silver' | 'gift',
          amount: amount.toFixed(2),
          note: form.note.trim(),
        },
      });

      const razorpay = new RazorpayCtor({
        key: order.razorpay_key_id,
        amount: order.order.amount,
        currency: order.order.currency,
        name: 'MoiApp',
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

  const methods = [
    { id: 'upi' as PaymentMethod, label: 'UPI', sub: 'Google Pay, PhonePe, Paytm', badge: 'Instant' },
    { id: 'card' as PaymentMethod, label: 'Debit / Credit Card', sub: 'Visa, Mastercard, RuPay', badge: 'Instant' },
    { id: 'netbanking' as PaymentMethod, label: 'Net Banking', sub: 'All major banks', badge: 'Instant' },
    { id: 'wallet' as PaymentMethod, label: 'Wallets', sub: 'Paytm, Amazon Pay', badge: 'Instant' },
    { id: 'scan' as PaymentMethod, label: 'Scan & Pay', sub: 'QR based payment', badge: 'Instant' },
  ];
  const hostUpiId = event.upi_id?.trim() || '';
  const hostName = event.creator_name || event.custom_title || event.event_type;
  const upiUrl = hostUpiId ? `upi://pay?pa=${encodeURIComponent(hostUpiId)}&pn=${encodeURIComponent(hostName)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Moi contribution for ' + hostName)}` : '';
  const scanQrUrl = upiUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}` : '';
  const copyUpiId = async () => {
    if (!hostUpiId) return;
    await navigator.clipboard.writeText(hostUpiId);
    setError('UPI ID copied. Complete the payment in your UPI app, then enter the UPI reference.');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-tn-border sticky top-0 bg-white z-10">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-tn-light text-tn-muted hover:bg-gray-200 transition-colors">←</button>
        <div>
          <h2 className="font-bold text-tn-text">Payment Method</h2>
          <p className="text-xs text-tn-subtle">{event.bride_name || ''} &amp; {event.groom_name || ''}</p>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-36">
        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>}

        <div className="bg-tn-yellow-bg border border-tn-gold-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-tn-muted">Gift Amount</p>
            <p className="text-sm font-bold text-tn-text">₹ {amount.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-tn-muted">Convenience Fee</p>
            <p className="text-sm font-bold text-tn-text">₹ {fee.toLocaleString('en-IN')}</p>
          </div>
          <div className="border-t border-dashed border-tn-gold-border pt-2 flex items-center justify-between">
            <p className="text-sm font-bold text-tn-text">Total Amount</p>
            <p className="text-base font-bold text-tn-gold">₹ {total.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <p className="text-xs font-bold text-tn-text">Select Payment Method</p>
        <div className="space-y-2">
          {methods.map((m) => (
            <button key={m.id} type="button" onClick={() => setSelectedMethod(m.id)} className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${selectedMethod === m.id ? 'border-tn-yellow bg-tn-yellow-bg' : 'border-tn-border bg-white'}`}>
              <div className={`w-4 h-4 rounded-full border-2 ${selectedMethod === m.id ? 'border-tn-yellow bg-tn-yellow' : 'border-tn-subtle'}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-tn-text">{m.label}</p>
                <p className="text-[10px] text-tn-subtle">{m.sub}</p>
              </div>
              <span className="text-[9px] font-bold text-tn-green-soft bg-tn-yellow-bg px-2 py-0.5 rounded-full border border-tn-gold-border">{m.badge}</span>
            </button>
          ))}
        </div>

        {selectedMethod === 'scan' && (
          <div className="bg-white border border-tn-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-tn-light flex items-center justify-center text-tn-gold">
                <Icon name="qr-code" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-tn-text">Scan & Pay with UPI</p>
                <p className="text-[10px] text-tn-subtle">Pay directly to the host UPI ID</p>
              </div>
            </div>
            {hostUpiId ? (
              <>
                <div className="bg-white border border-tn-border rounded-xl p-3 mb-3 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={scanQrUrl} alt="Scan and pay UPI QR code" className="w-[220px] h-[220px] rounded-lg" />
                </div>
                <div className="bg-tn-light rounded-xl p-3 mb-3 break-all text-sm">
                  <p className="text-[10px] text-tn-subtle mb-1">Host UPI ID</p>
                  <p className="font-semibold text-tn-text">{hostUpiId}</p>
                </div>
                <button type="button" onClick={copyUpiId} className="w-full h-10 rounded-xl border border-tn-yellow text-tn-gold font-semibold text-sm mb-3">
                  Copy UPI ID
                </button>
                <label className="block text-[10px] font-semibold text-tn-text mb-1">UPI Reference / Transaction ID</label>
                <input value={scanRef} onChange={(e) => setScanRef(e.target.value)} className="w-full border border-tn-border rounded-xl px-3 py-2.5 text-sm text-tn-text focus:outline-none focus:border-tn-yellow mb-3" placeholder="e.g. 409123456789" />
                <p className="text-[11px] text-tn-subtle leading-relaxed">
                  Scan this QR, pay <strong>₹ {total.toLocaleString('en-IN')}</strong>, then enter the UPI reference ID shown in your UPI app. The host will verify this reference.
                </p>
              </>
            ) : (
              <div className="bg-tn-yellow-bg border border-tn-gold-border rounded-xl p-3 text-[11px] text-tn-gold leading-relaxed">
                Host has not added a UPI ID in Settings yet. Please use Razorpay or contact the host.
              </div>
            )}
          </div>
        )}

        <div className="bg-tn-yellow-bg rounded-xl p-3 flex gap-2 text-[11px] text-tn-gold border border-tn-gold-border">
          <Icon name="shield" size={16} />
          <p>100% Secure Payments. Your payment details are encrypted and safe with us.</p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-tn-border px-4 py-4">
        <div className="max-w-lg mx-auto">
          <button type="button" onClick={handlePay} disabled={processing || total <= 0 || (form.gift_type || 'cash') !== 'cash' || (selectedMethod === 'scan' && (!hostUpiId || !scanRef.trim()))} className="w-full h-12 bg-tn-yellow text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-tn-yellow-2 transition-colors">
            <Icon name="lock" size={16} /> {processing ? 'Processing…' : selectedMethod === 'scan' ? `Confirm Scan & Pay ₹ ${total.toLocaleString('en-IN')}` : `Pay ₹ ${total.toLocaleString('en-IN')}`}
          </button>
          <p className="text-center text-[10px] text-tn-subtle mt-2">{selectedMethod === 'scan' ? 'Direct UPI payment to host' : 'Secured by Razorpay'}</p>
        </div>
      </div>
    </div>
  );
}

// ── Success View ──────────────────────────────────────────────────────────────
function SuccessView({ event, onBack, onContinue, txn }: { event: Event; onBack: () => void; onContinue: () => void; txn?: { transactionId: string; amount: number; method: string; date: string } }) {
  const [copied, setCopied] = useState('');
  const { isEnabled } = useFeatures();
  const isWedding = event.event_type === 'wedding';
  const eventNames = isWedding
    ? `${event.bride_name || ''} & ${event.groom_name || ''}`
    : event.event_type === 'birthday'
    ? event.birthday_person_name || ''
    : event.event_type === 'graduation'
    ? event.graduate_name || ''
    : event.event_type === 'housewarming'
    ? `${event.host_name || ''}${event.spouse_name ? ' & ' + event.spouse_name : ''}`
    : event.custom_title || '';

  const whatsappMessage = encodeURIComponent(
    `Thank you — I just gave moi to ${eventNames}'s ${event.event_type}!\n\n` +
    `Event: ${eventNames}\n` +
    `Date: ${new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
    (event.venue ? `Venue: ${event.venue}\n` : '') +
    `\nGive moi here: ${typeof window !== 'undefined' ? window.location.origin + '/e/' + event.slug : ''}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-tn-yellow-bg border-2 border-tn-gold-border rounded-full flex items-center justify-center mx-auto mb-5 text-tn-gold">
          <Icon name="check" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-tn-text mb-1">Payment Successful!</h1>
        <p className="text-sm text-tn-subtle">Your moi has been recorded successfully</p>
        <p className="text-xs text-tn-muted mt-2">
          For <span className="font-semibold text-tn-text">{eventNames}</span>
        </p>
      </div>

      {txn && (
        <div className="inline-flex items-center gap-2 bg-tn-yellow-bg border border-tn-gold-border rounded-full px-4 py-2 mb-6 text-xs font-semibold text-tn-gold">
          <span>✓</span> Transaction ID: {txn.transactionId}
          <button type="button" onClick={() => copyText(txn.transactionId)} className="text-tn-yellow ml-1">{copied === txn.transactionId ? '✓' : 'Copy'}</button>
        </div>
      )}

      <div className="bg-white border border-tn-border rounded-2xl p-4 mb-4 text-left">
        <h3 className="text-sm font-bold text-tn-text mb-3">Payment Summary</h3>
        <div className="space-y-2 text-sm text-tn-muted">
          <div className="flex justify-between"><span>Amount</span><span className="font-semibold text-tn-text">₹ {txn ? txn.amount.toLocaleString('en-IN') : '0'}</span></div>
          <div className="flex justify-between"><span>Payment Method</span><span className="font-semibold text-tn-text capitalize">{txn ? txn.method : ''}</span></div>
          <div className="flex justify-between"><span>Date</span><span className="font-semibold text-tn-text">{txn ? txn.date : ''}</span></div>
        </div>
      </div>

      {isEnabled('whatsapp_share') && (
        <div className="bg-tn-yellow-bg border border-tn-gold-border rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl text-tn-gold"><Icon name="arrow-right" size={24} /></span>
            <div>
              <p className="font-bold text-tn-text">Share on WhatsApp</p>
              <p className="text-xs text-tn-subtle">Send a thank you note to the family</p>
            </div>
          </div>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-tn-yellow text-white py-3 rounded-xl font-bold text-sm hover:bg-tn-yellow-2 transition-colors w-full">
            Share Thank You on WhatsApp
          </a>
        </div>
      )}

      <div className="space-y-3">
        <button type="button" onClick={onContinue} className="w-full h-12 bg-tn-yellow text-white rounded-xl font-semibold text-sm hover:bg-tn-yellow-2 transition-colors">Continue to Thank You</button>
        <button type="button" onClick={onBack} className="w-full h-12 border-2 border-tn-yellow text-tn-gold rounded-xl font-semibold text-sm hover:bg-tn-yellow-bg transition-colors">Back to Event</button>
      </div>
    </div>
  );
}

// ── Thank You Screen ───────────────────────────────────────────────────────────
function ThankYouScreen({ event, onBack, txn }: { event: Event; onBack: () => void; txn?: { transactionId: string; amount: number; method: string; date: string } }) {
  const isWedding = event.event_type === 'wedding';
  const eventNames = isWedding
    ? `${event.bride_name || ''} & ${event.groom_name || ''}`
    : event.event_type === 'birthday'
    ? event.birthday_person_name || ''
    : event.event_type === 'graduation'
    ? event.graduate_name || ''
    : event.event_type === 'housewarming'
    ? `${event.host_name || ''}${event.spouse_name ? ' & ' + event.spouse_name : ''}`
    : event.custom_title || '';

  const handleShare = async () => {
    const text = `I contributed ₹${txn ? txn.amount.toLocaleString('en-IN') : '0'} to ${eventNames}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Moi Contribution', text }); } catch { /* ignore */ }
    } else {
      try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-tn-yellow-bg border-2 border-tn-gold-border rounded-full flex items-center justify-center mx-auto mb-5 text-tn-gold">
          <Icon name="gift" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-tn-text mb-1">Thank You!</h1>
        <p className="text-sm text-tn-subtle">Your moi has been received successfully.</p>
      </div>

      <div className="bg-white border border-tn-border rounded-2xl p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-tn-yellow-bg border border-tn-gold-border flex items-center justify-center text-xl font-bold text-tn-gold shrink-0">
            {event.creator_name ? event.creator_name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <p className="text-sm font-bold text-tn-text">Host</p>
            <p className="text-xs text-tn-subtle">{event.creator_name || eventNames}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-tn-muted">
          <div className="flex justify-between"><span>Guest Name</span><span className="font-semibold text-tn-text">{(window as Window & { __guestForm?: GuestForm }).__guestForm?.guest_name || 'Guest'}</span></div>
          <div className="flex justify-between"><span>Amount</span><span className="font-semibold text-tn-text">₹ {txn ? txn.amount.toLocaleString('en-IN') : '0'}</span></div>
          <div className="flex justify-between"><span>Gift Type</span><span className="font-semibold text-tn-text capitalize">{(window as Window & { __guestForm?: GuestForm }).__guestForm?.gift_type || 'cash'}</span></div>
          <div className="flex justify-between"><span>Transaction ID</span><span className="font-semibold text-tn-text">{txn ? txn.transactionId : ''}</span></div>
          <div className="flex justify-between"><span>Date</span><span className="font-semibold text-tn-text">{txn ? txn.date : ''}</span></div>
        </div>
      </div>

      <div className="bg-tn-yellow-bg border border-tn-gold-border rounded-2xl p-5 mb-6">
        <p className="text-sm font-bold text-tn-gold mb-2">A Message from the Host</p>
        <p className="text-sm text-tn-muted italic">Your blessings and support mean a lot to us. Thank you for being part of our celebration.</p>
        <p className="text-xs text-tn-subtle text-right mt-3 font-semibold">— {eventNames}</p>
      </div>

      <div className="space-y-3">
        <button type="button" onClick={() => window.print()} className="w-full h-12 bg-tn-yellow text-white rounded-xl font-semibold text-sm hover:bg-tn-yellow-2 transition-colors">Download Receipt</button>
        <button type="button" onClick={handleShare} className="w-full h-12 border-2 border-tn-yellow text-tn-gold rounded-xl font-semibold text-sm hover:bg-tn-yellow-bg transition-colors">Share Confirmation</button>
        <button type="button" onClick={onBack} className="w-full h-12 border-2 border-tn-yellow text-tn-gold rounded-xl font-semibold text-sm hover:bg-tn-yellow-bg transition-colors">Back to Home</button>
      </div>
    </div>
  );
}