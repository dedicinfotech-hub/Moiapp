'use client';

import { useEffect, useState } from 'react';
import { adminApi, SupportTicket } from '@/lib/api';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features' | 'admin-dashboard' | 'admin-users' | 'admin-analytics' | 'admin-revenue' | 'admin-support';

interface ModuleAdminSupportProps {
  onNavigate: (m: Module) => void;
}

export default function ModuleAdminSupport({ onNavigate }: ModuleAdminSupportProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('open');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getTickets(status);
      setTickets(response.tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [status]);

  const handleResolve = async (ticketId: number) => {
    if (!confirm('Mark this ticket as resolved?')) return;
    try {
      setActionLoading(ticketId);
      await adminApi.resolveTicket(ticketId);
      loadTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resolve ticket');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-[#101010]">Support & Complaints</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white border border-[#EBEBEB] rounded-xl p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded mb-2 w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded mb-1 w-2/3"></div>
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
        <h2 className="font-bold text-lg text-[#101010]">Support & Complaints</h2>
        <button
          onClick={() => onNavigate('admin-dashboard')}
          className="text-sm text-[#FFC107] font-semibold hover:underline"
        >
          ← Back to Admin
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['open', 'in_progress', 'resolved', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              status === s
                ? 'bg-[#FFC107] text-black'
                : 'bg-white border border-[#E8E8E8] text-[#666] hover:border-[#FFC107]',
            ].join(' ')}
          >
            {s === 'open' ? 'Open' : s === 'in_progress' ? 'In Progress' : s === 'resolved' ? 'Resolved' : 'All'}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
        {tickets.length === 0 ? (
          <div className="py-10 text-center text-[#bbb] text-sm">No tickets found</div>
        ) : (
          <div className="divide-y divide-[#F8F8F8]">
            {tickets.map((t) => (
              <div key={t.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#101010] truncate">{t.subject}</p>
                    <p className="text-xs text-[#999] truncate">
                      From: {t.user_name} ({t.user_email})
                    </p>
                    <p className="text-[10px] text-[#bbb]">
                      {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={[
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      t.status === 'open' ? 'bg-blue-100 text-blue-700' :
                      t.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    ].join(' ')}>
                      {t.status === 'open' ? 'Open' : t.status === 'in_progress' ? 'In Progress' : 'Resolved'}
                    </span>
                    {t.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolve(t.id)}
                        disabled={actionLoading === t.id}
                        className="text-xs text-green-600 hover:underline disabled:opacity-50"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="text-xs text-[#FFC107] hover:underline"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-[#101010] mb-3">{selectedTicket.subject}</h3>
            <div className="space-y-2 mb-4">
              <p className="text-xs text-[#999]">
                <span className="font-semibold">From:</span> {selectedTicket.user_name} ({selectedTicket.user_email})
              </p>
              <p className="text-xs text-[#999]">
                <span className="font-semibold">Date:</span> {new Date(selectedTicket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <p className="text-sm text-[#444] mb-4 whitespace-pre-wrap">{selectedTicket.message}</p>
            <div className="flex justify-end gap-2">
              {selectedTicket.status !== 'resolved' && (
                <button
                  onClick={() => { handleResolve(selectedTicket.id); setSelectedTicket(null); }}
                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200"
                >
                  Mark Resolved
                </button>
              )}
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-3 py-1.5 bg-[#F5F5F5] text-[#666] rounded-lg text-xs font-medium hover:bg-[#EBEBEB]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}