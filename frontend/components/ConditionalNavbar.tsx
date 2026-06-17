'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import BottomNavigation from './BottomNavigation';

// Routes where the global navbar should be hidden
// (these pages manage their own full-screen layout or event-specific header)
const HIDDEN_ROUTES = [
  '/dashboard',
  '/e/',
  '/g/',
];

export default function ConditionalNavbar() {
  const pathname = usePathname();

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
  const pathname = usePathname();

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
