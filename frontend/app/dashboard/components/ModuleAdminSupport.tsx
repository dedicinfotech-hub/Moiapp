'use client';

import { useEffect, useState } from 'react';
import { adminApi, SupportTicket, showError } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';

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
  const [confirmResolveId, setConfirmResolveId] = useState<number | null>(null);

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
    setConfirmResolveId(ticketId);
  };

  const confirmResolve = async () => {
    if (!confirmResolveId) return;
    const ticketId = confirmResolveId;
    setConfirmResolveId(null);
    try {
      setActionLoading(ticketId);
      await adminApi.resolveTicket(ticketId);
      loadTickets();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to resolve ticket');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-tn-text">Support & Complaints</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white border border-tn-border rounded-xl p-4 animate-pulse">
              <div className="h-5 bg-tn-border rounded mb-2 w-1/3"></div>
              <div className="h-4 bg-tn-border rounded mb-1 w-2/3"></div>
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
        <h2 className="font-bold text-lg text-tn-text">Support & Complaints</h2>
        <button
          onClick={() => onNavigate('admin-dashboard')}
          className="text-sm text-tn-yellow font-semibold hover:underline"
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
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
              status === s
                ? 'bg-tn-yellow text-black'
                : 'bg-white border border-tn-border text-tn-muted hover:border-tn-yellow',
            ].join(' ')}
          >
            {s === 'open' ? 'Open' : s === 'in_progress' ? 'In Progress' : s === 'resolved' ? 'Resolved' : 'All'}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
        {tickets.length === 0 ? (
          <div className="py-10 text-center text-tn-subtle text-sm">No tickets found</div>
        ) : (
          <div className="divide-y divide-tn-border">
            {tickets.map((t) => (
              <div key={t.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-tn-text truncate">{t.subject}</p>
                    <p className="text-xs text-tn-muted truncate">
                      From: {t.user_name} ({t.user_email})
                    </p>
                    <p className="text-[10px] text-tn-subtle">
                      {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={[
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      t.status === 'open' ? 'bg-tn-blue-bg text-tn-blue-soft' :
                      t.status === 'in_progress' ? 'bg-tn-yellow/20 text-tn-gold' :
                      'bg-tn-success text-white'
                    ].join(' ')}>
                      {t.status === 'open' ? 'Open' : t.status === 'in_progress' ? 'In Progress' : 'Resolved'}
                    </span>
                    {t.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolve(t.id)}
                        disabled={actionLoading === t.id}
                        className="text-xs text-tn-success hover:underline disabled:opacity-50"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="text-xs text-tn-yellow hover:underline"
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
            <h3 className="font-bold text-lg text-tn-text mb-3">{selectedTicket.subject}</h3>
            <div className="space-y-2 mb-4">
              <p className="text-xs text-tn-muted">
                <span className="font-semibold">From:</span> {selectedTicket.user_name} ({selectedTicket.user_email})
              </p>
              <p className="text-xs text-tn-muted">
                <span className="font-semibold">Date:</span> {new Date(selectedTicket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <p className="text-sm text-tn-muted mb-4 whitespace-pre-wrap">{selectedTicket.message}</p>
            <div className="flex justify-end gap-2">
              {selectedTicket.status !== 'resolved' && (
                <button
                  onClick={() => { handleResolve(selectedTicket.id); setSelectedTicket(null); }}
                  className="px-3 py-1.5 bg-tn-success text-white rounded-xl text-xs font-medium hover:bg-tn-success/80"
                >
                  Mark Resolved
                </button>
              )}
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-3 py-1.5 bg-tn-light text-tn-muted rounded-xl text-xs font-medium hover:bg-tn-border"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmResolveId !== null}
        title="Resolve Ticket"
        message="Mark this ticket as resolved?"
        confirmText="Resolve"
        variant="info"
        onConfirm={confirmResolve}
        onCancel={() => setConfirmResolveId(null)}
      />
    </div>
  );
}