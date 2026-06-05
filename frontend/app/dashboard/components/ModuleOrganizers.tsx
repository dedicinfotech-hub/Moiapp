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
      const res = await fetch(`/api/organizers.php?event_id=${selectedEventId}`, {
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
      await fetch('/api/organizers.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': `Bearer ${localStorage.getItem('moi_token')}` },
        body: JSON.stringify({ event_id: Number(selectedEventId), name: name.trim(), email: email.trim(), phone: phone.trim() || null }),
      });
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
      await fetch(`/api/organizers.php?id=${id}`, {
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
          <h2 className="text-lg font-bold text-[#101010]">Event Organizers</h2>
          <p className="text-xs text-[#999]">Manage who can access and edit this event</p>
        </div>
      </div>

      <div className="bg-white border border-[#E8E8E8] rounded-xl p-5">
        <label className="block text-xs font-semibold text-[#555] mb-1.5">Select Event</label>
        <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="w-full border border-[#E8E8E8] rounded-lg px-3 py-2.5 text-sm">
          <option value="">Choose an event…</option>
          {events.map((ev) => (
            <option key={ev.id} value={String(ev.id)}>{ev.bride_name} & {ev.groom_name} ({ev.event_type})</option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
          <div className="bg-white border border-[#E8E8E8] rounded-xl p-5">
            <h3 className="font-semibold text-sm text-[#101010] mb-3">Add Organizer</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="border border-[#E8E8E8] rounded-lg px-3 py-2 text-sm" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="border border-[#E8E8E8] rounded-lg px-3 py-2 text-sm" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="border border-[#E8E8E8] rounded-lg px-3 py-2 text-sm" />
              <button type="submit" disabled={loading} className="bg-[#FFC107] text-black rounded-lg text-sm font-semibold hover:bg-[#E6AC00] disabled:opacity-50">
                {loading ? 'Adding…' : 'Add'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#E8E8E8] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F5F5] text-[#666] text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8]">
                {organizers.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-[#999] text-xs">No organizers added yet</td></tr>
                ) : organizers.map((org) => (
                  <tr key={org.id}>
                    <td className="px-4 py-3 font-medium text-[#101010]">{org.name}</td>
                    <td className="px-4 py-3 text-[#444]">{org.email}</td>
                    <td className="px-4 py-3 text-[#444]">{org.phone || '—'}</td>
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