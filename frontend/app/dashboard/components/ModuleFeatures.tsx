'use client';

import { useState, useEffect } from 'react';
import { featuresApi } from '@/lib/api';

interface ModuleFeaturesProps {
  isAdmin: boolean;
}

export default function ModuleFeatures({ isAdmin }: ModuleFeaturesProps) {
  const [toggles, setToggles] = useState<{ feature_key: string; is_enabled: number; description: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

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
        <div className="text-6xl mb-4">🔒</div>
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
        <h2 className="text-lg font-bold text-[#101010]">Feature Toggles</h2>
        <p className="text-xs text-[#999]">Enable or disable app features post-launch</p>
      </div>

      {loading ? (
        <div className="text-sm text-[#666]">Loading…</div>
      ) : (
        <div className="bg-white border border-[#E8E8E8] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5] text-[#666] text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Feature</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8]">
              {toggles.map((t) => (
                <tr key={t.feature_key}>
                  <td className="px-4 py-3 font-medium text-[#101010]">{t.feature_key}</td>
                  <td className="px-4 py-3 text-[#444]">{t.description}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.is_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggle(t.feature_key, t.is_enabled)}
                      disabled={saving === t.feature_key}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${t.is_enabled ? 'border border-red-200 text-red-500 hover:bg-red-50' : 'bg-[#FFC107] text-black hover:bg-[#E6AC00]'}`}
                    >
                      {saving === t.feature_key ? 'Saving…' : t.is_enabled ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}