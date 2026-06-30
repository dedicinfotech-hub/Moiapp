import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAppSettings } from '../context/AppSettingsContext';
import { registerPushTokenWithServer, unregisterPushTokenFromServer } from '../services/pushRegistration';

export function usePushRegistration() {
  const user = useAuthStore((s) => s.user);
  const { settings } = useAppSettings();

  useEffect(() => {
    if (!user || !settings.notificationsEnabled) {
      unregisterPushTokenFromServer();
      return;
    }
    registerPushTokenWithServer().catch(() => {});
  }, [user?.id, settings.notificationsEnabled]);
}
