'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon, { type IconName } from '@/components/ui/Icon';
import { eventsApi, Event } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    eventsApi.listPublic()
      .then((evs) => {
        // Ensure we always have an array
        const eventList = Array.isArray(evs) ? evs : [];
        setEvents(eventList);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoaded(true));
  }, []);

  const upcoming = events.filter((e) => e.wedding_date >= new Date().toISOString().split('T')[0]);
  const featuredEvent = upcoming[0] ?? events[0] ?? null;
  const totalGuests = events.reduce((s, e) => s + Number(e.guest_count || 0), 0);

  return (
    <div className="bg-white text-[#101010]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFFDF5] via-white to-[#FFF8E1] border-b border-[#F0E8C8]">
        {/* Decorative background rings */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#FFC107]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#FFC107]/8 blur-2xl pointer-events-none" />

        <div className="relative max-w-[88%] mx-auto py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">

          {/* Left copy */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#FFC107]/15 border border-[#FFC107]/40 text-[#B8860B] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-10">
              <Icon name="wedding" size={16} /> Tamil Wedding Gift Tracker
            </div>

            <h1 className="text-4xl lg:text-6xl font-extrabold text-[#101010] leading-[1.1] mb-8">
              Create your wedding page.<br />
              Track every <span className="text-[#FFC107]">moi</span> gift.<br />
              Share with family.
            </h1>

            <p className="text-[#555] text-lg leading-relaxed mb-12 max-w-lg mx-auto lg:mx-0">
              இணையவழி மொய் பதிவு செய்ய ஒரு எளிய தளம்.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-16">
              <Link href="/events"
                className="bg-[#FFC107] text-black px-8 py-3.5 rounded-xl font-bold text-base hover:bg-[#E6AC00] transition-colors shadow-lg shadow-[#FFC107]/30 text-center inline-flex items-center justify-center gap-2">
                Browse Weddings <Icon name="arrow-right" size={18} />
              </Link>
              <Link href="/register"
                className="border-2 border-[#E8E8E8] text-[#333] px-8 py-3.5 rounded-xl font-semibold text-base hover:border-[#FFC107] transition-colors text-center">
                List Your Wedding
              </Link>
            </div>

            {/* Live stats */}
            {loaded && events.length > 0 && (
              <div className="flex items-center gap-8 mt-16 justify-center lg:justify-start">
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-extrabold text-[#101010]">{events.length}</p>
                  <p className="text-xs text-[#888]">Weddings listed</p>
                </div>
                <div className="w-px h-10 bg-[#E8E8E8]" />
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-extrabold text-[#101010]">{totalGuests.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-[#888]">Guests gifted</p>
                </div>
              </div>
            )}
          </div>

          {/* Right — featured event card */}
          <div className="flex-1 max-w-sm w-full">
            {featuredEvent ? (
              <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 overflow-hidden border border-[#F0E8C8]">
                {/* Cover image */}
                <div className="relative h-44 bg-gradient-to-br from-[#FFF8E1] to-[#FFFCF5] flex items-center justify-center overflow-hidden">
                    {featuredEvent.cover_photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={featuredEvent.cover_photo} alt="cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <div className="mb-1 text-[#B8860B]">
                          <Icon name="wedding" size={44} />
                        </div>
                        <p className="text-[#B8860B] text-xs font-semibold">Wedding Event</p>
                      </div>
                    )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-white">
                    <p className="font-bold text-lg leading-tight">{featuredEvent.bride_name} &amp; {featuredEvent.groom_name}</p>
                    <p className="text-xs text-white/80">
                      {new Date(featuredEvent.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="absolute top-3 right-3 bg-[#FFC107] text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Live</div>
                </div>

                <div className="p-4">
                  {featuredEvent.venue && (
                    <p className="text-xs text-[#666] mb-3 flex items-center gap-1">
                      <Icon name="map" size={14} /> {featuredEvent.venue}
                    </p>
                  )}
                  <div className="flex gap-4 mb-4">
                    <div>
                      <p className="text-lg font-extrabold text-[#101010]">{featuredEvent.guest_count || 0}</p>
                      <p className="text-[10px] text-[#888] flex items-center gap-1"><Icon name="users" size={12} /> Guests registered</p>
                    </div>
                  </div>
                  <Link href={`/e/${featuredEvent.slug}`}
                    className="block w-full bg-[#FFC107] text-black py-2.5 rounded-xl font-bold text-sm text-center hover:bg-[#E6AC00] transition-colors">
                    Give Moi Now →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 overflow-hidden border border-[#F0E8C8]">
                <img 
                  src="/hero-image.webp" 
                  alt="MoiApp Hero" 
                  className="w-full h-auto object-cover" 
                />
              </div>
            )}

            {events.length > 1 && (
              <p className="text-center text-xs text-[#999] mt-3">
                +{events.length - 1} more wedding{events.length > 2 ? 's' : ''} ·{' '}
                <Link href="/events" className="text-[#FFC107] font-semibold hover:underline">Browse all</Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4 border-b border-[#F0F0F0] bg-white">
        <div className="max-w-[88%] mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[#FFC107] uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[#101010]">How MoiApp works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Guest flow */}
            <div className="bg-[#FFFCF5] border border-[#FFE082] rounded-2xl p-8">
              <p className="text-xs font-bold text-[#FFC107] uppercase tracking-widest mb-7 flex items-center gap-2"><Icon name="users" size={16} /> For Guests</p>
              <div className="space-y-7">
                {[
                  { n: '1', t: 'Browse Events',  d: 'Find the wedding from the events listing page.' },
                  { n: '2', t: 'View Details',   d: 'See date, venue, couple details, photos and map.' },
                  { n: '3', t: 'Give Moi',       d: 'Enter your name, amount and pay via UPI or cash.' },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#FFC107] flex items-center justify-center text-black font-extrabold text-sm shrink-0">{s.n}</div>
                    <div>
                      <p className="font-bold text-[#101010] mb-1">{s.t}</p>
                      <p className="text-[#666] text-sm">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/events" className="mt-8 inline-flex items-center gap-2 bg-[#FFC107] text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#E6AC00] transition-colors">
                Browse Events <Icon name="arrow-right" size={16} />
              </Link>
            </div>

            {/* Organizer flow */}
            <div className="bg-[#fafafa] border border-[#E8E8E8] rounded-2xl p-8">
              <p className="text-xs font-bold text-[#666] uppercase tracking-widest mb-7 flex items-center gap-2"><Icon name="venue" size={16} /> For Couples / Organizers</p>
              <div className="space-y-7">
                {[
                  { n: '1', t: 'Create Account',  d: 'Register and create your wedding event in minutes.' },
                  { n: '2', t: 'Upload & Share',  d: 'Add cover photo, share the link — no login needed for guests.' },
                  { n: '3', t: 'Track & Export',  d: 'Dashboard shows who paid, totals, and CSV export.' },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#F5F5F5] border-2 border-[#E8E8E8] flex items-center justify-center text-[#444] font-extrabold text-sm shrink-0">{s.n}</div>
                    <div>
                      <p className="font-bold text-[#101010] mb-1">{s.t}</p>
                      <p className="text-[#666] text-sm">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register" className="mt-8 inline-flex items-center gap-2 border-2 border-[#E8E8E8] text-[#333] px-5 py-2.5 rounded-xl font-bold text-sm hover:border-[#FFC107] transition-colors">
                List Your Wedding <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why MoiApp ── */}
      <section className="py-16 px-4 border-b border-[#F0F0F0] bg-white">
        <div className="max-w-[88%] mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#FFC107] uppercase tracking-widest mb-3">Why Choose Us</p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[#101010]">Why MoiApp</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: 'check' as IconName, title: '100% Free', desc: 'No hidden charges' },
              { icon: 'lock' as IconName, title: 'Secure Data', desc: 'Your data is safe' },
              { icon: 'wallet' as IconName, title: 'UPI Supported', desc: 'Direct payments' },
              { icon: 'wedding' as IconName, title: 'Made for Tamil Weddings', desc: 'Cultural touch' },
            ].map((item) => (
              <div key={item.title} className="bg-[#FFFCF5] border border-[#FFE082] rounded-xl p-5 text-center hover:shadow-md transition-all">
                <div className="text-[#FFC107] mb-3 flex justify-center">
                  <Icon name={item.icon} size={32} />
                </div>
                <h3 className="font-bold text-[#101010] text-sm mb-1">{item.title}</h3>
                <p className="text-[#666] text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 px-4 border-b border-[#F0F0F0] bg-[#FAFAFA]">
        <div className="max-w-[88%] mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#FFC107] uppercase tracking-widest mb-2">Everything you need</p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[#101010]">Built for Tamil weddings</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: 'list' as IconName, title: 'Moi Register',    desc: 'Record every guest gift with name, amount and payment mode instantly.' },
              { icon: 'wallet' as IconName, title: 'UPI Payments',    desc: 'Guests pay directly to your UPI — QR code shown after submission.' },
              { icon: 'map' as IconName, title: 'Venue Map',       desc: 'Interactive map shown on every event page so guests find the venue.' },
              { icon: 'photo' as IconName, title: 'Cover Photo',     desc: 'Upload a beautiful cover photo for your event listing.' },
              { icon: 'dashboard' as IconName, title: 'Live Dashboard',  desc: 'Real-time totals, guest count and breakdown by relation.' },
              { icon: 'download' as IconName, title: 'Export CSV',      desc: 'Download all entries as a spreadsheet anytime.' },
            ].map((f) => (
              <div key={f.title} className="bg-white border border-[#E8E8E8] rounded-2xl p-5 hover:border-[#FFC107] hover:shadow-md transition-all">
                <div className="text-3xl mb-3 text-tn-gold">
                  <Icon name={f.icon} size={28} />
                </div>
                <h3 className="font-bold text-[#101010] text-sm mb-1">{f.title}</h3>
                <p className="text-[#666] text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 px-4 border-b border-[#F0F0F0] bg-white">
        <div className="max-w-[88%] mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#FFC107] uppercase tracking-widest mb-3">What people say</p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[#101010]">Testimonials</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Arumugam',
                role: 'Event Organizer',
                testimonial: 'MoiApp made tracking wedding gifts incredibly easy. The dashboard is simple and the CSV export feature saved us hours of manual work. Highly recommended!',
                rating: 5
              },
              {
                name: 'Esakkiammal',
                role: 'Bride',
                testimonial: 'We were worried about managing moi records during our wedding. MoiApp handled everything perfectly. Our guests found it easy to use and we could track everything in real-time.',
                rating: 5
              },
              {
                name: 'Pugazh Venthan',
                role: 'Event Organizer',
                testimonial: 'The UPI integration is brilliant! Guests could pay directly and we received all payments instantly. The platform is secure and made for Tamil weddings. Perfect solution!',
                rating: 5
              },
            ].map((testimonial) => (
              <div key={testimonial.name} className="bg-[#FFFCF5] border border-[#FFE082] rounded-2xl p-6 hover:shadow-lg transition-all">
                <div className="flex items-center gap-1 mb-4 text-[#FFC107]">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Icon key={i} name="star" size={16} />
                  ))}
                </div>
                
                <p className="text-[#333] text-sm leading-relaxed mb-6 italic">
                  &quot;{testimonial.testimonial}&quot;
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-[#FFE082]">
                  <div className="w-12 h-12 rounded-full bg-[#FFC107]/20 flex items-center justify-center text-[#B8860B] font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-[#101010] text-sm">{testimonial.name}</p>
                    <p className="text-[#666] text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent events strip ── */}
      {events.length > 0 && (
        <section className="py-16 px-4 border-b border-[#F0F0F0] bg-white">
          <div className="max-w-[88%] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-bold text-[#FFC107] uppercase tracking-widest mb-1">Live on MoiApp</p>
                <h2 className="text-2xl font-extrabold text-[#101010]">Upcoming Weddings</h2>
              </div>
              <Link href="/events" className="text-sm font-semibold text-[#FFC107] hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcoming.slice(0, 3).map((ev) => (
                <Link key={ev.id} href={`/e/${ev.slug}`} className="group block bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden hover:border-[#FFC107] hover:shadow-lg transition-all">
                  <div className="relative h-40 bg-[#FFFCF5] overflow-hidden">
                    {ev.cover_photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ev.cover_photo} alt="cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#B8860B]">
                        <Icon name="wedding" size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <p className="font-bold text-sm">{ev.bride_name} &amp; {ev.groom_name}</p>
                      <p className="text-xs text-white/75">{new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[#666]">
                        <Icon name="users" size={14} />
                        <span>{ev.guest_count || 0} guests registered</span>
                      </div>
                    <span className="text-xs font-bold text-[#FFC107] group-hover:underline">Give Moi →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-[#FFF8E1] to-[#FFFCF5]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-5 text-[#B8860B]">
            <Icon name="venue" size={44} />
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#101010] mb-3">
            உங்கள் திருமணத்தை டிஜிட்டலாக நிர்வகிக்க இன்று தொடங்குங்கள்
          </h2>
          <p className="text-[#666] text-sm mb-8">Free · Simple · No technical knowledge needed</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/events" className="bg-[#FFC107] text-black px-8 py-3.5 rounded-xl font-bold hover:bg-[#E6AC00] transition-colors shadow-lg shadow-[#FFC107]/30">
              Browse Events
            </Link>
            <Link href="/register" className="border-2 border-[#E8E8E8] bg-white text-[#333] px-8 py-3.5 rounded-xl font-bold hover:border-[#FFC107] transition-colors">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#101010] text-white">
        <div className="max-w-[88%] mx-auto py-12">
          {/* Main footer content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand column */}
            <div className="md:col-span-1">
              <div className="mb-4">
                <span className="font-extrabold text-2xl">Moi<span className="text-[#FFC107]">App</span></span>
              </div>
              <p className="text-[#888] text-sm leading-relaxed mb-4">
                Track wedding gifts easily. Share with family. Made for Tamil weddings with love.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#666]">
                <Icon name="wedding" size={16} />
                <span>இணையவழி மொய் பதிவு</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-white text-sm mb-4 uppercase tracking-wider">Quick Links</h3>
              <ul className="space-y-2 text-sm text-[#888]">
                <li>
                  <Link href="/events" className="hover:text-[#FFC107] transition-colors inline-flex items-center gap-1">
                    <Icon name="calendar" size={14} /> Browse Events
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-[#FFC107] transition-colors inline-flex items-center gap-1">
                    <Icon name="plus" size={14} /> List Your Wedding
                  </Link>
                </li>
                {!authLoading && !user && (
                  <>
                    <li>
                      <button onClick={() => router.push('/login')} className="hover:text-[#FFC107] transition-colors inline-flex items-center gap-1">
                        <Icon name="login" size={14} /> Sign In
                      </button>
                    </li>
                    <li>
                      <button onClick={() => router.push('/register')} className="hover:text-[#FFC107] transition-colors inline-flex items-center gap-1">
                        <Icon name="user" size={14} /> Create Account
                      </button>
                    </li>
                  </>
                )}
                {!authLoading && user && (
                  <li>
                    <button onClick={() => router.push('/dashboard')} className="hover:text-[#FFC107] transition-colors inline-flex items-center gap-1">
                      <Icon name="dashboard" size={14} /> Dashboard
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Features */}
            <div>
              <h3 className="font-bold text-white text-sm mb-4 uppercase tracking-wider">Features</h3>
              <ul className="space-y-2 text-sm text-[#888]">
                <li className="flex items-center gap-2">
                  <Icon name="check" size={14} className="text-[#FFC107]" />
                  <span>Moi Gift Tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check" size={14} className="text-[#FFC107]" />
                  <span>UPI Payments</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check" size={14} className="text-[#FFC107]" />
                  <span>Live Dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check" size={14} className="text-[#FFC107]" />
                  <span>Export to CSV</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check" size={14} className="text-[#FFC107]" />
                  <span>Venue Maps</span>
                </li>
              </ul>
            </div>

            {/* Support & Info */}
            <div>
              <h3 className="font-bold text-white text-sm mb-4 uppercase tracking-wider">Support</h3>
              <ul className="space-y-2 text-sm text-[#888]">
                <li>
                  <a href="/help-center" className="hover:text-[#FFC107] transition-colors">Help Center</a>
                </li>
                <li>
                  <a href="/privacy-policy" className="hover:text-[#FFC107] transition-colors">Privacy Policy</a>
                </li>
                <li>
                  <a href="/terms-of-service" className="hover:text-[#FFC107] transition-colors">Terms of Service</a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FFC107] transition-colors">Contact Us</a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FFC107] transition-colors">FAQs</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-[#222] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#666] text-xs text-center md:text-left">
              © {new Date().getFullYear()} MoiApp · Made with <span className="text-red-500">❤️</span> for Tamil weddings
            </p>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-[#666]">
                <Icon name="lock" size={14} className="text-[#FFC107]" />
                <span>Secure & Free</span>
              </div>
              <div className="w-px h-4 bg-[#333]" />
              <div className="flex items-center gap-2 text-xs text-[#666]">
                <Icon name="check" size={14} className="text-[#FFC107]" />
                <span>100% Free Forever</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
