'use client';

import { useState, useEffect } from 'react';
import Icon, { type IconName } from '@/components/ui/Icon';
import { featuresApi } from '@/lib/api';

interface ModuleFeaturesProps {
  isAdmin: boolean;
}

const featureIconMap: Record<string, IconName> = {
  upi_payment: 'wallet',
  bulk_import: 'upload',
  multi_organizer: 'users',
  pdf_export: 'download',
  whatsapp_share: 'share',
  qr_payment: 'qr-code',
};

function getFeatureIcon(featureKey: string): IconName {
  return featureIconMap[featureKey] || 'features';
}

export default function ModuleFeatures({ isAdmin }: ModuleFeaturesProps) {
  const [toggles, setToggles] = useState<{ feature_key: string; is_enabled: number; description: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await featuresApi.list();
      setToggles(Array.isArray(res.toggles) ? res.toggles : []);
    } catch {
      setToggles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (key: string, current: number) => {
    setSaving(key);
    try {
      await featuresApi.update(key, current ? 0 : 1);
      setToggles((prev) => prev.map((t) => t.feature_key === key ? { ...t, is_enabled: current ? 0 : 1 } : t));
    } catch {
      // silent
    } finally {
      setSaving(null);
    }
  };

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-tn-gold mb-4">
          <Icon name="lock" size={48} />
        </div>
        <h2 className="text-xl font-bold text-[#101010] mb-2">Access Denied</h2>
        <p className="text-sm text-[#666] text-center max-w-md">
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

      {loading ? (
        <div className="text-sm text-tn-muted">Loading…</div>
      ) : (toggles || []).length === 0 ? (
        <div className="bg-white border border-tn-border rounded-xl p-8 text-center text-tn-muted text-sm">
          No feature toggles found.
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="grid grid-cols-1 sm:hidden gap-3">
            {(toggles || []).map((t) => (
              <div key={t.feature_key} className="bg-white border border-tn-border rounded-xl p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-tn-light flex items-center justify-center text-tn-muted">
                    <Icon name={getFeatureIcon(t.feature_key)} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-tn-text truncate">{t.feature_key}</p>
                    <p className="text-[10px] text-tn-subtle truncate">{t.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.is_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => toggle(t.feature_key, t.is_enabled)}
                    disabled={saving === t.feature_key}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${t.is_enabled ? 'border border-red-200 text-red-500 hover:bg-red-50' : 'bg-tn-yellow text-black hover:bg-tn-yellow-2'}`}
                  >
                    {saving === t.feature_key ? 'Saving…' : t.is_enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
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
                        <span>{t.feature_key}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-tn-muted">{t.description}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.is_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.is_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggle(t.feature_key, t.is_enabled)}
                        disabled={saving === t.feature_key}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${t.is_enabled ? 'border border-red-200 text-red-500 hover:bg-red-50' : 'bg-tn-yellow text-black hover:bg-tn-yellow-2'}`}
                      >
                        {saving === t.feature_key ? 'Saving…' : t.is_enabled ? 'Disable' : 'Enable'}
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