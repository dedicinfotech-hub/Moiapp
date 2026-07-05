'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useFeatures } from '@/lib/features';
import { FEATURE_LANGUAGE_CONVERSION } from '@/lib/featureKeys';
import { en, ta, hi } from '@/lib/translations';

export type Language = 'en' | 'ta' | 'hi';
export type ActiveLanguage = Language;

export const LANGUAGE_OPTIONS: {
  code: Language;
  label: string;
  available: boolean;
}[] = [
  { code: 'en', label: 'English', available: true },
  { code: 'ta', label: 'தமிழ் (Tamil)', available: true },
  { code: 'hi', label: 'हिन्दी (Hindi)', available: true },
];

const translationsByLang = { en, ta, hi };

export function formatTranslation(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}

interface LanguageContextType {
  language: ActiveLanguage;
  setLanguage: (lang: ActiveLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const ACTIVE_LANGUAGES: ActiveLanguage[] = ['en', 'ta', 'hi'];

function isActiveLanguage(value: unknown): value is ActiveLanguage {
  return typeof value === 'string' && ACTIVE_LANGUAGES.includes(value as ActiveLanguage);
}

function readStoredLanguage(): ActiveLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const settings = JSON.parse(localStorage.getItem('moi_settings') || '{}');
    if (isActiveLanguage(settings.language)) {
      return settings.language;
    }
  } catch {
    // ignore
  }
  return 'en';
}

function lookup(lang: ActiveLanguage, key: string): string {
  return translationsByLang[lang][key] ?? en[key] ?? key;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const languageConversionEnabled = isEnabled(FEATURE_LANGUAGE_CONVERSION);
  const [language, setLanguageState] = useState<ActiveLanguage>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLanguageState(readStoredLanguage());
  }, []);

  useEffect(() => {
    if (featuresLoading) return;
    if (!languageConversionEnabled) {
      setLanguageState('en');
    }
  }, [languageConversionEnabled, featuresLoading]);

  const setLanguage = (lang: ActiveLanguage) => {
    if (!languageConversionEnabled) return;
    setLanguageState(lang);
    const settings = JSON.parse(localStorage.getItem('moi_settings') || '{}');
    settings.language = lang;
    localStorage.setItem('moi_settings', JSON.stringify(settings));
  };

  const activeLanguage: ActiveLanguage = languageConversionEnabled ? language : 'en';

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      formatTranslation(lookup(activeLanguage, key), params),
    [activeLanguage]
  );

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language: activeLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en' as ActiveLanguage,
      setLanguage: () => {},
      t: (key: string, params?: Record<string, string | number>) =>
        formatTranslation(lookup('en', key), params),
    };
  }
  return context;
}

/** Map event_type values to translation keys. */
export function eventTypeLabel(eventType: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    wedding: 'evtWedding',
    birthday: 'evtBirthday',
    engagement: 'evtEngagement',
    valakaappu: 'evtValakaappu',
    housewarming: 'evtHousewarming',
    graduation: 'evtGraduation',
    custom: 'evtOthers',
  };
  const key = map[eventType];
  return key ? t(key) : t('events');
}
