'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import BottomNavigation from './BottomNavigation';

// Render nothing until the component has mounted on the client.
// This prevents hydration mismatches caused by usePathname() returning a
// different value during static pre-render vs. the real browser URL.
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}

export default function ConditionalNavbar() {
  const mounted = useMounted();
  const pathname = usePathname();

  // During static pre-render (and first client frame before mount) render nothing.
  if (!mounted) return null;

  // Hide on dashboard and all its subpaths
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return null;
  }

  // Hide on event pages (they have their own header and bottom nav in EventLayout)
  // But show on /events and /events/new
  if (pathname.startsWith('/events/') && pathname !== '/events/new') {
    return null;
  }

  // Hide on guest and event public pages
  if (pathname.startsWith('/e/') || pathname.startsWith('/g/')) {
    return null;
  }

  return <Navbar />;
}

// Separate component for conditional bottom nav
export function ConditionalBottomNav() {
  const mounted = useMounted();
  const pathname = usePathname();

  // During static pre-render render nothing.
  if (!mounted) return null;

  // Hide on dashboard and all its subpaths
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return null;
  }

  // Hide on event pages (they have their own bottom nav in EventLayout)
  if (pathname.startsWith('/events/') && pathname !== '/events/new') {
    return null;
  }

  // Hide on guest and event public pages
  if (pathname.startsWith('/e/') || pathname.startsWith('/g/')) {
    return null;
  }

  return (
    <BottomNavigation
      items={[
        { id: 'home', label: 'Home', href: '/dashboard', icon: 'dashboard' },
        { id: 'events', label: 'Functions', href: '/events', icon: 'wedding' },
        { id: 'create', label: 'Create', href: '/events/choose-type', icon: 'plus' },
        { id: 'entries', label: 'Moi List', href: '/entries', icon: 'list' },
      ]}
    />
  );
}
