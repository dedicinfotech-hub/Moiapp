'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

// Routes where the global navbar should be hidden
// (these pages manage their own full-screen layout)
const HIDDEN_ROUTES = ['/dashboard'];

function getCleanRoute(pathname: string): string {
  const routes = ['/dashboard', '/events', '/login', '/register', '/e/'];
  for (const r of routes) {
    const idx = pathname.indexOf(r);
    if (idx !== -1) {
      return pathname.slice(idx);
    }
  }
  return pathname;
}

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const cleanPath = getCleanRoute(pathname);
  
  const hide = 
    HIDDEN_ROUTES.some((r) => cleanPath === r || cleanPath.startsWith(r + '/')) ||
    (cleanPath.startsWith('/events/') && cleanPath !== '/events/new');
    
  if (hide) return null;
  return <Navbar />;
}

