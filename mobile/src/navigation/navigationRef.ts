import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { Platform } from 'react-native';
import type { AppModule } from '../lib/navigation';
import type { AdminStackParamList, RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function isLoggedInSession(): boolean {
  if (!navigationRef.isReady()) return false;
  return navigationRef.getRootState().routes.some((r) => r.name === 'Main');
}

let onModuleNavigate: ((module: AppModule) => void) | null = null;

/** Sidebar can register to update active module highlight after navigation. */
export function registerModuleNavigateListener(cb: (module: AppModule) => void) {
  onModuleNavigate = cb;
  return () => {
    if (onModuleNavigate === cb) onModuleNavigate = null;
  };
}

export function resetToMain() {
  if (!navigationRef.isReady()) return;

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    })
  );

  if (Platform.OS === 'web' && typeof globalThis.history !== 'undefined') {
    globalThis.history.replaceState({}, '', '/');
  }
}

const TAB_MODULES: Partial<Record<AppModule, 'Dashboard' | 'Functions' | 'MoiList' | 'ReportsTab'>> = {
  dashboard: 'Dashboard',
  events: 'Functions',
  'moi-notebook': 'MoiList',
  analytics: 'ReportsTab',
};

const MORE_STACK_SCREENS: Partial<Record<AppModule, keyof import('./types').MoreStackParamList>> = {
  profile: 'Profile',
  organizers: 'Organizers',
  users: 'Guests',
  features: 'Features',
  settings: 'Settings',
};

const ADMIN_SCREEN_MAP: Partial<Record<AppModule, keyof AdminStackParamList>> = {
  'admin-dashboard': 'AdminDashboard',
  'admin-approvals': 'AdminApprovals',
  'admin-users': 'AdminUsers',
  'admin-analytics': 'AdminAnalytics',
  'admin-revenue': 'AdminRevenue',
  'admin-support': 'AdminSupport',
  'admin-private-events': 'AdminPrivateEvents',
  'admin-login-logs': 'AdminLoginLogs',
  'admin-features': 'AdminFeatures',
};

function navigateToAdminScreen(adminScreen: keyof AdminStackParamList) {
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: {
        screen: 'More',
        params: {
          screen: 'AdminPanel',
          params: { screen: adminScreen },
        },
      },
    })
  );
}

export function navigateToModule(module: AppModule) {
  if (!navigationRef.isReady()) return;

  const tab = TAB_MODULES[module];
  if (tab) {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: tab },
      })
    );
    onModuleNavigate?.(module);
    return;
  }

  const adminScreen = ADMIN_SCREEN_MAP[module];
  if (adminScreen) {
    navigateToAdminScreen(adminScreen);
    onModuleNavigate?.(module);
    return;
  }

  const moreScreen = MORE_STACK_SCREENS[module];
  if (moreScreen) {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: {
          screen: 'More',
          params: { screen: moreScreen },
        },
      })
    );
    onModuleNavigate?.(module);
  }
}

export function navigateNewEvent() {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'EventFlow',
      params: { screen: 'ChooseEventType' },
    })
  );
}

export function navigateToPublicEvents() {
  if (!navigationRef.isReady()) return;
  const hasMain = navigationRef.getRootState().routes.some((r) => r.name === 'Main');
  if (hasMain) {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'PublicBrowse', params: { screen: 'PublicEventsList' } },
      })
    );
    return;
  }
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'PublicFlow',
      params: { screen: 'PublicEventsList' },
    })
  );
}

export function navigateToPublicHome() {
  if (!navigationRef.isReady()) return;
  const hasMain = navigationRef.getRootState().routes.some((r) => r.name === 'Main');
  if (hasMain) {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'PublicBrowse', params: { screen: 'PublicHome' } },
      })
    );
    return;
  }
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'PublicFlow',
      params: { screen: 'PublicHome' },
    })
  );
}

export function navigateToAuth(screen: 'Login' | 'Register' | 'Splash') {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Auth',
      params: { screen },
    })
  );
}
