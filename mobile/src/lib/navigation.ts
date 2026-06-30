export type AppModule =
  | 'dashboard'
  | 'events'
  | 'organizers'
  | 'moi-notebook'
  | 'users'
  | 'analytics'
  | 'features'
  | 'settings'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-analytics'
  | 'admin-revenue'
  | 'admin-support'
  | 'admin-approvals'
  | 'admin-private-events'
  | 'admin-login-logs'
  | 'admin-features';

export interface AppNavItem {
  id: AppModule;
  label: string;
  feature?: string;
  adminOnly?: boolean;
}

export const APP_NAV: AppNavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'events', label: 'Events' },
  { id: 'organizers', label: 'Organizers', feature: 'multi_organizer' },
  { id: 'moi-notebook', label: 'Moi Notebook' },
  { id: 'users', label: 'Guests' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'features', label: 'Features', adminOnly: true },
  { id: 'settings', label: 'Settings' },
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
  'admin-features',
];

export const MODULE_LABELS: Record<AppModule, string> = {
  dashboard: 'Dashboard',
  events: 'Events',
  organizers: 'Organizers',
  'moi-notebook': 'Moi Notebook',
  users: 'Guests',
  analytics: 'Analytics',
  features: 'Features',
  settings: 'Settings',
  'admin-dashboard': 'Admin Dashboard',
  'admin-approvals': 'Approvals',
  'admin-users': 'User Management',
  'admin-analytics': 'Analytics',
  'admin-revenue': 'Revenue',
  'admin-support': 'Support',
  'admin-private-events': 'Private Events',
  'admin-login-logs': 'Login Logs',
  'admin-features': 'Feature Toggles',
};

export const MODULE_SUBTITLES: Record<AppModule, string> = {
  dashboard: 'Overview of your Moi activity',
  events: 'Manage all wedding events',
  organizers: 'Manage event organizers',
  'moi-notebook': 'Track all moi entries',
  users: 'Guest & user management',
  analytics: 'Performance & insights',
  features: 'Enable or disable app features',
  settings: 'Account & preferences',
  'admin-dashboard': 'Admin overview and statistics',
  'admin-users': 'Manage all users',
  'admin-analytics': 'Platform analytics and insights',
  'admin-revenue': 'Revenue management',
  'admin-support': 'Support tickets and complaints',
  'admin-approvals': 'Approve or reject new events',
  'admin-private-events': 'Manage private events',
  'admin-login-logs': 'Authentication audit trail',
  'admin-features': 'Enable or disable platform features',
};

export interface SidebarSection {
  label: string;
  items: { id: AppModule; label: string }[];
}

export function getAppSidebarSections({
  isAdmin,
  isEnabled,
}: {
  isAdmin: boolean;
  isEnabled: (feature: string) => boolean;
}): SidebarSection[] {
  const menuItems = APP_NAV.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.feature && !isEnabled(item.feature)) return false;
    return true;
  }).map((item) => ({ id: item.id, label: item.label }));

  const adminItems = isAdmin
    ? ADMIN_NAV_IDS.map((id) => ({ id, label: MODULE_LABELS[id] }))
    : [];

  return [
    { label: 'Menu', items: menuItems },
    ...(adminItems.length ? [{ label: 'Admin', items: adminItems }] : []),
  ];
}
