'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { eventsApi, moiApi, Event, MoiEntry } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';
import AppSidebar from '@/components/AppSidebar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/lib/auth';
import { useFeatures } from '@/lib/features';
import { useTranslation } from '@/lib/i18n';
import { getAppSidebarSections } from '@/lib/navigation';
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
  ModuleAdminLoginLogs,
  NewEventModal,
  EditEventModal,
  BulkImportModal,
} from './components';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features' | 'admin-dashboard' | 'admin-users' | 'admin-analytics' | 'admin-revenue' | 'admin-support' | 'admin-approvals' | 'admin-private-events' | 'admin-login-logs';

const MODULE_SUBTITLE_KEY: Record<Module, string> = {
  dashboard: 'mod_dashboard_sub',
  events: 'mod_events_sub',
  organizers: 'mod_organizers_sub',
  'moi-notebook': 'mod_moi_notebook_sub',
  users: 'mod_users_sub',
  analytics: 'mod_analytics_sub',
  features: 'mod_features_sub',
  settings: 'mod_settings_sub',
  'admin-dashboard': 'mod_admin_dashboard_sub',
  'admin-users': 'mod_admin_users_sub',
  'admin-analytics': 'mod_admin_analytics_sub',
  'admin-revenue': 'mod_admin_revenue_sub',
  'admin-support': 'mod_admin_support_sub',
  'admin-approvals': 'mod_admin_approvals_sub',
  'admin-private-events': 'mod_admin_private_events_sub',
  'admin-login-logs': 'mod_admin_login_logs_sub',
};

const MODULE_I18N_KEY: Record<Module, string> = {
  dashboard: 'dashboard',
  events: 'functions',
  organizers: 'organizers',
  'moi-notebook': 'moi_notebook',
  users: 'guests',
  analytics: 'reports',
  features: 'settings',
  settings: 'settings',
  'admin-dashboard': 'admin_dashboard',
  'admin-users': 'admin_users',
  'admin-analytics': 'admin_analytics',
  'admin-revenue': 'admin_revenue',
  'admin-support': 'admin_support',
  'admin-approvals': 'admin_approvals',
  'admin-private-events': 'admin_private_events',
  'admin-login-logs': 'admin_login_logs',
};

// ─────────────────────────────────────────────────────────────────────────────
function DashboardInner() {
  const { user, logout, loading: authLoading } = useAuth();
  const { isEnabled } = useFeatures();
  const { t } = useTranslation();
  const router = useRouter();

  const [module,   setModule]   = useState<Module>('dashboard');
  const searchParams = useSearchParams();
  const [sideOpen, setSideOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) {
      setSidebarCollapsed((value) => !value);
    } else {
      setSideOpen((value) => !value);
    }
  };
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
    labelForModule: (id) => t(MODULE_I18N_KEY[id]),
    sectionLabels: { menu: t('menu'), admin: t('section_admin') },
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load before processing module
    
    const mod = searchParams.get('module') as Module | null;
    if (mod && ['dashboard', 'events', 'moi-notebook', 'users', 'analytics', 'settings', 'organizers', 'features', 'admin-dashboard', 'admin-users', 'admin-analytics', 'admin-revenue', 'admin-support', 'admin-approvals', 'admin-private-events', 'admin-login-logs'].includes(mod)) {
      // Only allow features module for admin users
      if (mod === 'features' && !isAdmin) {
        setModule('dashboard');
      } else {
        setModule(mod);
      }
    }
  }, [searchParams, isAdmin, authLoading]);

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
          <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
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
          collapsed={sidebarCollapsed}
          onClose={() => setSideOpen(false)}
          adminBadge={isAdmin}
          user={user}
          onLogout={() => { logout(); router.push('/'); }}
          sections={sidebarSections}
        />

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top bar - Modern mobile design */}
          <header className="h-14 sm:h-16 bg-white border-b border-tn-border flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 shrink-0 safe-area-top">
            {/* Hamburger with better touch target */}
            <button
              className="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center text-tn-muted hover:text-tn-text rounded-lg hover:bg-tn-light transition-colors"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <Icon name="menu" size={20} />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-tn-text text-sm sm:text-base capitalize leading-tight">{t(MODULE_I18N_KEY[module])}</h1>
              <p className="text-xs text-tn-muted hidden sm:block">{t(MODULE_SUBTITLE_KEY[module])}</p>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <NotificationBell />
              {isEnabled('bulk_import') && (
                <button
                  onClick={() => setShowBulkImport(true)}
                  className="flex items-center gap-1 sm:gap-1.5 border border-tn-yellow text-tn-gold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-tn-yellow-bg transition-colors whitespace-nowrap"
                  aria-label="Import"
                >
                  <Icon name="upload" size={14} />
                  <span className="hidden sm:inline">Import</span>
                </button>
              )}
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-1 sm:gap-1.5 bg-tn-yellow text-black px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-tn-yellow-2 transition-colors whitespace-nowrap"
              >
                <Icon name="plus" size={14} />
                <span className="hidden sm:inline">New Event</span>
              </button>
            </div>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-tn-light pb-20 lg:pb-6">
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
            {module === 'admin-login-logs' && <ModuleAdminLoginLogs onNavigate={setModule} />}
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

function DashboardContent() {
  return <DashboardInner />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-tn-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-tn-border border-t-tn-yellow rounded-full animate-spin" />
          <p className="text-tn-muted text-sm">Loading…</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
