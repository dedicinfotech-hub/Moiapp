'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { eventsApi, Event } from '@/lib/api';

export default function HomePage() {
  const [latestEvent, setLatestEvent] = useState<Event | null>(null);

  useEffect(() => {
    eventsApi.listPublic()
      .then((evs) => {
        if (evs.length > 0) {
          // Pick the soonest upcoming event, or most recent if all past
          const sorted = [...evs].sort(
            (a, b) => new Date(a.wedding_date).getTime() - new Date(b.wedding_date).getTime()
          );
          const upcoming = sorted.find((e) => new Date(e.wedding_date) >= new Date());
          setLatestEvent(upcoming ?? sorted[sorted.length - 1]);
        }
      })
      .catch(() => {}); // silently fail — hero falls back to placeholder
  }, []);

  return (
    <div className="bg-white text-[#101010]">

      {/* ── Hero ── */}
      <section className="border-b border-[#E8E8E8] py-16 px-4">
        <div className="max-w-[80%] mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 border border-[#FFC107] bg-[#FFFCF5] px-3 py-1.5 rounded-full text-sm font-semibold text-[#FFC107] mb-5">
              <span>💍</span> Tamil Wedding Gift Tracker
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#101010] leading-tight mb-4">
              Give <span className="text-[#FFC107]">Moi</span> to Your<br />Loved Ones
            </h1>
            <p className="text-[#444444] text-lg mb-2">
              Browse weddings, give moi online, and let the couple track every gift effortlessly.
            </p>
            <p className="text-[#666666] text-sm mb-8">
              திருமண மொய் — எளிதாக கொடுங்கள், எளிதாக track பண்ணுங்கள்
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/events" className="bg-[#FFC107] text-[#000000] px-7 py-3 rounded-lg font-semibold text-base hover:bg-[#E6AC00] transition-colors text-center">
                Browse Weddings
              </Link>
              <Link href="/register" className="border border-[#E8E8E8] text-[#222222] px-7 py-3 rounded-lg font-semibold text-base hover:border-[#FFC107] transition-colors text-center">
                List Your Wedding
              </Link>
            </div>
          </div>

          {/* Live event card */}
          <div className="flex-1 max-w-sm w-full">
            {latestEvent ? (
              <div className="bg-[#FFFCF5] border border-[#FFE082] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💍</span>
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Live</span>
                </div>
                <h3 className="font-bold text-[#101010] text-lg mb-1">
                  {latestEvent.bride_name} &amp; {latestEvent.groom_name}
                </h3>
                <p className="text-[#666666] text-sm mb-1">
                  {new Date(latestEvent.wedding_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {latestEvent.venue && (
                  <p className="text-[#999] text-xs mb-4">📍 {latestEvent.venue}</p>
                )}
                <div className="flex justify-start gap-6 mb-5">
                  <div>
                    <p className="text-xl font-bold text-[#101010]">
                      ₹{Number(latestEvent.total_moi || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-[#666666]">Total Moi</p>
                  </div>
                  <div className="w-px bg-[#FFE082]" />
                  <div>
                    <p className="text-xl font-bold text-[#101010]">{latestEvent.guest_count || 0}</p>
                    <p className="text-xs text-[#666666]">Guests</p>
                  </div>
                </div>
                <Link
                  href={`/e/${latestEvent.slug}`}
                  className="block w-full bg-[#FFC107] text-[#000000] py-2.5 rounded-lg font-semibold text-sm text-center hover:bg-[#E6AC00] transition-colors"
                >
                  Give Moi Now →
                </Link>
              </div>
            ) : (
              /* Placeholder while loading or no events */
              <div className="bg-[#FFFCF5] border border-[#FFE082] rounded-2xl p-6 text-center animate-pulse">
                <div className="text-6xl mb-4">💍</div>
                <div className="h-5 bg-[#FFE082] rounded w-3/4 mx-auto mb-2" />
                <div className="h-3 bg-[#FFE082] rounded w-1/2 mx-auto mb-4" />
                <div className="h-10 bg-[#FFC107] rounded-lg opacity-50" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-14 px-4 border-b border-[#E8E8E8]">
        <div className="max-w-[80%] mx-auto">
          <p className="text-xs font-semibold text-[#666666] uppercase tracking-widest mb-10">How it works</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold text-[#FFC107] uppercase tracking-widest mb-5">For Guests</p>
              <div className="space-y-5">
                {[
                  { n: '1', t: 'Browse Events', d: 'Find the wedding from the events listing page.' },
                  { n: '2', t: 'View Details',  d: 'See date, venue, couple details and photos.' },
                  { n: '3', t: 'Give Moi',      d: 'Enter your name, amount and pay via UPI or cash.' },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FFC107] flex items-center justify-center text-[#000000] font-bold text-sm shrink-0 mt-0.5">{s.n}</div>
                    <div>
                      <p className="font-semibold text-[#101010]">{s.t}</p>
                      <p className="text-[#666666] text-sm mt-0.5">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/events" className="mt-6 inline-block bg-[#FFC107] text-[#000000] px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#E6AC00] transition-colors">
                Browse Events →
              </Link>
            </div>
            <div>
              <p className="text-xs font-bold text-[#666666] uppercase tracking-widest mb-5">For Couples / Organizers</p>
              <div className="space-y-5">
                {[
                  { n: '1', t: 'Create Account', d: 'Register and create your wedding event in minutes.' },
                  { n: '2', t: 'Share the Link', d: 'Share with family — they give moi directly, no login needed.' },
                  { n: '3', t: 'Track & Export', d: 'Dashboard shows who paid, totals, and CSV export.' },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#F5F5F5] border border-[#E8E8E8] flex items-center justify-center text-[#444444] font-bold text-sm shrink-0 mt-0.5">{s.n}</div>
                    <div>
                      <p className="font-semibold text-[#101010]">{s.t}</p>
                      <p className="text-[#666666] text-sm mt-0.5">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register" className="mt-6 inline-block border border-[#E8E8E8] text-[#222222] px-5 py-2.5 rounded-lg font-semibold text-sm hover:border-[#FFC107] transition-colors">
                List Your Wedding →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-14 px-4 border-b border-[#E8E8E8]">
        <div className="max-w-[80%] mx-auto">
          <p className="text-xs font-semibold text-[#666666] uppercase tracking-widest mb-10">Features</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: '📋', title: 'Moi Register',   desc: 'Record every guest gift instantly with name, amount and payment mode.' },
              { icon: '📊', title: 'Live Dashboard', desc: 'Real-time totals, guest count and breakdown by relation.' },
              { icon: '🔗', title: 'Share Link',     desc: 'Guests give moi without any login or app install.' },
              { icon: '📱', title: 'UPI Payment',    desc: 'Pay directly to the couple via UPI — instant and traceable.' },
              { icon: '📥', title: 'Export CSV',     desc: 'Download all entries as a spreadsheet anytime.' },
              { icon: '✏️', title: 'Manual Entry',   desc: 'Admin can add cash entries directly from the dashboard.' },
            ].map((f) => (
              <div key={f.title} className="border border-[#E8E8E8] rounded-xl p-5 hover:border-[#FFC107] transition-colors">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-[#101010] text-sm mb-1">{f.title}</h3>
                <p className="text-[#666666] text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-[#101010] mb-2">உங்கள் திருமணத்தை இப்போதே பதிவு செய்யுங்கள்</h2>
          <p className="text-[#666666] text-sm mb-8">Free · Simple · No technical knowledge needed</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/events" className="bg-[#FFC107] text-[#000000] px-8 py-3 rounded-lg font-semibold hover:bg-[#E6AC00] transition-colors">
              Browse Events
            </Link>
            <Link href="/register" className="border border-[#E8E8E8] text-[#222222] px-8 py-3 rounded-lg font-semibold hover:border-[#FFC107] transition-colors">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white lg:bg-[#f2f1f6] border-t border-[#E8E8E8]">
        <div className="hidden max-w-[80%] py-12 mx-auto lg:flex flex-col gap-8">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-extrabold text-xl text-[#101010]">Moi<span className="text-[#FFC107]">App</span></span>
              <p className="max-w-[300px] text-[#444444] text-sm mt-2">Track wedding gifts easily. Share with family. Export anytime.</p>
            </div>
          </div>
          <div className="border-t border-[#e0e0e0] pt-5 flex justify-between items-center">
            <p className="text-[#444444] text-sm">© {new Date().getFullYear()} MoiApp. Made with ❤️ for Tamil weddings.</p>
            <div className="flex gap-5 text-sm text-[#444444]">
              <Link href="/events" className="hover:text-[#101010]">Browse Events</Link>
              <Link href="/register" className="hover:text-[#101010]">List Event</Link>
              <Link href="/login" className="hover:text-[#101010]">Sign In</Link>
            </div>
          </div>
        </div>
        <div className="lg:hidden py-6 px-4 text-center text-sm text-[#666666]">
          © {new Date().getFullYear()} MoiApp — Made with ❤️ for Tamil weddings
        </div>
      </footer>
    </div>
  );
}
