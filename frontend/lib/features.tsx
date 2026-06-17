'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { request } from './api';

interface FeatureToggle {
  feature_key: string;
  is_enabled: number;
  description: string;
}

interface FeaturesContextValue {
  toggles: FeatureToggle[];
  isEnabled: (key: string) => boolean;
  loading: boolean;
}

const FeaturesContext = createContext<FeaturesContextValue | undefined>(undefined);

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
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
  }, []);

  const isEnabled = (key: string): boolean => {
    const toggle = toggles.find((t) => t.feature_key === key);
    return toggle ? toggle.is_enabled === 1 : false;
  };

  return (
    <FeaturesContext.Provider value={{ toggles, isEnabled, loading }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures(): FeaturesContextValue {
  const context = useContext(FeaturesContext);
  if (!context) {
    // Return safe defaults if used outside provider
    return { toggles: [], isEnabled: () => false, loading: false };
  }
  return context;
}
