import React from 'react';
import { NavigationContainer, LinkingOptions, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import { AppSidebarDrawer } from '../components/layout/AppSidebarContent';
import { useIsGuestLink } from '../hooks/useIsGuestLink';
import type { RootStackParamList } from './types';
import { navigationRef } from './navigationRef';
import { PublicStack } from './PublicStack';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { EventStack } from './EventStack';
import { GuestStack } from './GuestStack';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['moiapp://', 'https://moipassbook.com', 'https://dsitesai.com/moiapp', 'http://localhost:8081'],
  config: {
    screens: {
      PublicFlow: {
        screens: {
          PublicHome: '',
          PublicEventsList: 'events',
          PublicEventDetail: 'e/:slug',
        },
      },
      Auth: {
        screens: {
          Splash: 'splash',
          Login: 'login',
          Register: 'register',
        },
      },
      Main: {
        screens: {
          PublicBrowse: {
            screens: {
              PublicHome: 'home',
              PublicEventsList: 'events',
              PublicEventDetail: 'e/:slug',
            },
          },
          Dashboard: 'dashboard',
          Functions: 'my-events',
        },
      },
      GuestFlow: {
        screens: {
          GuestPayment: {
            path: 'g/:token',
            alias: ['g/:token/payment'],
          },
          GuestLanding: 'g/:token/landing',
          GuestForm: 'g/:token/form',
          PaymentSuccess: 'g/:token/success',
          GuestReceipt: 'g/:token/receipt',
          LinkExpired: 'g/:token/expired',
        },
      },
    },
  },
} as LinkingOptions<RootStackParamList>;

function AppShell() {
  const { user, profileSetupRequired, initialized } = useAuthStore();
  const sessionActive = !!user && !profileSetupRequired;
  const { isOpen, activeModule, close } = useSidebar();
  const logout = useAuthStore((s) => s.logout);
  const isGuestLink = useIsGuestLink();

  if (!initialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
        <ActivityIndicator color={colors.text} size="large" />
      </View>
    );
  }

  const initialRoute = sessionActive ? 'Main' : isGuestLink ? 'GuestFlow' : 'PublicFlow';

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        {sessionActive ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="EventFlow" component={EventStack} />
            <Stack.Screen name="GuestFlow" component={GuestStack} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="PublicFlow" component={PublicStack} />
            <Stack.Screen name="GuestFlow" component={GuestStack} />
            <Stack.Screen name="Auth" component={AuthStack} />
          </>
        )}
      </Stack.Navigator>
      {sessionActive ? (
        <AppSidebarDrawer
          visible={isOpen}
          activeModule={activeModule}
          onClose={close}
          onLogout={logout}
        />
      ) : null}
    </>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef} linking={linking} theme={{
      dark: false,
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.error,
      },
      fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' },
        medium: { fontFamily: 'System', fontWeight: '500' },
        bold: { fontFamily: 'System', fontWeight: '700' },
        heavy: { fontFamily: 'System', fontWeight: '800' },
      },
    }}>
      <SidebarProvider>
        <AppShell />
      </SidebarProvider>
    </NavigationContainer>
  );
}
