'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features' | 'admin-dashboard' | 'admin-users' | 'admin-analytics' | 'admin-revenue' | 'admin-support';

interface ModuleAdminRevenueProps {
  onNavigate: (m: Module) => void;
}

export default function ModuleAdminRevenue({ onNavigate }: ModuleAdminRevenueProps) {
  const [stats, setStats] = useState<{
    totalUsers: number;
    monthlyRevenue: number;
    lastMonthRevenue: number;
    totalRevenue: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getStats();
      setStats(response.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-[#101010]">Revenue Management</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#EBEBEB] rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded mb-1 w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
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

  const growth = stats?.lastMonthRevenue && stats.monthlyRevenue 
    ? ((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-[#101010]">Revenue Management</h2>
        <button
          onClick={() => onNavigate('admin-dashboard')}
          className="text-sm text-[#FFC107] font-semibold hover:underline"
        >
          ← Back to Admin
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <p className="text-xs text-[#999] mb-1">This Month</p>
          <p className="text-2xl font-bold text-[#101010]">{formatCurrency(stats?.monthlyRevenue ?? 0)}</p>
          <p className="text-xs text-[#666] mt-1">vs Last Month: {growth}%</p>
        </div>
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <p className="text-xs text-[#999] mb-1">Last Month</p>
          <p className="text-2xl font-bold text-[#101010]">{formatCurrency(stats?.lastMonthRevenue ?? 0)}</p>
        </div>
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <p className="text-xs text-[#999] mb-1">Total Since Launch</p>
          <p className="text-2xl font-bold text-[#101010]">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
        </div>
      </div>

      {/* User Stats */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
        <h3 className="font-semibold text-[#101010] text-sm mb-4">User Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-[#F8F8F8] rounded-lg">
            <p className="text-2xl font-bold text-[#101010]">{stats?.totalUsers ?? 0}</p>
            <p className="text-xs text-[#666] mt-1">Total Users</p>
          </div>
          <div className="text-center p-4 bg-[#F8F8F8] rounded-lg">
            <p className="text-2xl font-bold text-[#101010]">100%</p>
            <p className="text-xs text-[#666] mt-1">Free Users (All users are free)</p>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
        <h3 className="font-semibold text-[#101010] text-sm mb-4">Recent Payments</h3>
        <p className="text-sm text-[#666]">
          All moi entries are tracked as payments. Revenue is calculated from cash moi entries.
          The system currently operates on a free model for all users.
        </p>
        <div className="mt-4 p-4 bg-[#FFFCF5] border border-[#FFE082] rounded-lg">
          <p className="text-xs text-[#B8860B]">
            <strong>Note:</strong> Premium plans can be added in the future. All revenue shown is from
            cash moi contributions collected by event hosts.
          </p>
        </div>
      </div>
    </div>
  );
}