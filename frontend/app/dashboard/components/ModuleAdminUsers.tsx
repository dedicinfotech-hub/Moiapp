'use client';

import { useEffect, useState } from 'react';
import { adminApi, AdminUser, showError } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';

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
  const [confirmBlockId, setConfirmBlockId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

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
    setConfirmBlockId(userId);
  };

  const confirmBlock = async () => {
    if (!confirmBlockId) return;
    const userId = confirmBlockId;
    setConfirmBlockId(null);
    try {
      setActionLoading(userId);
      await adminApi.blockUser(userId);
      loadUsers();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to block user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: number) => {
    setConfirmDeleteId(userId);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    const userId = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      setActionLoading(userId);
      await adminApi.deleteUser(userId);
      loadUsers();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-tn-text">User Management</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white border border-tn-border rounded-xl p-4 animate-pulse">
              <div className="h-5 bg-tn-border rounded mb-2 w-1/3"></div>
              <div className="h-4 bg-tn-border rounded mb-1 w-1/2"></div>
              <div className="h-3 bg-tn-border rounded w-1/4"></div>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-tn-text">User Management</h2>
        <button
           onClick={() => onNavigate('admin-dashboard')}
           className="text-sm text-tn-yellow font-semibold hover:underline"
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
           className="flex-1 px-3 py-2 border border-tn-border rounded-xl text-sm focus:outline-none focus:border-tn-yellow"
         />
         <select
           value={filter}
           onChange={(e) => setFilter(e.target.value)}
           className="px-3 py-2 border border-tn-border rounded-xl text-sm focus:outline-none focus:border-tn-yellow"
         >
          <option value="all">All Users</option>
          <option value="active">Active (30 days)</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Users List */}
      <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
        {users.length === 0 ? (
          <div className="py-10 text-center text-tn-subtle text-sm">No users found</div>
        ) : (
          <div className="divide-y divide-tn-border">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-10 h-10 rounded-full bg-tn-light border border-tn-yellow flex items-center justify-center text-tn-gold font-bold text-sm shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-tn-text truncate">{u.name}</p>
                  <p className="text-xs text-tn-muted truncate">
                    {u.city && `${u.city} • `}{u.phone && `${u.phone} • `}{u.function_count} events
                  </p>
                  <p className="text-[10px] text-tn-subtle">
                    Joined: {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {u.is_blocked ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tn-error text-white">Blocked</span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tn-success text-white">Active</span>
                  )}
                  {!u.is_blocked && (
                    <button
                      onClick={() => handleBlock(u.id)}
                      disabled={actionLoading === u.id}
                      className="text-xs text-tn-error hover:underline disabled:opacity-50"
                    >
                      Block
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={actionLoading === u.id}
                    className="text-xs text-tn-error hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmBlockId !== null}
        title="Block User"
        message="Are you sure you want to block this user?"
        confirmText="Block"
        variant="danger"
        onConfirm={confirmBlock}
        onCancel={() => setConfirmBlockId(null)}
      />

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Delete User"
        message="This action cannot be undone. Are you sure you want to delete this user?"
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}