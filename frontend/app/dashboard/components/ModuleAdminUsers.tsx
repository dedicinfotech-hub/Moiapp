'use client';

import { useEffect, useState } from 'react';
import { adminApi, AdminUser } from '@/lib/api';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features' | 'admin-dashboard' | 'admin-users' | 'admin-analytics' | 'admin-revenue' | 'admin-support';

interface ModuleAdminUsersProps {
  onNavigate: (m: Module) => void;
}

export default function ModuleAdminUsers({ onNavigate }: ModuleAdminUsersProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers(search, filter);
      setUsers(response.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, filter]);

  const handleBlock = async (userId: number) => {
    if (!confirm('Are you sure you want to block this user?')) return;
    try {
      setActionLoading(userId);
      await adminApi.blockUser(userId);
      loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to block user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      setActionLoading(userId);
      await adminApi.deleteUser(userId);
      loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-[#101010]">User Management</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white border border-[#EBEBEB] rounded-xl p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded mb-2 w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded mb-1 w-1/2"></div>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-[#101010]">User Management</h2>
        <button
          onClick={() => onNavigate('admin-dashboard')}
          className="text-sm text-[#FFC107] font-semibold hover:underline"
        >
          ← Back to Admin
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-[#E8E8E8] rounded-lg text-sm focus:outline-none focus:border-[#FFC107]"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-[#E8E8E8] rounded-lg text-sm focus:outline-none focus:border-[#FFC107]"
        >
          <option value="all">All Users</option>
          <option value="active">Active (30 days)</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Users List */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
        {users.length === 0 ? (
          <div className="py-10 text-center text-[#bbb] text-sm">No users found</div>
        ) : (
          <div className="divide-y divide-[#F8F8F8]">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-10 h-10 rounded-full bg-[#FFFCF5] border border-[#FFE082] flex items-center justify-center text-[#B8860B] font-bold text-sm shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#101010] truncate">{u.name}</p>
                  <p className="text-xs text-[#999] truncate">
                    {u.city && `${u.city} • `}{u.phone && `${u.phone} • `}{u.function_count} events
                  </p>
                  <p className="text-[10px] text-[#bbb]">
                    Joined: {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {u.is_blocked ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Blocked</span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                  )}
                  {!u.is_blocked && (
                    <button
                      onClick={() => handleBlock(u.id)}
                      disabled={actionLoading === u.id}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      Block
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={actionLoading === u.id}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}