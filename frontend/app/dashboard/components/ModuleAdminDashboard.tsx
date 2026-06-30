'use client';

import { useEffect, useState } from 'react';
import Icon, { type IconName } from '@/components/ui/Icon';
import { adminApi } from '@/lib/api';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features' | 'admin-dashboard' | 'admin-users' | 'admin-analytics' | 'admin-revenue' | 'admin-support' | 'admin-approvals' | 'admin-login-logs';

interface ModuleAdminDashboardProps {
  onNavigate: (m: Module) => void;
}

interface StatCardProps {
  icon: IconName;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-white border border-tn-border rounded-xl p-4">
      <span className="text-2xl text-tn-gold">
        <Icon name={icon} size={24} />
      </span>
      <p className="text-xl font-bold text-tn-text mt-2">{value}</p>
      <p className="text-xs text-tn-muted mt-0.5">{label}</p>
    </div>
  );
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
            <div key={i} className="bg-white border border-tn-border rounded-xl p-4 animate-pulse">
              <div className="w-8 h-8 bg-tn-border rounded mb-2"></div>
              <div className="h-6 bg-tn-border rounded mb-1 w-3/4"></div>
              <div className="h-3 bg-tn-border rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-tn-error-bg border-tn-error rounded-xl p-5">
        <p className="text-tn-error">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="users" label="Registered Users" value={String(stats?.totalUsers ?? 0)} />
        <StatCard icon="calendar" label="New Users Today" value={String(stats?.newToday ?? 0)} />
        <StatCard icon="users" label="Active Organizers Today" value={String(stats?.activeToday ?? 0)} />
        <StatCard icon="wedding" label="Events Created" value={String(stats?.totalFunctions ?? 0)} />
        <StatCard icon="wallet" label="Moi Collected This Month" value={formatCurrency(stats?.monthlyRevenue ?? 0)} />
        <StatCard icon="qr-code" label="Active Online Events" value={String(stats?.activePrivateEvents ?? 0)} />
        <StatCard icon="approval" label="Pending Event Reviews" value={String(stats?.pendingApprovals ?? 0)} />
        <StatCard icon="ticket" label="Open Support Tickets" value={String(stats?.openTickets ?? 0)} />
        <StatCard icon="trend" label="Revenue vs Last Month" value={
          stats?.lastMonthRevenue && stats.monthlyRevenue
            ? `${Math.round((stats.monthlyRevenue / stats.lastMonthRevenue - 1) * 100)}%`
            : '0%'
        } />
      </div>

      {/* Quick navigation cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Function Approvals */}
        <div className="bg-white border border-tn-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl text-tn-gold"><Icon name="approval" size={24} /></span>
              <h3 className="font-semibold text-tn-text">Event Review Queue</h3>
            </div>
          <p className="text-sm text-tn-muted mb-2">
            {stats?.pendingApprovals ?? 0} event{(stats?.pendingApprovals ?? 0) !== 1 ? 's' : ''} pending admin review.
          </p>
          <p className="text-xs text-tn-muted mb-4">Prioritize newly submitted events and approval follow-ups.</p>
          <button
            onClick={() => onNavigate('admin-approvals')}
            className="w-full bg-tn-yellow text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-tn-yellow-2 transition-colors"
          >
            Open Review Queue
          </button>
        </div>

        {/* User Management */}
        <div className="bg-white border border-tn-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl text-tn-gold"><Icon name="users" size={24} /></span>
              <h3 className="font-semibold text-tn-text">Organizer Accounts</h3>
            </div>
          <p className="text-sm text-tn-muted mb-4">
            Review organizer accounts, access status, and event activity.
          </p>
          <button
            onClick={() => onNavigate('admin-users')}
            className="w-full bg-tn-yellow text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-tn-yellow-2 transition-colors"
          >
            Manage Organizers
          </button>
        </div>

        {/* Analytics */}
        <div className="bg-white border border-tn-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl text-tn-gold"><Icon name="trend" size={24} /></span>
              <h3 className="font-semibold text-tn-text">Platform Analytics</h3>
            </div>
          <p className="text-sm text-tn-muted mb-4">
            Track registrations, event growth, guest cities, and event-type usage.
          </p>
          <button
            onClick={() => onNavigate('admin-analytics')}
            className="w-full bg-tn-yellow text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-tn-yellow-2 transition-colors"
          >
            View Analytics
          </button>
        </div>

        {/* Revenue */}
        <div className="bg-white border border-tn-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl text-tn-gold"><Icon name="wallet" size={24} /></span>
              <h3 className="font-semibold text-tn-text">Moi Collection</h3>
            </div>
          <p className="text-sm text-tn-muted mb-4">
            Monitor cash moi collected across all events for this month and lifetime.
          </p>
          <button
            onClick={() => onNavigate('admin-revenue')}
            className="w-full bg-tn-yellow text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-tn-yellow-2 transition-colors"
          >
            View Collection Report
          </button>
        </div>

        {/* Settings */}
        <div className="bg-white border border-tn-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl text-tn-gold"><Icon name="settings" size={24} /></span>
              <h3 className="font-semibold text-tn-text">Platform Settings</h3>
            </div>
          <p className="text-sm text-tn-muted mb-4">
            Manage feature toggles, payment options, and platform configuration.
          </p>
          <button
            onClick={() => onNavigate('settings')}
            className="w-full bg-tn-yellow text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-tn-yellow-2 transition-colors"
          >
            Open Platform Settings
          </button>
        </div>

        {/* Support & Complaints */}
        <div className="bg-white border border-tn-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl text-tn-gold"><Icon name="ticket" size={24} /></span>
              <h3 className="font-semibold text-tn-text">Support Tickets</h3>
            </div>
          <p className="text-sm text-tn-muted mb-4">
            Review open and in-progress support requests from organizers.
          </p>
          <button
            onClick={() => onNavigate('admin-support')}
            className="w-full bg-tn-yellow text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-tn-yellow-2 transition-colors"
          >
            View Support Tickets
          </button>
        </div>

        {/* Login Logs */}
        <div className="bg-white border border-tn-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl text-tn-gold"><Icon name="settings" size={24} /></span>
              <h3 className="font-semibold text-tn-text">Login Audit Logs</h3>
            </div>
          <p className="text-sm text-tn-muted mb-4">
            Review successful, failed, and blocked login attempts across the platform.
          </p>
          <button
            onClick={() => onNavigate('admin-login-logs')}
            className="w-full bg-tn-yellow text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-tn-yellow-2 transition-colors"
          >
            View Login Logs
          </button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="bg-white border border-tn-border rounded-xl p-5">
        <h3 className="font-semibold text-tn-text text-sm mb-4">Moi Collection Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-tn-light rounded-lg">
            <p className="text-2xl font-bold text-tn-text">{formatCurrency(stats?.monthlyRevenue ?? 0)}</p>
            <p className="text-xs text-tn-muted mt-1">Collected This Month</p>
          </div>
          <div className="text-center p-4 bg-tn-light rounded-lg">
            <p className="text-2xl font-bold text-tn-text">{formatCurrency(stats?.lastMonthRevenue ?? 0)}</p>
            <p className="text-xs text-tn-muted mt-1">Collected Last Month</p>
          </div>
          <div className="text-center p-4 bg-tn-light rounded-lg">
            <p className="text-2xl font-bold text-tn-text">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
            <p className="text-xs text-tn-muted mt-1">Lifetime Collection</p>
          </div>
        </div>
      </div>
    </div>
  );
}