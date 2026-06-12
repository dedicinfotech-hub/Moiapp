'use client';

import { useEffect, useState } from 'react';
import { Event, eventsApi, showSuccess } from '@/lib/api';
import EventStatusBadges from '@/components/EventStatusBadges';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features' | 'admin-dashboard' | 'admin-users' | 'admin-analytics' | 'admin-revenue' | 'admin-support' | 'admin-approvals';

interface ModuleAdminApprovalsProps {
  onNavigate: (m: Module) => void;
  onRefresh?: () => void;
}

function getEventLabel(ev: Event): string {
  if (ev.event_type === 'custom' && ev.custom_title) return ev.custom_title;
  if (ev.event_type === 'birthday') return ev.birthday_person_name || 'Birthday';
  if (ev.event_type === 'graduation') return ev.graduate_name || 'Graduation';
  if (ev.event_type === 'housewarming') return `${ev.host_name || ''} & ${ev.spouse_name || ''}`;
  return `${ev.bride_name || ''} & ${ev.groom_name || ''}`;
}

export default function ModuleAdminApprovals({ onNavigate, onRefresh }: ModuleAdminApprovalsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'rejected' | 'all'>('pending');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await eventsApi.listPending(filter);
      setEvents(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this function? Host can start moi collection after approval.')) return;
    try {
      setActionLoading(id);
      await eventsApi.approve(id, { status: 'approved' });
      showSuccess('Function approved');
      await load();
      onRefresh?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    try {
      setActionLoading(rejectingId);
      await eventsApi.approve(rejectingId, { status: 'rejected', reason: rejectReason.trim() });
      showSuccess('Function rejected — host notified');
      setRejectingId(null);
      setRejectReason('');
      await load();
      onRefresh?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg text-[#101010]">Function Approvals</h2>
          <p className="text-xs text-[#999] mt-0.5">Review new events before moi collection begins</p>
        </div>
        <button
          onClick={() => onNavigate('admin-dashboard')}
          className="text-sm text-[#FFC107] font-semibold hover:underline text-left"
        >
          ← Back to Admin
        </button>
      </div>

      <div className="flex gap-2">
        {(['pending', 'rejected', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
              filter === s
                ? 'bg-[#FFC107] text-black'
                : 'bg-white border border-[#E8E8E8] text-[#666] hover:border-[#FFC107]',
            ].join(' ')}
          >
            {s === 'all' ? 'All Queue' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#EBEBEB] rounded-xl p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-600 text-sm">{error}</div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-[#EBEBEB] rounded-xl py-16 text-center text-[#bbb] text-sm">
          No functions in this queue
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-[#101010]">{getEventLabel(ev)}</p>
                    <EventStatusBadges event={ev} />
                  </div>
                  <p className="text-xs text-[#666] capitalize">
                    {ev.event_type} · {new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {ev.venue && ` · ${ev.venue}`}
                    {ev.city && ` · ${ev.city}`}
                  </p>
                  <p className="text-xs text-[#999] mt-1">
                    Host: {ev.creator_name || '—'}
                    {ev.creator_phone && ` · ${ev.creator_phone}`}
                  </p>
                  {ev.approval_reason && (
                    <p className="text-xs text-red-600 mt-2 bg-red-50 rounded-lg px-2 py-1.5">
                      Rejection reason: {ev.approval_reason}
                    </p>
                  )}
                </div>
                {ev.approval_status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(ev.id)}
                      disabled={actionLoading === ev.id}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === ev.id ? '…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => { setRejectingId(ev.id); setRejectReason(''); }}
                      disabled={actionLoading === ev.id}
                      className="px-4 py-2 rounded-lg text-xs font-bold border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-[#101010] mb-1">Reject Function</h3>
            <p className="text-xs text-[#666] mb-4">
              Provide a reason in English or Tamil. The host will see this and can resubmit.
            </p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Invalid venue details / தவறான இட விவரங்கள்"
              className="w-full border border-[#E8E8E8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#FFC107] resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                className="flex-1 border border-[#E8E8E8] text-[#666] py-2.5 rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === rejectingId}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-bold disabled:opacity-50"
              >
                Reject Function
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
