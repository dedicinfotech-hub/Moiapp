'use client';

import BottomNavigation from './BottomNavigation';

export default function BottomNavWrapper() {
  return (
    <BottomNavigation
      items={[
        { id: 'home', label: 'Home', href: '/dashboard', icon: 'dashboard' },
        { id: 'events', label: 'Functions', href: '/events', icon: 'wedding' },
        { id: 'create', label: 'Create', href: '/events/choose-type', icon: 'plus' },
        { id: 'entries', label: 'Moi List', href: '/entries', icon: 'list' },
        // { id: 'settings', label: 'Settings', href: '/dashboard?module=settings', icon: 'settings' },
      ]}
    />
  );
}
