import type { AppSidebarItem, AppSidebarSection } from '@/components/AppSidebar';
import type { IconName } from '@/components/ui/Icon';

export type AppModule =
  | 'dashboard'
  | 'events'
  | 'organizers'
  | 'moi-notebook'
  | 'users'
  | 'analytics'
  | 'features'
  | 'profile'
  | 'settings'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-analytics'
  | 'admin-revenue'
  | 'admin-support'
  | 'admin-approvals'
  | 'admin-private-events'
  | 'admin-login-logs';

export interface AppNavItem {
  id: AppModule;
  label: string;
  icon: IconName;
  feature?: string;
}

export const APP_NAV: AppNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'events', label: 'Functions', icon: 'wedding' },
  { id: 'organizers', label: 'Organizers', icon: 'users', feature: 'multi_organizer' },
  { id: 'moi-notebook', label: 'Moi Notebook', icon: 'wallet' },
  { id: 'users', label: 'Guests', icon: 'users' },
  { id: 'analytics', label: 'Analytics', icon: 'trend' },
  { id: 'features', label: 'Features', icon: 'features' },
  { id: 'profile', label: 'Profile', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export const ADMIN_NAV_IDS: AppModule[] = [
  'admin-dashboard',
  'admin-approvals',
  'admin-users',
  'admin-analytics',
  'admin-revenue',
  'admin-support',
  'admin-private-events',
  'admin-login-logs',
];

export const ADMIN_NAV_LABELS: Record<AppModule, string> = {
  dashboard: 'Dashboard',
  events: 'Functions',
  organizers: 'Organizers',
  'moi-notebook': 'Moi Notebook',
  users: 'Guests',
  analytics: 'Analytics',
  features: 'Features',
  profile: 'Profile',
  settings: 'Settings',
  'admin-dashboard': 'Admin Dashboard',
  'admin-approvals': 'Approvals',
  'admin-users': 'User Management',
  'admin-analytics': 'Analytics',
  'admin-revenue': 'Revenue',
  'admin-support': 'Support',
  'admin-private-events': 'Private Events',
  'admin-login-logs': 'Login Logs',
};

export function getAdminIcon(module: AppModule): IconName {
  const icons: Record<AppModule, IconName> = {
    dashboard: 'dashboard',
    events: 'wedding',
    organizers: 'users',
    'moi-notebook': 'wallet',
    users: 'users',
    analytics: 'trend',
    features: 'features',
    profile: 'users',
    settings: 'settings',
    'admin-dashboard': 'dashboard',
    'admin-approvals': 'approval',
    'admin-users': 'users',
    'admin-analytics': 'trend',
    'admin-revenue': 'wallet',
    'admin-support': 'ticket',
    'admin-private-events': 'lock',
    'admin-login-logs': 'shield',
  };

  return icons[module] ?? 'dashboard';
}

export function getVisibleAppNav({
  isAdmin,
  isEnabled,
}: {
  isAdmin: boolean;
  isEnabled: (feature: string) => boolean;
}): AppNavItem[] {
  return APP_NAV.filter((item) => {
    if (item.id === 'features' && !isAdmin) return false;
    if (item.feature && !isEnabled(item.feature)) return false;
    return true;
  });
}

export function getAppSidebarSections({
  isAdmin,
  isEnabled,
  activeModule,
  hrefForModule = (module) => `/dashboard?module=${module}`,
  labelForModule,
  sectionLabels,
}: {
  isAdmin: boolean;
  isEnabled: (feature: string) => boolean;
  activeModule?: AppModule;
  hrefForModule?: (module: AppModule) => string;
  labelForModule?: (module: AppModule) => string;
  sectionLabels?: { menu: string; admin: string };
}): AppSidebarSection[] {
  const menuItems = getVisibleAppNav({ isAdmin, isEnabled }).map(
    (item): AppSidebarItem => ({
      id: item.id,
      label: labelForModule ? labelForModule(item.id) : item.label,
      icon: item.icon,
      href: hrefForModule(item.id),
      active: activeModule === item.id,
    }),
  );

  const adminItems = isAdmin
    ? ADMIN_NAV_IDS.map(
        (id): AppSidebarItem => ({
          id,
          label: labelForModule ? labelForModule(id) : ADMIN_NAV_LABELS[id],
          icon: getAdminIcon(id),
          href: hrefForModule(id),
          active: activeModule === id,
        }),
      )
    : [];

  return [
    { label: sectionLabels?.menu ?? 'Menu', items: menuItems },
    ...(adminItems.length ? [{ label: sectionLabels?.admin ?? 'Admin', items: adminItems }] : []),
  ];
}
