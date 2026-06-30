import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppSettingsProvider } from './src/context/AppSettingsContext';
import { usePushRegistration } from './src/hooks/usePushRegistration';
import { colors } from './src/theme';

function AppShell() {
  usePushRegistration();
  return <RootNavigator />;
}

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={colors.primary} />
      <AppSettingsProvider>
        <AppShell />
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
}
