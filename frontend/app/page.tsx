'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { eventsApi, Event } from '@/lib/api';

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    eventsApi.listPublic()
      .then((evs) => setEvents(evs))
      .catch(() => {})
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
            <div className="inline-flex items-center gap-2 bg-[#FFC107]/15 border border-[#FFC107]/40 text-[#B8860B] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <span>💍</span> Tamil Wedding Gift Tracker
            </div>

            <h1 className="text-4xl lg:text-6xl font-extrabold text-[#101010] leading-[1.1] mb-5">
              Celebrate with<br />
              <span className="text-[#FFC107]">Moi</span> — the Tamil<br />
              way of gifting
            </h1>

            <p className="text-[#555] text-lg leading-relaxed mb-3 max-w-lg mx-auto lg:mx-0">
              Browse weddings, give moi online, and let the couple track every gift — all in one place.
            </p>
            <p className="text-[#888] text-sm mb-8 max-w-md mx-auto lg:mx-0">
              திருமண மொய் — எளிதாக கொடுங்கள், எளிதாக track பண்ணுங்கள்
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/events"
                className="bg-[#FFC107] text-black px-8 py-3.5 rounded-xl font-bold text-base hover:bg-[#E6AC00] transition-colors shadow-lg shadow-[#FFC107]/30 text-center">
                Browse Weddings →
              </Link>
              <Link href="/register"
                className="border-2 border-[#E8E8E8] text-[#333] px-8 py-3.5 rounded-xl font-semibold text-base hover:border-[#FFC107] transition-colors text-center">
                List Your Wedding
              </Link>
            </div>

            {/* Live stats */}
            {loaded && events.length > 0 && (
              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
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
                      <div className="text-6xl mb-1">💍</div>
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
                      <span>📍</span> {featuredEvent.venue}
                    </p>
                  )}
                  <div className="flex gap-4 mb-4">
                    <div>
                      <p className="text-lg font-extrabold text-[#101010]">{featuredEvent.guest_count || 0}</p>
                      <p className="text-[10px] text-[#888]">Guests registered</p>
                    </div>
                  </div>
                  <Link href={`/e/${featuredEvent.slug}`}
                    className="block w-full bg-[#FFC107] text-black py-2.5 rounded-xl font-bold text-sm text-center hover:bg-[#E6AC00] transition-colors">
                    Give Moi Now →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#F0E8C8] animate-pulse">
                <div className="h-44 bg-[#FFF8E1]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#FFE082] rounded w-3/4" />
                  <div className="h-3 bg-[#FFE082] rounded w-1/2" />
                  <div className="h-10 bg-[#FFC107]/40 rounded-xl" />
                </div>
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
      <section className="py-16 px-4 border-b border-[#F0F0F0] bg-white">
        <div className="max-w-[88%] mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#FFC107] uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[#101010]">How MoiApp works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Guest flow */}
            <div className="bg-[#FFFCF5] border border-[#FFE082] rounded-2xl p-7">
              <p className="text-xs font-bold text-[#FFC107] uppercase tracking-widest mb-5">For Guests 👥</p>
              <div className="space-y-5">
                {[
                  { n: '1', t: 'Browse Events',  d: 'Find the wedding from the events listing page.' },
                  { n: '2', t: 'View Details',   d: 'See date, venue, couple details, photos and map.' },
                  { n: '3', t: 'Give Moi',       d: 'Enter your name, amount and pay via UPI or cash.' },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#FFC107] flex items-center justify-center text-black font-extrabold text-sm shrink-0">{s.n}</div>
                    <div>
                      <p className="font-bold text-[#101010]">{s.t}</p>
                      <p className="text-[#666] text-sm mt-0.5">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/events" className="mt-6 inline-flex items-center gap-2 bg-[#FFC107] text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#E6AC00] transition-colors">
                Browse Events →
              </Link>
            </div>

            {/* Organizer flow */}
            <div className="bg-[#fafafa] border border-[#E8E8E8] rounded-2xl p-7">
              <p className="text-xs font-bold text-[#666] uppercase tracking-widest mb-5">For Couples / Organizers 💒</p>
              <div className="space-y-5">
                {[
                  { n: '1', t: 'Create Account',  d: 'Register and create your wedding event in minutes.' },
                  { n: '2', t: 'Upload & Share',  d: 'Add cover photo, share the link — no login needed for guests.' },
                  { n: '3', t: 'Track & Export',  d: 'Dashboard shows who paid, totals, and CSV export.' },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#F5F5F5] border-2 border-[#E8E8E8] flex items-center justify-center text-[#444] font-extrabold text-sm shrink-0">{s.n}</div>
                    <div>
                      <p className="font-bold text-[#101010]">{s.t}</p>
                      <p className="text-[#666] text-sm mt-0.5">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register" className="mt-6 inline-flex items-center gap-2 border-2 border-[#E8E8E8] text-[#333] px-5 py-2.5 rounded-xl font-bold text-sm hover:border-[#FFC107] transition-colors">
                List Your Wedding →
              </Link>
            </div>
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
              { icon: '📋', title: 'Moi Register',    desc: 'Record every guest gift with name, amount and payment mode instantly.' },
              { icon: '📱', title: 'UPI Payments',    desc: 'Guests pay directly to your UPI — QR code shown after submission.' },
              { icon: '🗺️', title: 'Venue Map',       desc: 'Interactive map shown on every event page so guests find the venue.' },
              { icon: '📸', title: 'Cover Photo',     desc: 'Upload a beautiful cover photo for your event listing.' },
              { icon: '📊', title: 'Live Dashboard',  desc: 'Real-time totals, guest count and breakdown by relation.' },
              { icon: '📥', title: 'Export CSV',      desc: 'Download all entries as a spreadsheet anytime.' },
            ].map((f) => (
              <div key={f.title} className="bg-white border border-[#E8E8E8] rounded-2xl p-5 hover:border-[#FFC107] hover:shadow-md transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-[#101010] text-sm mb-1">{f.title}</h3>
                <p className="text-[#666] text-xs leading-relaxed">{f.desc}</p>
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
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl">💍</span>
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
                      <span>👥</span>
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
          <div className="text-5xl mb-5">💒</div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#101010] mb-3">
            உங்கள் திருமணத்தை இப்போதே பதிவு செய்யுங்கள்
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
        <div className="max-w-[88%] mx-auto py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-extrabold text-xl">Moi<span className="text-[#FFC107]">App</span></span>
            <p className="text-[#888] text-xs mt-1">Track wedding gifts easily. Share with family.</p>
          </div>
          <div className="flex gap-6 text-sm text-[#888]">
            <Link href="/events"   className="hover:text-white transition-colors">Browse Events</Link>
            <Link href="/register" className="hover:text-white transition-colors">List Event</Link>
            <Link href="/login"    className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <p className="text-[#555] text-xs">© {new Date().getFullYear()} MoiApp · Made with ❤️ for Tamil weddings</p>
        </div>
      </footer>
    </div>
  );
}
