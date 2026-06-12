'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="border-b border-[#E8E8E8] w-full h-[56px] lg:h-[72px] flex items-center bg-white sticky top-0 z-50">
        <div className="w-full flex justify-between items-center px-4 lg:px-0 lg:max-w-[80%] mx-auto">

          {/* Logo */}
          <Link href="/" className="shrink-0" onClick={closeMobile}>
            <span className="font-extrabold text-xl text-[#101010]">
              Moi<span className="text-[#FFC107]">App</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center text-[#101010] gap-1">
            <Link href="/events" className="text-sm font-medium text-[#444444] hover:text-[#101010] px-3 py-1.5 transition-colors">
              Browse Events
            </Link>

            {user ? (
               <>
                 {/* <Link href="/dashboard" className="text-sm font-medium text-[#444444] hover:text-[#101010] px-3 py-1.5 transition-colors">
                   Dashboard
                 </Link> */}
                 {/* <Link href="/events/new" className="text-sm font-medium px-3 py-1.5 text-[#444444] hover:text-[#101010] transition-colors">
                   List Event
                 </Link> */}
                 {/* <Link href="/dashboard?module=events" className="text-sm font-medium px-3 py-1.5 text-[#444444] hover:text-[#101010] transition-colors">
                   Import
                 </Link> */}

                 {/* User avatar with dropdown */}
                 <div className="relative ml-1" ref={dropRef}>
                  <button
                    onClick={() => setDropOpen((v) => !v)}
                    className="flex items-center gap-1.5 focus:outline-none"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#FFC107] flex items-center justify-center text-[#101010] font-bold text-sm select-none">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 text-[#666666] transition-transform ${dropOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {dropOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E8E8E8] rounded-xl shadow-lg py-1 z-50">
                      <div className="px-4 py-3 border-b border-[#F5F5F5]">
                        <p className="font-semibold text-[#101010] text-sm truncate">{user.name}</p>
                        <p className="text-xs text-[#999] truncate">{user.email}</p>
                      </div>
                      <Link href="/dashboard" onClick={() => setDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#444444] hover:bg-[#fafafa] hover:text-[#101010] transition-colors">
                        <span>📊</span> Dashboard
                      </Link>
                      <Link href="/dashboard?module=settings" onClick={() => setDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#444444] hover:bg-[#fafafa] hover:text-[#101010] transition-colors">
                        <span>👤</span> My Profile
                      </Link>
                      <Link href="/events/new" onClick={() => setDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#444444] hover:bg-[#fafafa] hover:text-[#101010] transition-colors">
                        <span>➕</span> New Event
                      </Link>
                      <div className="border-t border-[#F5F5F5] mt-1">
                        <button
                          onClick={() => { setDropOpen(false); logout(); router.push('/'); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <span>🚪</span> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/register" className="text-sm font-medium px-3 py-1.5 text-[#444444] hover:text-[#101010] transition-colors">
                  List Event
                </Link>
                <button
                  className="text-sm cursor-pointer font-semibold bg-[#FFC107] rounded-lg px-4 py-2 text-[#000000] hover:bg-[#E6AC00] transition-colors ml-1"
                  onClick={() => router.push('/login')}
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          {/* Mobile: Sign In + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {!user && (
              <button
                className="text-sm font-semibold bg-[#FFC107] rounded-lg px-3 py-1.5 text-[#000000] hover:bg-[#E6AC00] transition-colors"
                onClick={() => router.push('/login')}
              >
                Sign In
              </button>
            )}
            {user && (
              <div className="w-8 h-8 rounded-full bg-[#FFC107] flex items-center justify-center text-[#101010] font-bold text-sm select-none">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-1.5 rounded-lg text-[#444444] hover:bg-[#F5F5F5] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[56px] z-40 bg-white border-t border-[#E8E8E8] flex flex-col">
          <nav className="flex flex-col px-4 py-4 gap-1">
            <Link href="/events" onClick={closeMobile} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[#444444] hover:bg-[#F5F5F5] hover:text-[#101010] transition-colors">
              <span>🎉</span> Browse Events
            </Link>

            {user ? (
               <>
                 <Link href="/dashboard" onClick={closeMobile} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[#444444] hover:bg-[#F5F5F5] hover:text-[#101010] transition-colors">
                   <span>📊</span> Dashboard
                 </Link>
                 <Link href="/events/new" onClick={closeMobile} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[#444444] hover:bg-[#F5F5F5] hover:text-[#101010] transition-colors">
                   <span>➕</span> List Event
                 </Link>
                 <Link href="/dashboard?module=events" onClick={closeMobile} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[#444444] hover:bg-[#F5F5F5] hover:text-[#101010] transition-colors">
                   <span>📥</span> Import
                 </Link>
                 <div className="border-t border-[#F5F5F5] mt-2 pt-2">
                  <div className="px-3 py-2 mb-1">
                    <p className="font-semibold text-[#101010] text-sm">{user.name}</p>
                    <p className="text-xs text-[#999]">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { closeMobile(); logout(); router.push('/'); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/register" onClick={closeMobile} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[#444444] hover:bg-[#F5F5F5] hover:text-[#101010] transition-colors">
                  <span>💍</span> List Your Wedding
                </Link>
                <div className="mt-3 px-3">
                  <button
                    className="w-full text-sm font-semibold bg-[#FFC107] rounded-xl px-4 py-3 text-[#000000] hover:bg-[#E6AC00] transition-colors"
                    onClick={() => { closeMobile(); router.push('/login'); }}
                  >
                    Sign In
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
