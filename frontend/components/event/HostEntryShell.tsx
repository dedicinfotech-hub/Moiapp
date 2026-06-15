'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import Icon, { type IconName } from '@/components/ui/Icon';
import { CreateFlowHeader } from '@/components/event/EventLayout';
import { useAuth } from '@/lib/auth';
import { useFeatures } from '@/lib/features';
import { getAppSidebarSections } from '@/lib/navigation';
import { useEffect, useState } from 'react';

export type HostNavTab = 'dashboard' | 'entries' | 'voice' | 'gift' | 'reports' | 'settings';

interface HostEntryShellProps {
  slug: string;
  title: string;
  subtitle?: string;
  activeTab?: HostNavTab;
  onBack?: () => void;
  children: React.ReactNode;
}

export default function HostEntryShell({ slug, title, subtitle, activeTab, onBack, children }: HostEntryShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { isEnabled } = useFeatures();
  const isAdmin = user?.role === 'admin';
  const nav: { id: HostNavTab; label: string; href: string; icon: IconName }[] = [
    { id: 'dashboard', label: 'Dashboard', href: `/events/${slug}/dashboard`, icon: 'dashboard' },
    { id: 'entries', label: 'Moi Entries', href: `/events/${slug}/entries`, icon: 'list' },
    { id: 'voice', label: 'Voice Entry', href: `/events/${slug}/voice-entry`, icon: 'mic' },
    { id: 'gift', label: 'Gift Entry', href: `/events/${slug}/gift-entry`, icon: 'gift' },
    { id: 'reports', label: 'Reports', href: `/events/${slug}/reports`, icon: 'chart' },
    { id: 'settings', label: 'Settings', href: `/events/${slug}/moi-entry`, icon: 'settings' },
  ];

  const visibleNav = activeTab === 'voice'
    ? nav.filter((n) => ['dashboard', 'entries', 'voice', 'settings'].includes(n.id))
    : activeTab === 'gift'
    ? nav.filter((n) => ['dashboard', 'entries', 'gift', 'settings'].includes(n.id))
    : nav.filter((n) => ['dashboard', 'entries', 'reports', 'settings'].includes(n.id));

  const toggleSidebar = () => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) {
      setSidebarCollapsed((value) => !value);
    } else {
      setSideOpen((value) => !value);
    }
  };

  useEffect(() => {
    setSideOpen(false);
  }, [pathname]);

  return (
    <div className="h-screen flex overflow-hidden bg-[#F9FAFB]">
      {sideOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}
      <AppSidebar
        fixed
        isOpen={sideOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSideOpen(false)}
        adminBadge={isAdmin}
        user={user}
        onLogout={() => { logout(); router.push('/'); }}
        sections={getAppSidebarSections({
          isAdmin,
          isEnabled,
          activeModule: 'events',
        })}
      />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <CreateFlowHeader
          title={title}
          onBack={onBack}
          leftAction={(
            <button
              type="button"
              onClick={toggleSidebar}
              className="w-10 h-10 flex items-center justify-center text-[#1F2937]"
              aria-label={sidebarCollapsed ? 'Open menu' : 'Close menu'}
            >
              <Icon name="menu" size={22} />
            </button>
          )}
        />
        {subtitle && <p className="text-xs text-[#6B7280] text-center px-6 -mt-2 mb-2">{subtitle}</p>}
        <main className="flex-1 min-w-0 overflow-y-auto px-4 py-4 pb-28">{children}</main>
        {activeTab && (
          <nav className={`fixed bottom-0 left-0 right-0 h-[68px] bg-white border-t border-[#EBEBEB] flex items-center justify-around px-1 z-40 ${sidebarCollapsed ? 'lg:left-0' : 'lg:left-60'}`}>
            {visibleNav.map((item) => (
              <Link key={item.id} href={item.href} className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] ${activeTab === item.id ? 'text-[#4B218B]' : 'text-[#9CA3AF]'}`}>
                <Icon name={item.icon} size={20} />
                <span className={`text-[9px] ${activeTab === item.id ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
