'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features' | 'admin-dashboard' | 'admin-users' | 'admin-analytics' | 'admin-revenue' | 'admin-support';

interface ModuleAdminAnalyticsProps {
  onNavigate: (m: Module) => void;
}

export default function ModuleAdminAnalytics({ onNavigate }: ModuleAdminAnalyticsProps) {
  const [analytics, setAnalytics] = useState<{
    userGrowth: Array<{ date: string; count: number }>;
    topCities: Array<{ city: string; count: number }>;
    peakMonths: Array<{ month: string; count: number }>;
    featureUsage: Array<{ event_type: string; count: number }>;
    premiumRatio: { premium: number; free: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('daily');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAnalytics(period);
      setAnalytics(response.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!analytics) return;
    const rows: string[][] = [['Metric', 'Value']];
    analytics.userGrowth.forEach((item) => rows.push([item.date, String(item.count)]));
    analytics.topCities.forEach((item) => rows.push([`City: ${item.city}`, String(item.count)]));
    analytics.peakMonths.forEach((item) => rows.push([`Month: ${item.month}`, String(item.count)]));
    analytics.featureUsage.forEach((item) => rows.push([`Feature: ${item.event_type}`, String(item.count)]));
    rows.push(['Premium Users', String(analytics.premiumRatio.premium)]);
    rows.push(['Free Users', String(analytics.premiumRatio.free)]);
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-[#101010]">Admin Analytics</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-[#EBEBEB] rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded mb-4 w-1/2"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-[#101010]">Admin Analytics</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="text-xs bg-white border border-[#E8E8E8] text-[#666] px-3 py-1.5 rounded-lg hover:border-[#FFC107] transition-colors"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => onNavigate('admin-dashboard')}
            className="text-sm text-[#FFC107] font-semibold hover:underline"
          >
            ← Back to Admin
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2">
        {['daily', 'weekly', 'monthly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              period === p
                ? 'bg-[#FFC107] text-black'
                : 'bg-white border border-[#E8E8E8] text-[#666] hover:border-[#FFC107]',
            ].join(' ')}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Growth Chart */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <h3 className="font-semibold text-[#101010] text-sm mb-4">User Growth</h3>
          {analytics?.userGrowth && analytics.userGrowth.length > 0 ? (
            <div className="h-48 flex items-end gap-1 overflow-x-auto">
              {analytics.userGrowth.map((item, i) => {
                const max = Math.max(...analytics.userGrowth.map(g => g.count));
                const height = max > 0 ? (item.count / max) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-[#FFC107] rounded-t" style={{ height: `${height}%` }}></div>
                    <span className="text-[10px] text-[#999] mt-1 truncate">{item.date}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[#bbb] text-sm">No data available</p>
          )}
        </div>

        {/* Top Cities */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <h3 className="font-semibold text-[#101010] text-sm mb-4">Top 5 Cities</h3>
          {analytics?.topCities && analytics.topCities.length > 0 ? (
            <div className="space-y-3">
              {analytics.topCities.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-[#444]">{i + 1}. {item.city}</span>
                  <span className="text-sm font-semibold text-[#101010]">{item.count} users</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#bbb] text-sm">No data available</p>
          )}
        </div>

        {/* Peak Function Months */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <h3 className="font-semibold text-[#101010] text-sm mb-4">Peak Function Months</h3>
          {analytics?.peakMonths && analytics.peakMonths.length > 0 ? (
            <div className="space-y-3">
              {analytics.peakMonths.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-[#444]">{item.month}</span>
                  <span className="text-sm font-semibold text-[#101010]">{item.count} events</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#bbb] text-sm">No data available</p>
          )}
        </div>

        {/* Feature Usage */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <h3 className="font-semibold text-[#101010] text-sm mb-4">Most Used Features</h3>
          {analytics?.featureUsage && analytics.featureUsage.length > 0 ? (
            <div className="space-y-3">
              {analytics.featureUsage.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-[#444] capitalize">{item.event_type}</span>
                  <span className="text-sm font-semibold text-[#101010]">{item.count} events</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#bbb] text-sm">No data available</p>
          )}
        </div>

        {/* Free vs Premium Ratio */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <h3 className="font-semibold text-[#101010] text-sm mb-4">Free vs Premium Users</h3>
          {analytics?.premiumRatio ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#444]">Free Users</span>
                <span className="text-sm font-semibold text-[#101010]">{analytics.premiumRatio.free}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#444]">Premium Users</span>
                <span className="text-sm font-semibold text-[#101010]">{analytics.premiumRatio.premium}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
                <div
                  className="bg-[#FFC107] h-2.5 rounded-full"
                  style={{
                    width: analytics.premiumRatio.premium + analytics.premiumRatio.free > 0
                      ? `${(analytics.premiumRatio.premium / (analytics.premiumRatio.premium + analytics.premiumRatio.free)) * 100}%`
                      : '0%',
                  }}
                ></div>
              </div>
              <p className="text-[10px] text-[#999]">
                {analytics.premiumRatio.premium + analytics.premiumRatio.free > 0
                  ? `${Math.round((analytics.premiumRatio.premium / (analytics.premiumRatio.premium + analytics.premiumRatio.free)) * 100)}% premium`
                  : 'No users'}
              </p>
            </div>
          ) : (
            <p className="text-[#bbb] text-sm">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}