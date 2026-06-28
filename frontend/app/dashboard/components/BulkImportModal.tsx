'use client';

import { useState } from 'react';
import { Event, bulkImportCSV } from '@/lib/api';

interface BulkImportModalProps {
  events: Event[];
  onClose: () => void;
  onImported: () => void;
}

export default function BulkImportModal({ events, onClose, onImported }: BulkImportModalProps) {
  const [eventId, setEventId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) { setError('Please select an event'); return; }
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await bulkImportCSV(Number(eventId), file!);
      setSuccess(`Imported ${res.imported} entries successfully.`);
      setTimeout(onImported, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-tn-border">
          <div>
            <h2 className="font-bold text-tn-text text-base">Bulk Import Old Moi Notes</h2>
            <p className="text-[11px] text-tn-muted">Digitize physical records</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-tn-muted hover:bg-tn-light text-lg">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-tn-error-bg border border-tn-error/20 text-tn-error rounded-lg px-4 py-2.5 text-sm">{error}</div>}
          {success && <div className="bg-tn-success-bg border border-tn-success/20 text-tn-success rounded-lg px-4 py-2.5 text-sm">{success}</div>}
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1.5">Event <span className="text-tn-yellow">*</span></label>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-full border border-tn-border rounded-xl px-3 py-2.5 text-sm text-tn-text">
              <option value="">Select event…</option>
              {events.map((ev) => (
                <option key={ev.id} value={String(ev.id)}>{ev.bride_name} & {ev.groom_name} ({ev.event_type})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-tn-muted mb-1.5">CSV File</label>
            <div
              onClick={() => document.getElementById('bulk-import-file')?.click()}
              className="border-2 border-dashed border-tn-border rounded-xl p-6 text-center cursor-pointer hover:border-tn-yellow transition-colors"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-tn-muted mb-2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p className="text-sm font-semibold text-tn-text mb-1">Drag & Drop</p>
              <p className="text-xs text-tn-muted">or click to upload CSV file</p>
            </div>
            <input id="bulk-import-file" type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
            <p className="text-[10px] text-tn-muted mt-1">Format: guest_name, amount, gift_type, relation, payment_mode, note</p>
          </div>
          <button type="submit" disabled={loading || !file} className="w-full bg-tn-yellow text-black py-3 rounded-xl font-semibold hover:bg-tn-yellow-2 disabled:opacity-50">
            {loading ? 'Importing…' : 'Import CSV'}
          </button>
        </form>
      </div>
    </div>
  );
}