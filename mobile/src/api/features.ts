import { request } from './client';

export interface FeatureToggle {
  feature_key: string;
  is_enabled: number;
  description: string;
}

export const featuresApi = {
  list: () => request<{ toggles: FeatureToggle[] }>('/features.php'),
  update: (feature_key: string, is_enabled: number) =>
    request<{ success: boolean }>('/features.php', {
      method: 'PUT',
      body: JSON.stringify({ feature_key, is_enabled }),
    }),
};
