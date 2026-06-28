'use client';

import { useState, useEffect, useCallback } from 'react';
import { Event, Organizer, organizersApi } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';

interface ModuleOrganizersProps {
  events: Event[];
  onRefresh: () => void;
}

export default function ModuleOrganizers({ events, onRefresh }: ModuleOrganizersProps) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('organizer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);

  const loadOrganizers = useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setError('');
    try {
      const data = await organizersApi.list(Number(selectedEventId));
      setOrganizers(data.organizers || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load organizers');
      setOrganizers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => { loadOrganizers(); }, [loadOrganizers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !email.trim()) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await organizersApi.add({
        event_id: Number(selectedEventId),
        email: email.trim(),
        role,
      });
      setEmail('');
      setRole('organizer');
      loadOrganizers();
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add organizer');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    setConfirmRemoveId(id);
  };

  const confirmRemove = async () => {
    if (!confirmRemoveId) return;
    const id = confirmRemoveId;
    setConfirmRemoveId(null);
    setLoading(true);
    try {
      await organizersApi.remove(id);
      loadOrganizers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove organizer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-tn-text">Event Organizers</h2>
          <p className="text-xs text-tn-muted">Manage who can access and edit this event</p>
        </div>
      </div>

      <div className="bg-white border border-tn-border rounded-xl p-5">
        <label className="block text-xs font-semibold text-tn-muted mb-1.5">Select Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full border border-tn-border rounded-lg px-3 py-2.5 text-sm text-tn-text"
        >
          <option value="">Choose an event…</option>
          {events.map((ev) => (
            <option key={ev.id} value={String(ev.id)}>
              {ev.bride_name} & {ev.groom_name} ({ev.event_type})
            </option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
          <div className="bg-white border border-tn-border rounded-xl p-5">
            <h3 className="font-semibold text-sm text-tn-text mb-3">Add Organizer</h3>
            {error && (
              <div className="bg-tn-error-bg border-tn-error text-tn-error rounded-lg px-3 py-2 text-xs mb-3">
                {error}
              </div>
            )}
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Registered Email"
                type="email"
                className="border border-tn-border rounded-lg px-3 py-2.5 text-sm text-tn-text"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-tn-border rounded-lg px-3 py-2.5 text-sm text-tn-text"
              >
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="bg-tn-yellow text-black rounded-lg text-sm font-semibold hover:bg-tn-yellow-2 disabled:opacity-50 px-4 py-2.5"
              >
                {loading ? 'Adding…' : 'Add'}
              </button>
            </form>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-tn-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-tn-light text-tn-muted text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Added</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tn-border">
                {organizers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-tn-muted text-xs">
                      No organizers added yet
                    </td>
                  </tr>
                ) : (
                  organizers.map((org) => (
                    <tr key={org.id}>
                      <td className="px-4 py-3 font-medium text-tn-text">{org.name}</td>
                      <td className="px-4 py-3 text-tn-muted">{org.email}</td>
                      <td className="px-4 py-3 text-tn-muted capitalize">{org.role}</td>
                      <td className="px-4 py-3 text-tn-muted">
                        {org.added_at ? new Date(org.added_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemove(org.id)}
                          className="text-tn-error text-xs font-semibold hover:text-tn-error"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden bg-white border border-tn-border rounded-xl divide-y divide-tn-border">
            {organizers.length === 0 ? (
              <div className="px-4 py-6 text-center text-tn-muted text-xs">
                No organizers added yet
              </div>
            ) : (
              organizers.map((org) => (
                <div key={org.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-tn-text text-sm truncate">{org.name}</p>
                      <p className="text-xs text-tn-muted truncate">{org.email}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-tn-muted">
                        <span className="capitalize bg-tn-light px-2 py-0.5 rounded-full font-medium text-tn-text">{org.role}</span>
                        <span>{org.added_at ? new Date(org.added_at).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(org.id)}
                      className="text-tn-error text-xs font-semibold hover:text-tn-error px-2 py-1 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={confirmRemoveId !== null}
        title="Remove Organizer"
        message="Are you sure you want to remove this organizer?"
        confirmText="Remove"
        variant="danger"
        onConfirm={confirmRemove}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </div>
  );
}
