'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import LogoImage from '@/components/ui/LogoImage';
import { useTranslation } from '@/lib/i18n';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Floating navbar wrapper — full width but not sticky bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-2 pt-3 pointer-events-none">
        {/* The floating glass pill */}
        <nav
            className={`
              pointer-events-auto
              flex items-center justify-between
              w-full max-w-7xl
              px-3 py-2 md:px-4 md:py-2.5
              rounded-2xl
              border border-tn-yellow/30
              transition-all duration-300
              overflow-visible
              shadow-[0_0_20px_rgba(255,193,7,0.15)]
              ${scrolled
                ? 'bg-white/70 backdrop-blur-xl shadow-2xl border-tn-yellow/40'
                : 'bg-white/50 backdrop-blur-lg shadow-lg border-tn-yellow/25'
              }
            `}
          >
          {/* Logo */}
          <Link href="/" onClick={closeMobile} className="flex items-center group flex-shrink-0 min-w-0 max-w-[50%] sm:max-w-none">
            <LogoImage variant="navbar" className="transition-transform duration-200 group-hover:scale-105" />
          </Link>

          {/* Desktop nav links — center */}
          <div className="hidden md:flex items-center gap-0.5">
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-tn-muted hover:text-tn-text rounded-xl hover:bg-white/60 transition-all duration-200"
            >
              {t('listEvent')}
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Desktop: user menu or auth buttons */}
            {user ? (
              <div className="hidden md:block relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-white/60 transition-all duration-200"
                  aria-label="User menu"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-tn-yellow to-tn-yellow-2 flex items-center justify-center text-tn-text font-bold text-xs shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-tn-muted max-w-[80px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-tn-subtle transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl shadow-black/10 py-2 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-tn-border">
                      <p className="font-semibold text-tn-text text-sm truncate">{user.name}</p>
                      <p className="text-xs text-tn-muted truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/dashboard" onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-tn-muted hover:bg-tn-yellow-bg hover:text-tn-text transition-colors">
                        <Icon name="dashboard" size={15} /> {t('modDashboard')}
                      </Link>
                      <Link href="/dashboard?module=profile" onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-tn-muted hover:bg-tn-yellow-bg hover:text-tn-text transition-colors">
                        <Icon name="users" size={15} /> {t('myProfile')}
                      </Link>
                      <Link href="/events/new" onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-tn-muted hover:bg-tn-yellow-bg hover:text-tn-text transition-colors">
                        <Icon name="plus" size={15} /> {t('newEvent')}
                      </Link>
                    </div>
                    <div className="border-t border-tn-border pt-1">
                      <button
                        onClick={() => { setDropOpen(false); logout(); router.push('/'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-tn-error hover:bg-tn-error-bg transition-colors"
                      >
                        <Icon name="lock" size={15} /> {t('signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="hidden md:flex text-sm font-semibold bg-tn-yellow hover:bg-tn-yellow-2 text-tn-text rounded-xl px-4 py-2 transition-all duration-200 shadow-sm shadow-tn-yellow/30 hover:shadow-md hover:shadow-tn-yellow/30"
                onClick={() => router.push('/login')}
              >
                {t('signIn')}
              </button>
            )}

            {/* Mobile: user avatar */}
            {user && (
              <div className="flex md:hidden w-7 h-7 rounded-full bg-gradient-to-br from-tn-yellow to-tn-yellow-2 items-center justify-center text-tn-text font-bold text-xs shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Mobile: Sign In */}
            {!user && (
              <button
                className="flex md:hidden text-xs font-semibold bg-tn-yellow hover:bg-tn-yellow-2 text-tn-text rounded-xl px-3 py-1.5 transition-colors shadow-sm"
                onClick={() => router.push('/login')}
              >
                {t('signIn')}
              </button>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex md:hidden p-2 rounded-xl text-tn-muted hover:bg-white/60 transition-all duration-200"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Spacer so page content doesn't hide under the floating nav */}
      <div className="h-[68px] lg:h-[64px]" />

      {/* Mobile drawer — glass style */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-4 top-[76px] lg:top-[72px] z-40 bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
          <nav className="flex flex-col px-3 py-3 gap-1">
            {user ? (
              <>
                <Link href="/dashboard" onClick={closeMobile}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-tn-muted hover:bg-tn-yellow-bg hover:text-tn-text transition-colors">
                  <Icon name="dashboard" size={17} /> {t('modDashboard')}
                </Link>
                <Link href="/events/new" onClick={closeMobile}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-tn-muted hover:bg-tn-yellow-bg hover:text-tn-text transition-colors">
                  <Icon name="plus" size={17} /> {t('listEvent')}
                </Link>
                <Link href="/dashboard?module=events" onClick={closeMobile}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-tn-muted hover:bg-tn-yellow-bg hover:text-tn-text transition-colors">
                  <Icon name="upload" size={17} /> {t('import')}
                </Link>
                <div className="border-t border-tn-border mt-1 pt-1">
                  <div className="px-4 py-2.5">
                    <p className="font-semibold text-tn-text text-sm">{user.name}</p>
                    <p className="text-xs text-tn-muted">{user.email}</p>
                  </div>
                  <button
                      onClick={() => { closeMobile(); logout(); router.push('/'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-tn-error hover:bg-tn-error-bg transition-colors"
                    >
                    <Icon name="lock" size={17} /> {t('signOut')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/register" onClick={closeMobile}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-tn-muted hover:bg-tn-yellow-bg hover:text-tn-text transition-colors">
                  <Icon name="wedding" size={17} /> {t('listYourWedding')}
                </Link>
                <div className="px-3 pb-2 pt-1">
                  <button
                    className="w-full text-sm font-semibold bg-tn-yellow hover:bg-tn-yellow-2 rounded-xl px-4 py-3 text-tn-text transition-colors shadow-sm"
                    onClick={() => { closeMobile(); router.push('/login'); }}
                  >
                    {t('signIn')}
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
