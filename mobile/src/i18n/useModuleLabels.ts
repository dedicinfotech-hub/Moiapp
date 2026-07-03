import { useMemo } from 'react';
import { useAppSettings } from '../context/AppSettingsContext';
import type { AppModule } from '../lib/navigation';

const MODULE_KEYS: Record<AppModule, string> = {
  dashboard: 'modDashboard',
  events: 'modEvents',
  organizers: 'modOrganizers',
  'moi-notebook': 'modMoiNotebook',
  users: 'modUsers',
  analytics: 'modAnalytics',
  features: 'modFeatures',
  profile: 'modProfile',
  settings: 'modSettings',
  'admin-dashboard': 'modAdminDashboard',
  'admin-approvals': 'modAdminApprovals',
  'admin-users': 'modAdminUsers',
  'admin-analytics': 'modAdminAnalytics',
  'admin-revenue': 'modAdminRevenue',
  'admin-support': 'modAdminSupport',
  'admin-private-events': 'modAdminPrivateEvents',
  'admin-login-logs': 'modAdminLoginLogs',
  'admin-features': 'modAdminFeatures',
};

const MODULE_SUBTITLE_KEYS: Record<AppModule, string> = {
  dashboard: 'modDashboardSub',
  events: 'modEventsSub',
  organizers: 'modOrganizersSub',
  'moi-notebook': 'modMoiNotebookSub',
  users: 'modUsersSub',
  analytics: 'modAnalyticsSub',
  features: 'modFeaturesSub',
  profile: 'modProfileSub',
  settings: 'modSettingsSub',
  'admin-dashboard': 'modAdminDashboardSub',
  'admin-approvals': 'modAdminApprovalsSub',
  'admin-users': 'modAdminUsersSub',
  'admin-analytics': 'modAdminAnalyticsSub',
  'admin-revenue': 'modAdminRevenueSub',
  'admin-support': 'modAdminSupportSub',
  'admin-private-events': 'modAdminPrivateEventsSub',
  'admin-login-logs': 'modAdminLoginLogsSub',
  'admin-features': 'modAdminFeaturesSub',
};

export function useModuleLabels() {
  const { t } = useAppSettings();

  return useMemo(() => ({
    label: (module: AppModule) => t(MODULE_KEYS[module]),
    subtitle: (module: AppModule) => t(MODULE_SUBTITLE_KEYS[module]),
    sectionMenu: t('sectionMenu'),
    sectionAdmin: t('sectionAdmin'),
    newEvent: t('newEventBtn'),
    adminBadge: t('adminBadge'),
    signOut: t('signOut'),
  }), [t]);
}
