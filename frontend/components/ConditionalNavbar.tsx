'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type MouseEvent } from 'react';
import Navbar from './Navbar';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '@/lib/auth';
import { buildLoginUrl } from '@/lib/authNavigation';
import { useTranslation } from '@/lib/i18n';

// Deferred mount guard — used only for the top Navbar which renders
// auth-dependent content (user name, avatar). Without this guard the
// server-rendered HTML (no user) would differ from the client HTML
// (logged-in user), causing a React hydration mismatch.
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isEventSubPage(pathname: string): boolean {
  // /events/[slug] — top-level event page: show bottom nav
  // /events/[slug]/anything — sub-pages with their own shell: hide bottom nav
  const parts = pathname.split('/').filter(Boolean);
  // parts: ['events', '<slug>', '<subpage>'] → length 3 means sub-page
  return parts[0] === 'events' && parts.length >= 3;
}

// ── Top Navbar ────────────────────────────────────────────────────────────────
export default function ConditionalNavbar() {
  const mounted = useMounted();
  const rawPathname = usePathname();
  const pathname = rawPathname;

  // Hold until mounted — avoids auth-state hydration mismatch
  if (!mounted) return null;

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return null;
  if (pathname.startsWith('/e/') || pathname.startsWith('/g/')) return null;
  // Hide on all event sub-pages (they have their own header in HostEntryShell)
  if (isEventSubPage(pathname)) return null;
  // Hide on the top-level event slug page too (EventPageClient has its own header)
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'events' && parts.length === 2 && parts[1] !== 'new' && parts[1] !== 'choose-type' && parts[1] !== 'create') return null;

  return <Navbar />;
}

// ── Bottom Navigation ─────────────────────────────────────────────────────────
// No mount guard — bottom nav items are static links, identical on server and
// client, so there is no hydration mismatch. This means the nav is visible
// immediately on first paint with no flash-of-missing-content.
export function ConditionalBottomNav() {
  const rawPathname = usePathname();
  const pathname = rawPathname;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const requireAuthNav = (href: string) => {
    if (authLoading || user) return undefined;
    return (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      router.push(buildLoginUrl(href));
    };
  };

  // ── Pages that manage their own bottom area — hide global nav ──────────────

  // Dashboard has sidebar shell
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return null;

  // Public event/guest pages
  if (pathname.startsWith('/e/') || pathname.startsWith('/g/')) return null;

  // Auth, onboarding & contact
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/contact' ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/otp-verification') ||
    pathname.startsWith('/profile-setup') ||
    pathname === '/splash'
  ) return null;

  // Event creation flows
  if (pathname.startsWith('/events/create') || pathname.startsWith('/events/new')) return null;

  // Event sub-pages that use HostEntryShell or EventLayout (own nav/shell)
  if (isEventSubPage(pathname)) return null;

  // Top-level event slug page (EventPageClient has full-screen layout)
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'events' && parts.length === 2 && parts[1] !== 'choose-type') return null;

  // ── Show everywhere else ───────────────────────────────────────────────────
  return (
    <BottomNavigation
      items={[
        { id: 'home',    label: t('home'),      href: user ? '/dashboard' : '/', icon: 'dashboard' },
        {
          id: 'events',
          label: t('modEvents'),
          href: '/dashboard?module=events',
          icon: 'wedding',
          onClick: requireAuthNav('/dashboard?module=events'),
        },
        {
          id: 'create',
          label: t('create'),
          href: '/dashboard?module=events',
          icon: 'plus',
          onClick: requireAuthNav('/dashboard?module=events'),
        },
        {
          id: 'entries',
          label: t('modMoiNotebook'),
          href: '/dashboard?module=moi-notebook',
          icon: 'list',
          onClick: requireAuthNav('/dashboard?module=moi-notebook'),
        },
      ]}
    />
  );
}
