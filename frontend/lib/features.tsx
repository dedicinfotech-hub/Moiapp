'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { request } from './api';
import { FEATURE_LANGUAGE_CONVERSION } from '@/lib/featureKeys';

interface FeatureToggle {
  feature_key: string;
  is_enabled: number;
  description: string;
}

interface FeaturesContextValue {
  toggles: FeatureToggle[];
  isEnabled: (key: string) => boolean;
  loading: boolean;
  reload: () => void;
}

const FeaturesContext = createContext<FeaturesContextValue | undefined>(undefined);

/** When a toggle row is missing, match migrate defaults (language on by default). */
function defaultEnabled(key: string): boolean {
  if (key === FEATURE_LANGUAGE_CONVERSION) return true;
  return false;
}

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await request<{ toggles: FeatureToggle[] }>('/features.php');
        if (!cancelled) {
          setToggles(Array.isArray(res.toggles) ? res.toggles : []);
        }
      } catch {
        if (!cancelled) {
          setToggles([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [reloadToken]);

  const isEnabled = (key: string): boolean => {
    const toggle = toggles.find((t) => t.feature_key === key);
    if (!toggle) return defaultEnabled(key);
    return toggle.is_enabled === 1;
  };

  return (
    <FeaturesContext.Provider value={{ toggles, isEnabled, loading, reload }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures(): FeaturesContextValue {
  const context = useContext(FeaturesContext);
  if (!context) {
    return { toggles: [], isEnabled: defaultEnabled, loading: false, reload: () => {} };
  }
  return context;
}
