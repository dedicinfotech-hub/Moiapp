'use client';

import { usePathname, useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import { CreateFlowHeader } from '@/components/event/EventLayout';
import { useAuth } from '@/lib/auth';
import { useFeatures } from '@/lib/features';
import { getAppSidebarSections } from '@/lib/navigation';
import React, { useEffect, useState } from 'react';

export type HostNavTab = 'dashboard' | 'entries' | 'voice' | 'gift' | 'reports' | 'settings';

interface HostEntryShellProps {
  slug: string;
  title: string;
  subtitle?: string;
  activeTab?: HostNavTab;
  onBack?: () => void;
  children: React.ReactNode;
  sidebarOverride?: 'open' | 'closed' | null;
}

const isDesktopViewport = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(min-width: 1024px)').matches;
};

export default function HostEntryShell(props: HostEntryShellProps) {
  const { slug: _slug, title, subtitle, activeTab: _activeTab, onBack, children, sidebarOverride: sidebarOverrideProp } = props;
  const router = useRouter();
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOverride, setSidebarOverride] = useState<'open' | 'closed' | null>(sidebarOverrideProp ?? null);
  const { user, logout } = useAuth();
  const { isEnabled } = useFeatures();
  const isAdmin = user?.role === 'admin';

  const toggleSidebar = () => {
    if (isDesktopViewport()) {
      setSidebarCollapsed((value) => !value);
    } else {
      setSideOpen((value) => !value);
    }
  };

  useEffect(() => {
    setSidebarOverride(sidebarOverrideProp ?? null);
  }, [sidebarOverrideProp]);

  useEffect(() => {
    if (sidebarOverride === 'open') {
      setSideOpen(true);
    } else if (sidebarOverride === 'closed') {
      setSideOpen(false);
    }
  }, [pathname, sidebarOverride]);

  return (
    <div className="h-screen flex overflow-hidden bg-tn-light-alt">
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
              className="w-10 h-10 flex items-center justify-center text-tn-text"
              aria-label={sidebarCollapsed ? 'Open menu' : 'Close menu'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          )}
        />
        {subtitle && <p className="text-xs text-tn-muted text-center px-6 -mt-8 mb-2">{subtitle}</p>}
        <main className="flex-1 min-w-0 overflow-y-auto px-4 py-4 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
}
