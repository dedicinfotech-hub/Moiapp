import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  loadAppSettings,
  saveAppSettings,
  DEFAULT_APP_SETTINGS,
  type AppSettings,
} from '../utils/settingsStorage';
import { translate, type AppLanguage } from '../i18n/translations';
import { colors } from '../theme';

const FONT_SCALE = { small: 0.9, medium: 1, large: 1.15 } as const;

interface AppSettingsContextValue {
  settings: AppSettings;
  fontScale: number;
  t: (key: string) => string;
  updateSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
}

const AppSettingsContext = createContext<AppSettingsContextValue>({
  settings: DEFAULT_APP_SETTINGS,
  fontScale: 1,
  t: (key) => translate('en', key),
  updateSettings: async (partial) => ({ ...DEFAULT_APP_SETTINGS, ...partial }),
});

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    loadAppSettings().then(setSettings);
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const next = await saveAppSettings(partial);
    setSettings(next);
    return next;
  }, []);

  const value = useMemo<AppSettingsContextValue>(() => {
    const s = settings ?? DEFAULT_APP_SETTINGS;
    const lang = s.language as AppLanguage;
    return {
      settings: s,
      fontScale: FONT_SCALE[s.fontSize],
      t: (key) => translate(lang, key),
      updateSettings,
    };
  }, [settings, updateSettings]);

  if (!settings) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
