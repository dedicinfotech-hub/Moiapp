import { useCallback, useEffect, useState } from 'react';
import { featuresApi, type FeatureToggle } from '../api/features';

export function useFeatures() {
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    featuresApi
      .list()
      .then((r) => setToggles(r.toggles || []))
      .catch(() => setToggles([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isEnabled = useCallback(
    (key: string) => {
      const t = toggles.find((x) => x.feature_key === key);
      if (!t) return key === 'language_conversion';
      return t.is_enabled === 1;
    },
    [toggles]
  );

  return { toggles, isEnabled, loading, reload: load };
}
