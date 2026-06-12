'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features' | 'admin-dashboard' | 'admin-users' | 'admin-analytics' | 'admin-revenue' | 'admin-support';

interface ModuleAdminDashboardProps {
  onNavigate: (m: Module) => void;
}

export default function ModuleAdminDashboard({ onNavigate }: ModuleAdminDashboardProps) {
  const [stats, setStats] = useState<{
    totalUsers: number;
    newToday: number;
    activeToday: number;
    totalFunctions: number;
    monthlyRevenue: number;
    lastMonthRevenue: number;
    totalRevenue: number;
    openTickets: number;
    pendingApprovals: number;
    activePrivateEvents: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    loadStats();
  }, []);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-[#EBEBEB] rounded-xl p-4 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-1 w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4">
          <span className="text-2xl">👥</span>
          <p className="text-xl font-bold text-[#101010] mt-2">{stats?.totalUsers ?? 0}</p>
          <p className="text-xs text-[#999] mt-0.5">Total Users</p>
        </div>
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4">
          <span className="text-2xl">🆕</span>
          <p className="text-xl font-bold text-[#101010] mt-2">{stats?.newToday ?? 0}</p>
          <p className="text-xs text-[#999] mt-0.5">New Today</p>
        </div>
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4">
          <span className="text-2xl">🔥</span>
          <p className="text-xl font-bold text-[#101010] mt-2">{stats?.activeToday ?? 0}</p>
          <p className="text-xs text-[#999] mt-0.5">Active Today</p>
        </div>
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4">
          <span className="text-2xl">💍</span>
          <p className="text-xl font-bold text-[#101010] mt-2">{stats?.totalFunctions ?? 0}</p>
          <p className="text-xs text-[#999] mt-0.5">Total Functions</p>
        </div>
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4">
          <span className="text-2xl">📅</span>
          <p className="text-xl font-bold text-[#101010] mt-2">{formatCurrency(stats?.monthlyRevenue ?? 0)}</p>
          <p className="text-xs text-[#999] mt-0.5">This Month Revenue</p>
        </div>
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4">
          <span className="text-2xl">🔒</span>
          <p className="text-xl font-bold text-[#101010] mt-2">{stats?.activePrivateEvents ?? 0}</p>
          <p className="text-xs text-[#999] mt-0.5">Active Private Events</p>
        </div>
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4">
          <span className="text-2xl">✅</span>
          <p className="text-xl font-bold text-[#101010] mt-2">{stats?.pendingApprovals ?? 0}</p>
          <p className="text-xs text-[#999] mt-0.5">Pending Approvals</p>
        </div>
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4">
          <span className="text-2xl">🎫</span>
          <p className="text-xl font-bold text-[#101010] mt-2">{stats?.openTickets ?? 0}</p>
          <p className="text-xs text-[#999] mt-0.5">Open Tickets</p>
        </div>
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4">
          <span className="text-2xl">📈</span>
          <p className="text-xl font-bold text-[#101010] mt-2">
            {stats?.lastMonthRevenue && stats.monthlyRevenue 
              ? `${Math.round((stats.monthlyRevenue / stats.lastMonthRevenue - 1) * 100)}%`
              : '0%'}
          </p>
          <p className="text-xs text-[#999] mt-0.5">vs Last Month</p>
        </div>
      </div>

      {/* Quick navigation cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Function Approvals */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">✅</span>
            <h3 className="font-semibold text-[#101010]">Function Approvals</h3>
          </div>
          <p className="text-sm text-[#666] mb-2">
            {stats?.pendingApprovals ?? 0} function{(stats?.pendingApprovals ?? 0) !== 1 ? 's' : ''} awaiting review.
          </p>
          <p className="text-xs text-[#999] mb-4">Approval usually within 24 hours.</p>
          <button
            onClick={() => onNavigate('admin-approvals')}
            className="w-full bg-[#FFC107] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors"
          >
            Review Queue
          </button>
        </div>

        {/* User Management */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">👥</span>
            <h3 className="font-semibold text-[#101010]">User Management</h3>
          </div>
          <p className="text-sm text-[#666] mb-4">
            Manage all users, block or delete accounts as needed.
          </p>
          <button
            onClick={() => onNavigate('admin-users')}
            className="w-full bg-[#FFC107] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors"
          >
            Manage Users
          </button>
        </div>

        {/* Analytics */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📈</span>
            <h3 className="font-semibold text-[#101010]">Analytics</h3>
          </div>
          <p className="text-sm text-[#666] mb-4">
            View user growth, top cities, and feature usage trends.
          </p>
          <button
            onClick={() => onNavigate('admin-analytics')}
            className="w-full bg-[#FFC107] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors"
          >
            View Analytics
          </button>
        </div>

        {/* Revenue */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💰</span>
            <h3 className="font-semibold text-[#101010]">Revenue</h3>
          </div>
          <p className="text-sm text-[#666] mb-4">
            Track platform revenue, payment methods, and financial reports.
          </p>
          <button
            onClick={() => onNavigate('admin-revenue')}
            className="w-full bg-[#FFC107] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors"
          >
            View Revenue
          </button>
        </div>

        {/* Settings */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚙️</span>
            <h3 className="font-semibold text-[#101010]">Settings</h3>
          </div>
          <p className="text-sm text-[#666] mb-4">
            Manage app settings, feature toggles, and platform configuration.
          </p>
          <button
            onClick={() => onNavigate('settings')}
            className="w-full bg-[#FFC107] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors"
          >
            Open Settings
          </button>
        </div>

        {/* Support & Complaints */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎫</span>
            <h3 className="font-semibold text-[#101010]">Support & Complaints</h3>
          </div>
          <p className="text-sm text-[#666] mb-4">
            View and resolve user support tickets.
          </p>
          <button
            onClick={() => onNavigate('admin-support')}
            className="w-full bg-[#FFC107] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E6AC00] transition-colors"
          >
            View Tickets
          </button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
        <h3 className="font-semibold text-[#101010] text-sm mb-4">Revenue Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-[#F8F8F8] rounded-lg">
            <p className="text-2xl font-bold text-[#101010]">{formatCurrency(stats?.monthlyRevenue ?? 0)}</p>
            <p className="text-xs text-[#666] mt-1">This Month</p>
          </div>
          <div className="text-center p-4 bg-[#F8F8F8] rounded-lg">
            <p className="text-2xl font-bold text-[#101010]">{formatCurrency(stats?.lastMonthRevenue ?? 0)}</p>
            <p className="text-xs text-[#666] mt-1">Last Month</p>
          </div>
          <div className="text-center p-4 bg-[#F8F8F8] rounded-lg">
            <p className="text-2xl font-bold text-[#101010]">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
            <p className="text-xs text-[#666] mt-1">Total Since Launch</p>
          </div>
        </div>
      </div>
    </div>
  );
}