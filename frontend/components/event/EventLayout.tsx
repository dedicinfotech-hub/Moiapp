'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import Icon, { type IconName } from '@/components/ui/Icon';
import { useAuth } from '@/lib/auth';
import { useFeatures } from '@/lib/features';
import { getAppSidebarSections } from '@/lib/navigation';
import { useEffect, useState } from 'react';

export type EventNavTab = 'dashboard' | 'entries' | 'reports' | 'settings';

interface EventLayoutProps {
  slug: string;
  children: React.ReactNode;
  activeTab?: EventNavTab;
  title?: string;
  showNotifications?: boolean;
  notificationCount?: number;
}

export function CreateFlowHeader({
 title,
 onBack,
 showHelp = true,
 leftAction,
}: {
 title: string;
 onBack?: () => void;
 showHelp?: boolean;
 leftAction?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#F3F4F6] px-4 h-14 flex items-center justify-between">
      <div className="flex items-center">
        {leftAction}
        <button
          type="button"
          onClick={onBack || (() => router.back())}
          className="w-10 h-10 flex items-center justify-center text-[#4B218B]"
          aria-label="Go back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>
      <h1 className="text-base font-bold text-[#1F2937]">{title}</h1>
      {showHelp ? (
        <button type="button" className="w-10 h-10 flex items-center justify-center text-[#4B218B]" aria-label="Help">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </button>
      ) : (
        <div className="w-10" />
      )}
    </header>
  );
}

export function CreateStepProgress({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  const steps = [
    { num: 1, label: 'Event Type' },
    { num: 2, label: 'Function Details' },
    { num: 3, label: 'Settings' },
    { num: 4, label: 'Review' },
  ] as const;

  return (
    <div className="px-4 py-4 border-b border-[#F3F4F6] bg-white">
      <div className="flex items-start justify-between max-w-md mx-auto">
        {steps.map((step, idx) => {
          const isActive = step.num === currentStep;
          const isDone = step.num < currentStep;
          return (
            <div key={step.num} className="flex flex-col items-center flex-1 relative">
              {idx > 0 && (
                <div
                  className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${isDone || isActive ? 'bg-[#4B218B]' : 'bg-[#E5E7EB]'}`}
                  style={{ width: '100%', transform: 'translateX(-50%)' }}
                />
              )}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                isActive || isDone ? 'bg-[#4B218B] text-white' : 'bg-[#E5E7EB] text-[#9CA3AF]'
              }`}>
                {step.num}
              </div>
              <p className={`text-[9px] mt-1.5 font-medium text-center leading-tight max-w-[64px] ${
                isActive ? 'text-[#4B218B] font-semibold' : isDone ? 'text-[#4B218B]' : 'text-[#9CA3AF]'
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EventDetailsRow({ event }: { event: { wedding_date?: string; wedding_time?: string; venue?: string | null; city?: string | null; event_mode?: string } }) {
  const dateStr = event.wedding_date
    ? new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })
    : '—';
  const timeStr = event.wedding_time
    ? `${event.wedding_time} onwards`
    : '—';

  const items = [
    { icon: 'calendar', label: dateStr },
    { icon: 'clock', label: timeStr },
    { icon: 'location', label: [event.venue, event.city].filter(Boolean).join(', ') || '—' },
    { icon: 'users', label: event.event_mode === 'past' ? 'Past Event' : 'New Event' },
  ];

  const Icon = ({ type }: { type: string }) => {
    const cls = 'text-[#7C3AED]';
    if (type === 'calendar') return (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    );
    if (type === 'clock') return (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    );
    if (type === 'location') return (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    );
    return (
      <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-4 gap-2 bg-white border border-[#F3F4F6] rounded-2xl p-3 mb-5">
      {items.map((item) => (
        <div key={item.icon} className="text-center px-1">
          <div className="flex justify-center mb-1.5"><Icon type={item.icon} /></div>
          <p className="text-[9px] text-[#6B7280] leading-tight line-clamp-3">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function EventSidebarFooter({ slug }: { slug: string }) {
  return (
    <div className="rounded-xl bg-tn-light p-3">
      <p className="text-[11px] font-semibold text-tn-muted uppercase tracking-widest mb-1">Event</p>
      <p className="text-xs text-tn-text">Common menu follows your account permissions.</p>
      <p className="text-[10px] text-tn-subtle mt-2 break-words">{slug}</p>
    </div>
  );
}

function EventLayoutInner({
  slug,
  children,
  activeTab = 'dashboard',
  title,
  showNotifications = true,
  notificationCount = 0,
}: EventLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { isEnabled } = useFeatures();
  const isAdmin = user?.role === 'admin';

  const navItems: { id: EventNavTab; label: string; href: string; icon: IconName }[] = [
    { id: 'dashboard', label: 'Dashboard', href: `/events/${slug}/dashboard`, icon: 'dashboard' },
    { id: 'entries', label: 'Moi Entries', href: `/events/${slug}/entries`, icon: 'list' },
    { id: 'reports', label: 'Reports', href: `/events/${slug}/reports`, icon: 'chart' },
    { id: 'settings', label: 'Settings', href: `/events/${slug}/moi-entry`, icon: 'settings' },
  ];

  const toggleSidebar = () => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) {
      setSidebarCollapsed((value) => !value);
    } else {
      setDrawerOpen((value) => !value);
    }
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="h-screen flex overflow-hidden bg-[#F9FAFB]">
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <AppSidebar
        fixed
        isOpen={drawerOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setDrawerOpen(false)}
        adminBadge={isAdmin}
        user={user}
        onLogout={() => { logout(); router.push('/'); }}
        footer={<EventSidebarFooter slug={slug} />}
        sections={getAppSidebarSections({
          isAdmin,
          isEnabled,
          activeModule: 'events',
        })}
      />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-30 bg-white border-b border-[#F3F4F6] px-4 pt-3 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={toggleSidebar} className="w-10 h-10 flex items-center justify-center text-[#1F2937]" aria-label={sidebarCollapsed ? 'Open menu' : 'Close menu'}>
              <Icon name="menu" size={22} />
            </button>
            <div className="flex items-center gap-2">
              {showNotifications && (
                <button type="button" className="relative w-10 h-10 flex items-center justify-center text-[#1F2937]" aria-label="Notifications">
                  <Icon name="bell" size={20} />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#7C3AED] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
              )}
              <button type="button" className="w-10 h-10 flex items-center justify-center text-[#1F2937]" aria-label="More options">
                <Icon name="more-vertical" size={20} />
              </button>
            </div>
          </div>
          {title && (
            <>
              <h1 className="text-lg font-bold text-[#1F2937] leading-tight">{title}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 bg-[#22C55E] rounded-full" />
                <span className="text-xs font-semibold text-[#22C55E]">Function is Active</span>
              </div>
            </>
          )}
        </header>

        <main className="flex-1 min-w-0 overflow-y-auto px-4 py-4 pb-24">{children}</main>

        <nav className={`fixed bottom-0 left-0 right-0 h-[68px] bg-white border-t border-[#EBEBEB] flex items-center justify-around px-1 z-40 ${sidebarCollapsed ? 'lg:left-0' : 'lg:left-60'}`}>
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[64px] ${
                activeTab === item.id ? 'text-[#4B218B]' : 'text-[#9CA3AF]'
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className={`text-[10px] ${activeTab === item.id ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function EventLayout(props: EventLayoutProps) {
  return <EventLayoutInner {...props} />;
}
