'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

// Routes where the global navbar should be hidden
// (these pages manage their own full-screen layout)
const HIDDEN_ROUTES = ['/dashboard'];

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const hide = HIDDEN_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
  if (hide) return null;
  return <Navbar />;
}
