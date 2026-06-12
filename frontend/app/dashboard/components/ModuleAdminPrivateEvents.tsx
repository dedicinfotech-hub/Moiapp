'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

type Module = 'dashboard' | 'events' | 'moi-notebook' | 'users' | 'analytics' | 'settings' | 'organizers' | 'features' | 'admin-dashboard' | 'admin-users' | 'admin-analytics' | 'admin-revenue' | 'admin-support' | 'admin-approvals' | 'admin-private-events';

interface ModuleAdminPrivateEventsProps {
  onNavigate: (m: Module) => void;
}

interface PrivateEvent {
  id: number;
  event_type: string;
  wedding_date: string;
  venue: string;
  city: string;
  host_name: string;
  host_email: string;
  host_phone: string;
  guest_count: number;
  total_moi: number;
  qr_enabled: number;
  guest_token: string;
  created_at: string;
}

export default function ModuleAdminPrivateEvents({ onNavigate }: ModuleAdminPrivateEventsProps) {
  const [events, setEvents] = useState<PrivateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getPrivateEvents();
      setEvents(response.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load private events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this private event? The QR code will stop working immediately.')) return;
    try {
      setActionLoading(id);
      await adminApi.deactivateEvent(id);
      setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, qr_enabled: 0 } : ev));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate event');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = events.filter(ev => 
    ev.host_name.toLowerCase().includes(search.toLowerCase()) ||
    ev.event_type.toLowerCase().includes(search.toLowerCase()) ||
    (ev.city && ev.city.toLowerCase().includes(search.toLowerCase())) ||
    String(ev.id).includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg text-[#101010]">Active Private Events</h2>
          <p className="text-xs text-[#999] mt-0.5">Monitor and manage all active private events on the platform</p>
        </div>
        <button
          onClick={() => onNavigate('admin-dashboard')}
          className="text-sm text-[#FFC107] font-semibold hover:underline text-left"
        >
          ← Back to Admin
        </button>
      </div>

      <div className="bg-white border border-[#EBEBEB] rounded-xl p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by host name, event type, city, or ID..."
          className="w-full bg-gray-50 border border-[#E8E8E8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FFC107]"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#EBEBEB] rounded-xl p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-600 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#EBEBEB] rounded-xl py-16 text-center text-[#bbb] text-sm">
          No active private events found
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ev) => (
            <div key={ev.id} className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-[#101010] capitalize">{ev.event_type}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ev.qr_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {ev.qr_enabled ? 'QR Active' : 'QR Deactivated'}
                    </span>
                  </div>
                  <p className="text-xs text-[#666]">
                    {new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {ev.venue && ` · ${ev.venue}`}
                    {ev.city && ` · ${ev.city}`}
                  </p>
                  <p className="text-xs text-[#999] mt-1">
                    Host: {ev.host_name || '—'}
                    {ev.host_email && ` · ${ev.host_email}`}
                    {ev.host_phone && ` · ${ev.host_phone}`}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-[#666]">
                    <span>👥 {ev.guest_count} guests</span>
                    <span>💰 ₹{Number(ev.total_moi).toLocaleString('en-IN')}</span>
                    <span>ID: #{ev.id}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {ev.qr_enabled ? (
                    <button
                      onClick={() => handleDeactivate(ev.id)}
                      disabled={actionLoading === ev.id}
                      className="px-4 py-2 rounded-lg text-xs font-bold border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {actionLoading === ev.id ? '…' : 'Deactivate QR'}
                    </button>
                  ) : (
                    <span className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500">
                      Deactivated
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
