'use client';

import { useEffect, useState } from 'react';
import { adminApi, showError } from '@/lib/api';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features' | 'admin-dashboard' | 'admin-users' | 'admin-analytics' | 'admin-revenue' | 'admin-support' | 'admin-login-logs';

interface ModuleAdminLoginLogsProps {
  onNavigate: (m: Module) => void;
}

type LoginLog = {
  id: number;
  user_id: number | null;
  email: string | null;
  role: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failed' | 'blocked' | 'logout';
  created_at: string;
};

export default function ModuleAdminLoginLogs({ onNavigate }: ModuleAdminLoginLogsProps) {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'all' | 'success' | 'failed' | 'blocked' | 'logout'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getLoginLogs({
        page,
        limit: 50,
        status: status === 'all' ? undefined : status,
        search: search || undefined,
      });
      setLogs(response.logs);
      setTotalPages(response.pagination.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load login logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, status, search]);

  const statusClass = (s: string) => {
    if (s === 'success') return 'text-green-600';
    if (s === 'blocked') return 'text-amber-600';
    if (s === 'logout') return 'text-blue-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              setSearch(searchInput.trim());
            }
          }}
          placeholder="Search email, IP, or user agent…"
          className="flex-1 border border-tn-border rounded-xl px-4 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={() => { setPage(1); setSearch(searchInput.trim()); }}
          className="px-4 py-2.5 rounded-xl bg-tn-yellow text-black text-sm font-semibold"
        >
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'success', 'failed', 'blocked', 'logout'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => { setPage(1); setStatus(f); }}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border capitalize ${
              status === f ? 'bg-tn-yellow border-tn-yellow text-black' : 'border-tn-border text-tn-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-tn-muted">Loading login logs…</div>
      ) : error ? (
        <div className="bg-tn-error-bg border border-tn-error rounded-xl p-5">
          <p className="text-tn-error">{error}</p>
        </div>
      ) : (
        <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-tn-light border-b border-tn-border">
                <tr>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Role</th>
                  <th className="text-left p-3 font-semibold">IP</th>
                  <th className="text-left p-3 font-semibold">Device</th>
                  <th className="text-left p-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-tn-border last:border-0">
                    <td className="p-3">{log.email || '—'}</td>
                    <td className={`p-3 font-semibold capitalize ${statusClass(log.status)}`}>{log.status}</td>
                    <td className="p-3">{log.role || 'user'}</td>
                    <td className="p-3 font-mono text-xs">{log.ip_address || '—'}</td>
                    <td className="p-3 text-xs text-tn-muted max-w-[200px] truncate" title={log.user_agent || ''}>
                      {log.user_agent || '—'}
                    </td>
                    <td className="p-3 text-tn-muted whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {!logs.length ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-tn-muted">No login logs found</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-lg border border-tn-border disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-tn-muted">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border border-tn-border disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
