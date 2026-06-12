'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { eventsApi, moiApi, Event, MoiEntry } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';
import { useAuth } from '@/lib/auth';
import { FeaturesProvider, useFeatures } from '@/lib/features';
import {
  ModuleDashboard,
  ModuleEvents,
  ModuleMoiNotebook,
  ModuleOrganizers,
  ModuleUsers,
  ModuleAnalytics,
  ModuleSettings,
  ModuleFeatures,
  ModuleAdminDashboard,
  ModuleAdminUsers,
  ModuleAdminAnalytics,
  ModuleAdminRevenue,
  ModuleAdminSupport,
  ModuleAdminApprovals,
  ModuleAdminPrivateEvents,
  NewEventModal,
  EditEventModal,
  BulkImportModal,
} from './components';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features' | 'admin-dashboard' | 'admin-users' | 'admin-analytics' | 'admin-revenue' | 'admin-support' | 'admin-approvals' | 'admin-private-events';

const ALL_NAV: { id: Module; label: string; icon: string; feature?: string }[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: '📊' },
  { id: 'events',    label: 'Events',     icon: '💍' },
  { id: 'organizers', label: 'Organizers', icon: '👥', feature: 'multi_organizer' },
  { id: 'moi-notebook',  label: 'Moi Notebook',   icon: '💰' },
  { id: 'users',     label: 'Users',      icon: '👤' },
  { id: 'analytics', label: 'Analytics',  icon: '📈' },
  { id: 'features',  label: 'Features',   icon: '🧩' },
  { id: 'settings',  label: 'Settings',   icon: '⚙️'  },
];

const MODULE_SUBTITLE: Record<Module, string> = {
  dashboard:  'Overview of your Moi activity',
  events:     'Manage all wedding events',
  organizers: 'Manage event organizers',
  'moi-notebook':   'Track all moi entries',
  users:      'Guest & user management',
  analytics:  'Performance & insights',
  features:   'Enable or disable app features',
  settings:   'Account & preferences',
  'admin-dashboard': 'Admin overview and statistics',
  'admin-users': 'Manage all users',
  'admin-analytics': 'Platform analytics and insights',
  'admin-revenue': 'Revenue management',
  'admin-support': 'Support tickets and complaints',
  'admin-approvals': 'Approve or reject new functions',
};

// ─────────────────────────────────────────────────────────────────────────────
function DashboardInner() {
  const { user, logout, loading: authLoading } = useAuth();
  const { isEnabled } = useFeatures();
  const router = useRouter();

  const [module,   setModule]   = useState<Module>('dashboard');
  const [sideOpen, setSideOpen] = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const [events,     setEvents]     = useState<Event[]>([]);
  const [allEntries, setAllEntries] = useState<MoiEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Filter navigation based on feature toggles and admin status
  const visibleNav = ALL_NAV.filter(item => {
    if (item.id === 'features' && !isAdmin) return false;
    if (item.feature && !isEnabled(item.feature)) return false;
    return true;
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mod = params.get('module') as Module;
      if (mod && ['dashboard', 'events', 'moi-notebook', 'users', 'analytics', 'settings', 'organizers', 'features', 'admin-dashboard', 'admin-users', 'admin-analytics', 'admin-revenue', 'admin-support', 'admin-approvals', 'admin-private-events'].includes(mod)) {
        // Only allow features module for admin users
        if (mod === 'features' && !isAdmin) {
          setModule('dashboard');
        } else {
          setModule(mod);
        }
      }
    }
  }, [isAdmin]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const evs = await eventsApi.list();
      setEvents(evs);
      const results = await Promise.all(
        evs.map((ev) => moiApi.list(ev.id).catch(() => ({ entries: [] as MoiEntry[] })))
      );
      setAllEntries(results.flatMap((r) => r.entries));
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (authLoading || dataLoading) {
    return (
      <div className="h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
          <p className="text-[#666] text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  const totalMoi = allEntries.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <>
      {/* ── Full-screen shell ── */}
      <div className="h-screen flex overflow-hidden bg-[#f5f5f5]">

        {/* Mobile overlay */}
        {sideOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSideOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-white border-r border-[#EBEBEB]',
            'transition-transform duration-200 ease-in-out',
            sideOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:relative lg:translate-x-0 lg:flex lg:shrink-0',
          ].join(' ')}
        >
          {/* Logo row */}
          <div className="h-14 flex items-center gap-2 px-5 border-b border-[#EBEBEB] shrink-0">
            <Link href="/" className="font-extrabold text-lg text-[#101010] leading-none">
              Moi<span className="text-[#FFC107]">App</span>
            </Link>
            {isAdmin && (
              <span className="text-[9px] font-bold bg-[#FFC107] text-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-3">
            <p className="text-[10px] font-semibold text-[#BBBBBB] uppercase tracking-widest px-5 mb-1">
              Menu
            </p>
            {visibleNav.map((item) => {
              const active = module === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setModule(item.id); setSideOpen(false); }}
                  className={[
                    'w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors text-left',
                    active
                      ? 'bg-[#FFFBEE] text-[#101010] border-r-[3px] border-[#FFC107]'
                      : 'text-[#666] hover:bg-[#fafafa] hover:text-[#101010]',
                  ].join(' ')}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
            
            {/* Admin Section - only for admin users */}
            {isAdmin && (
              <>
                <p className="text-[10px] font-semibold text-[#BBBBBB] uppercase tracking-widest px-5 mb-1 mt-4">
                  Admin
                </p>
                {['admin-dashboard', 'admin-approvals', 'admin-users', 'admin-analytics', 'admin-revenue', 'admin-support', 'admin-private-events'].map((adminMod) => {
                  const labels: Record<string, string> = {
                    'admin-dashboard': 'Admin Dashboard',
                    'admin-approvals': 'Approvals',
                    'admin-users': 'User Management',
                    'admin-analytics': 'Analytics',
                    'admin-revenue': 'Revenue',
                    'admin-support': 'Support',
                    'admin-private-events': 'Private Events',
                  };
                  const icons: Record<string, string> = {
                    'admin-dashboard': '📊',
                    'admin-approvals': '✅',
                    'admin-users': '👥',
                    'admin-analytics': '📈',
                    'admin-revenue': '💰',
                    'admin-support': '🎫',
                    'admin-private-events': '🔒',
                  };
                  const active = module === adminMod;
                  return (
                    <button
                      key={adminMod}
                      onClick={() => { setModule(adminMod as Module); setSideOpen(false); }}
                      className={[
                        'w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors text-left',
                        active
                          ? 'bg-[#FFFBEE] text-[#101010] border-r-[3px] border-[#FFC107]'
                          : 'text-[#666] hover:bg-[#fafafa] hover:text-[#101010]',
                      ].join(' ')}
                    >
                      <span className="text-base w-5 text-center">{icons[adminMod]}</span>
                      {labels[adminMod]}
                    </button>
                  );
                })}
              </>
            )}
          </nav>

          {/* User footer */}
          <div className="border-t border-[#EBEBEB] px-4 py-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FFC107] flex items-center justify-center text-black font-bold text-sm shrink-0">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#101010] truncate leading-tight">{user?.name}</p>
                <p className="text-[11px] text-[#999] truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { logout(); router.push('/'); }}
                title="Sign out"
                className="text-[#ccc] hover:text-red-400 transition-colors shrink-0 p-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar */}
          <header className="h-14 bg-white border-b border-[#EBEBEB] flex items-center gap-3 px-4 lg:px-6 shrink-0">
            {/* Hamburger */}
            <button
              className="lg:hidden text-[#666] hover:text-[#101010] p-1"
              onClick={() => setSideOpen(true)}
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-[#101010] text-sm capitalize leading-tight">{module}</h1>
              <p className="text-[11px] text-[#999] hidden sm:block">{MODULE_SUBTITLE[module]}</p>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              {isEnabled('bulk_import') && (
                <button
                  onClick={() => setShowBulkImport(true)}
                  className="flex items-center gap-1.5 border border-[#FFC107] text-[#B8860B] px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#FFFCF5] transition-colors whitespace-nowrap"
                >
                  <span className="hidden sm:inline">📥 Import</span>
                  <span className="sm:hidden text-base">📥</span>
                </button>
              )}
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-1.5 bg-[#FFC107] text-black px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors whitespace-nowrap"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span className="hidden sm:inline">New Event</span>
              </button>
            </div>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {module === 'dashboard' && (
              <ModuleDashboard events={events} entries={allEntries} onNavigate={setModule} onNewEvent={() => setShowNew(true)} />
            )}
            {module === 'events'     && <ModuleEvents     events={events} onRefresh={loadAll} onNewEvent={() => setShowNew(true)} onEdit={setEditingEvent} />}
            {module === 'organizers' && <ModuleOrganizers events={events} onRefresh={loadAll} />}
            {module === 'moi-notebook'   && <ModuleMoiNotebook   entries={allEntries} events={events} />}
            {module === 'users'      && <ModuleUsers      entries={allEntries} />}
            {module === 'analytics'  && <ModuleAnalytics  events={events} entries={allEntries} totalMoi={totalMoi} />}
            {module === 'features'   && <ModuleFeatures   isAdmin={isAdmin} />}
            {module === 'settings'   && <ModuleSettings   user={user} onLogout={() => { logout(); router.push('/'); }} />}
            {module === 'admin-dashboard' && <ModuleAdminDashboard onNavigate={setModule} />}
            {module === 'admin-users' && <ModuleAdminUsers onNavigate={setModule} />}
            {module === 'admin-analytics' && <ModuleAdminAnalytics onNavigate={setModule} />}
            {module === 'admin-revenue' && <ModuleAdminRevenue onNavigate={setModule} />}
            {module === 'admin-support' && <ModuleAdminSupport onNavigate={setModule} />}
            {module === 'admin-approvals' && <ModuleAdminApprovals onNavigate={setModule} onRefresh={loadAll} />}
            {module === 'admin-private-events' && <ModuleAdminPrivateEvents onNavigate={setModule} />}
          </main>
        </div>
      </div>

      {/* ── New Event Modal ── */}
      {showNew && (
        <NewEventModal
          onClose={() => setShowNew(false)}
          onCreated={() => { loadAll(); setShowNew(false); setModule('events'); }}
        />
      )}

      {/* ── Edit Event Modal ── */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdated={() => { loadAll(); setEditingEvent(null); }}
        />
      )}

      {/* ── Bulk Import Modal ── */}
      {showBulkImport && (
        <BulkImportModal
          events={events}
          onClose={() => setShowBulkImport(false)}
          onImported={() => { loadAll(); setShowBulkImport(false); }}
        />
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <FeaturesProvider>
      <DashboardInner />
    </FeaturesProvider>
  );
}
