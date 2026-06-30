import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { Platform } from 'react-native';
import type { AppModule } from '../lib/navigation';
import type { AdminStackParamList, RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

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

const TAB_MODULES: Partial<Record<AppModule, 'Home' | 'Functions' | 'MoiList' | 'ReportsTab'>> = {
  dashboard: 'Home',
  events: 'Functions',
  'moi-notebook': 'MoiList',
  analytics: 'ReportsTab',
};

const MORE_STACK_SCREENS: Partial<Record<AppModule, keyof import('./types').MoreStackParamList>> = {
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
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'PublicFlow',
      params: { screen: 'PublicEventsList' },
    })
  );
}

export function navigateToPublicHome() {
  if (!navigationRef.isReady()) return;

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'PublicFlow', params: { screen: 'PublicHome' } }],
    })
  );

  if (Platform.OS === 'web' && typeof globalThis.history !== 'undefined') {
    globalThis.history.replaceState({}, '', '/');
  }
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
