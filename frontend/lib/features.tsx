'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { featuresApi } from './api';

export interface FeatureToggle {
  feature_key: string;
  is_enabled: number;
  description: string;
}

interface FeaturesContextType {
  toggles: FeatureToggle[];
  loading: boolean;
  isEnabled: (key: string) => boolean;
  refresh: () => Promise<void>;
}

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined);

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await featuresApi.list();
      setToggles(res.toggles);
    } catch {
      setToggles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const isEnabled = (key: string): boolean => {
    const toggle = toggles.find((t) => t.feature_key === key);
    return toggle ? toggle.is_enabled === 1 : false;
  };

  return (
    <FeaturesContext.Provider value={{ toggles, loading, isEnabled, refresh: load }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures(): FeaturesContextType {
  const context = useContext(FeaturesContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeaturesProvider');
  }
  return context;
}
