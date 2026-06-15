'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { eventsApi, moiApi, Event, MoiEntry } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';
import AppSidebar from '@/components/AppSidebar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/lib/auth';
import { FeaturesProvider, useFeatures } from '@/lib/features';
import { ADMIN_NAV_LABELS, getAppSidebarSections } from '@/lib/navigation';
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
  'admin-approvals': 'Approve or reject new events',
  'admin-private-events': 'Manage private events',
};

const MODULE_LABELS: Record<Module, string> = ADMIN_NAV_LABELS as Record<Module, string>;

// ─────────────────────────────────────────────────────────────────────────────
function DashboardInner() {
  const { user, logout, loading: authLoading } = useAuth();
  const { isEnabled } = useFeatures();
  const router = useRouter();

  const [module,   setModule]   = useState<Module>('dashboard');
  const searchParams = useSearchParams();
  const [sideOpen, setSideOpen] = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const [events,     setEvents]     = useState<Event[]>([]);
  const [allEntries, setAllEntries] = useState<MoiEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const sidebarSections = getAppSidebarSections({
    isAdmin,
    isEnabled,
    activeModule: module,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    const mod = searchParams.get('module') as Module | null;
    if (mod && ['dashboard', 'events', 'moi-notebook', 'users', 'analytics', 'settings', 'organizers', 'features', 'admin-dashboard', 'admin-users', 'admin-analytics', 'admin-revenue', 'admin-support', 'admin-approvals', 'admin-private-events'].includes(mod)) {
      // Only allow features module for admin users
      if (mod === 'features' && !isAdmin) {
        setModule('dashboard');
      } else {
        setModule(mod);
      }
    }
  }, [searchParams, isAdmin]);

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
      <div className="h-screen bg-tn-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-tn-yellow rounded-full animate-spin" />
          <p className="text-tn-muted text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  const totalMoi = allEntries.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <>
      {/* ── Full-screen shell ── */}
      <div className="h-screen flex overflow-hidden bg-tn-light">

        {/* Mobile overlay */}
        {sideOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSideOpen(false)}
          />
        )}

        <AppSidebar
          fixed
          isOpen={sideOpen}
          onClose={() => setSideOpen(false)}
          adminBadge={isAdmin}
          user={user}
          onLogout={() => { logout(); router.push('/'); }}
          sections={sidebarSections}
        />

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar */}
          <header className="h-14 bg-white border-b border-tn-border flex items-center gap-3 px-4 lg:px-6 shrink-0">
            {/* Hamburger */}
            <button
              className="lg:hidden text-tn-muted hover:text-tn-text p-1"
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
              <h1 className="font-bold text-tn-text text-sm capitalize leading-tight">{MODULE_LABELS[module]}</h1>
              <p className="text-[11px] text-tn-muted hidden sm:block">{MODULE_SUBTITLE[module]}</p>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              {isEnabled('bulk_import') && (
                <button
                  onClick={() => setShowBulkImport(true)}
                  className="flex items-center gap-1.5 border border-tn-yellow text-tn-gold px-3 py-2 rounded-lg text-sm font-semibold hover:bg-tn-yellow-bg transition-colors whitespace-nowrap"
                >
                  <Icon name="upload" size={16} />
                  <span className="hidden sm:inline">Import</span>
                </button>
              )}
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-1.5 bg-tn-yellow text-black px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-tn-yellow-2 transition-colors whitespace-nowrap"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span className="hidden sm:inline">New Event</span>
              </button>
            </div>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-tn-light">
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
