'use client';

import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/lib/api';

interface ModuleOrganizersProps {
  events: Event[];
  onRefresh: () => void;
}

export default function ModuleOrganizers({ events, onRefresh }: ModuleOrganizersProps) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [organizers, setOrganizers] = useState<{ id: number; name: string; email: string; phone?: string }[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadOrganizers = useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events.php?action=organizers&event_id=${selectedEventId}`, {
        headers: { 'X-Auth-Token': `Bearer ${localStorage.getItem('moi_token')}` },
      });
      const data = await res.json();
      setOrganizers(data.organizers || []);
    } catch {
      setOrganizers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => { loadOrganizers(); }, [loadOrganizers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !name.trim() || !email.trim()) { setError('Name and email are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/events.php?action=add-organizer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': `Bearer ${localStorage.getItem('moi_token')}` },
        body: JSON.stringify({ event_id: Number(selectedEventId), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add organizer');
        return;
      }
      setName(''); setEmail(''); setPhone('');
      loadOrganizers();
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add organizer');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Remove this organizer?')) return;
    setLoading(true);
    try {
      await fetch(`/api/events.php?action=remove-organizer&id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': `Bearer ${localStorage.getItem('moi_token')}` },
      });
      loadOrganizers();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-tn-text">Event Organizers</h2>
          <p className="text-xs text-tn-muted">Manage who can access and edit this event</p>
        </div>
      </div>

      <div className="bg-white border border-tn-border rounded-xl p-5">
        <label className="block text-xs font-semibold text-tn-muted mb-1.5">Select Event</label>
        <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="w-full border border-tn-border rounded-lg px-3 py-2.5 text-sm text-tn-text">
          <option value="">Choose an event…</option>
          {events.map((ev) => (
            <option key={ev.id} value={String(ev.id)}>{ev.bride_name} & {ev.groom_name} ({ev.event_type})</option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
          <div className="bg-white border border-tn-border rounded-xl p-5">
            <h3 className="font-semibold text-sm text-tn-text mb-3">Add Organizer</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Organizer Name" className="border border-tn-border rounded-lg px-3 py-2 text-sm text-tn-text" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Registered Email" type="email" className="border border-tn-border rounded-lg px-3 py-2 text-sm text-tn-text" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="border border-tn-border rounded-lg px-3 py-2 text-sm text-tn-text" />
              <button type="submit" disabled={loading} className="bg-tn-yellow text-black rounded-lg text-sm font-semibold hover:bg-tn-yellow-2 disabled:opacity-50">
                {loading ? 'Adding…' : 'Add'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-tn-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-tn-light text-tn-muted text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tn-border">
                {organizers.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-tn-muted text-xs">No organizers added yet</td></tr>
                ) : organizers.map((org) => (
                  <tr key={org.id}>
                    <td className="px-4 py-3 font-medium text-tn-text">{org.name}</td>
                    <td className="px-4 py-3 text-tn-muted">{org.email}</td>
                    <td className="px-4 py-3 text-tn-muted">{org.phone || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleRemove(org.id)} className="text-red-500 text-xs font-semibold hover:text-red-700">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}