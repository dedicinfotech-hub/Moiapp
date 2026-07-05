'use client';

import { useState, useEffect } from 'react';
import Icon, { type IconName } from '@/components/ui/Icon';
import { request } from '@/lib/api';
import { useFeatures } from '@/lib/features';
import { FEATURE_LANGUAGE_CONVERSION } from '@/lib/featureKeys';

interface ModuleFeaturesProps {
  isAdmin: boolean;
}

interface FeatureToggle {
  feature_key: string;
  is_enabled: number;
  description: string;
}

const featureIconMap: Record<string, IconName> = {
  upi_payment: 'wallet',
  bulk_import: 'upload',
  multi_organizer: 'users',
  pdf_export: 'download',
  whatsapp_share: 'share',
  qr_payment: 'qr-code',
  language_conversion: 'settings',
};

const featureLabelMap: Record<string, string> = {
  upi_payment: 'UPI Payments',
  bulk_import: 'Bulk Import',
  multi_organizer: 'Multi-Organizer',
  pdf_export: 'PDF Export',
  whatsapp_share: 'WhatsApp Share',
  qr_payment: 'QR Payment',
  language_conversion: 'Language Switching',
};

function getFeatureIcon(featureKey: string): IconName {
  return featureIconMap[featureKey] || 'features';
}

function getFeatureLabel(featureKey: string): string {
  return featureLabelMap[featureKey] || featureKey.replace(/_/g, ' ');
}

function FeatureRow({
  toggle,
  enabled,
  saving,
  onToggle,
}: {
  toggle: FeatureToggle;
  enabled: boolean;
  saving: boolean;
  onToggle: () => void;
}) {
  const label = getFeatureLabel(toggle.feature_key);
  const isLanguage = toggle.feature_key === FEATURE_LANGUAGE_CONVERSION;

  return (
    <>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg bg-tn-light flex items-center justify-center text-tn-muted">
          <Icon name={getFeatureIcon(toggle.feature_key)} size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-tn-text truncate">{label}</p>
          <p className="text-[10px] text-tn-subtle truncate">{toggle.description}</p>
          {isLanguage ? (
            <p className="text-[10px] text-tn-muted mt-0.5">English · Tamil · Hindi in Settings</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${
            enabled ? 'bg-tn-success text-white' : 'bg-tn-error-bg text-tn-error'
          }`}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
        <button
          onClick={onToggle}
          disabled={saving}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            enabled
              ? 'border-tn-error text-tn-error hover:bg-tn-error'
              : 'bg-tn-yellow text-black hover:bg-tn-yellow-2'
          }`}
        >
          {saving ? 'Saving…' : enabled ? 'Disable' : 'Enable'}
        </button>
      </div>
    </>
  );
}

export default function ModuleFeatures({ isAdmin }: ModuleFeaturesProps) {
  const { reload: reloadFeatures } = useFeatures();
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request<{ toggles: FeatureToggle[] }>('/features.php');
      setToggles(Array.isArray(res.toggles) ? res.toggles : []);
    } catch (e) {
      setToggles([]);
      setError(e instanceof Error ? e.message : 'Failed to load feature toggles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (key: string, current: number) => {
    setSaving(key);
    setError(null);
    try {
      await request<{ success: boolean }>('/features.php', {
        method: 'PUT',
        body: JSON.stringify({ feature_key: key, is_enabled: current ? 0 : 1 }),
      });
      await load();
      reloadFeatures();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update feature toggle');
    } finally {
      setSaving(null);
    }
  };

  const isEnabled = (key: string) => {
    const t = toggles.find((x) => x.feature_key === key);
    return t ? t.is_enabled === 1 : false;
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-tn-yellow mb-4">
          <Icon name="lock" size={48} />
        </div>
        <h2 className="text-xl font-bold text-tn-text mb-2">Access Denied</h2>
        <p className="text-sm text-tn-muted text-center max-w-md">
          The Features module is only available to administrators. Please contact your admin if you need to enable or disable app features.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-tn-text">Feature Toggles</h2>
        <p className="text-xs text-tn-muted">Enable or disable app features post-launch</p>
      </div>

      {error && (
        <div className="bg-tn-error-bg border-tn-error text-tn-error text-sm rounded-xl p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-tn-muted">Loading…</div>
      ) : (toggles || []).length === 0 ? (
        <div className="bg-white border border-tn-border rounded-xl p-8 text-center text-tn-muted text-sm">
          No feature toggles found. Run the feature toggles migration on the server.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:hidden gap-3">
            {(toggles || []).map((t) => (
              <div key={t.feature_key} className="bg-white border border-tn-border rounded-xl p-4">
                <FeatureRow
                  toggle={t}
                  enabled={isEnabled(t.feature_key)}
                  saving={saving === t.feature_key}
                  onToggle={() => toggle(t.feature_key, t.is_enabled)}
                />
              </div>
            ))}
          </div>

          <div className="hidden sm:block bg-white border border-tn-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-tn-light text-tn-muted text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Feature</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tn-border">
                {(toggles || []).map((t) => (
                  <tr key={t.feature_key}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-tn-text">
                        <Icon name={getFeatureIcon(t.feature_key)} size={16} />
                        <span>{getFeatureLabel(t.feature_key)}</span>
                      </div>
                      <p className="text-[10px] text-tn-muted mt-0.5 font-mono">{t.feature_key}</p>
                    </td>
                    <td className="px-4 py-3 text-tn-muted">
                      {t.description}
                      {t.feature_key === FEATURE_LANGUAGE_CONVERSION ? (
                        <p className="text-[10px] text-tn-subtle mt-1">Shows English, Tamil, and Hindi picker in Settings</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          isEnabled(t.feature_key) ? 'bg-tn-success text-white' : 'bg-tn-error-bg text-tn-error'
                        }`}
                      >
                        {isEnabled(t.feature_key) ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggle(t.feature_key, t.is_enabled)}
                        disabled={saving === t.feature_key}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isEnabled(t.feature_key)
                            ? 'border-tn-error text-tn-error hover:bg-tn-error'
                            : 'bg-tn-yellow text-black hover:bg-tn-yellow-2'
                        }`}
                      >
                        {saving === t.feature_key ? 'Saving…' : isEnabled(t.feature_key) ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
