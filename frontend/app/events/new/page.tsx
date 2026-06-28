'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { eventsApi, API_BASE } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    bride_name: '', groom_name: '', wedding_date: '', venue: '', description: '',
  });
  const [coverFile,    setCoverFile]    = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-tn-text-secondary">Please <Link href="/login" className="text-tn-gold underline">login</Link> first.</p>
      </div>
    );
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Create the event
      const res = await eventsApi.create(form);

      // 2. Upload cover photo if selected
      if (coverFile) {
        const token = localStorage.getItem('moi_token');
        const fd = new FormData();
        fd.append('event_id', String(res.id));
        fd.append('cover', coverFile);
        await fetch(`${API_BASE}/events.php?action=cover`, {
          method: 'POST',
          headers: { 'X-Auth-Token': `Bearer ${token}` },
          body: fd,
        });
      }

      router.push(`/events/${res.slug}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full bg-white border-2 border-tn-border rounded-xl px-4 py-3 text-sm text-tn-text placeholder-tn-text-secondary focus:outline-none focus:border-tn-yellow transition-colors';
  const lbl = 'block text-sm font-semibold text-tn-muted mb-1.5';

  return (
    <div className="min-h-screen bg-tn-light py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-tn-text-secondary hover:text-tn-text transition-colors mb-6">
          ← Back to Dashboard
        </Link>

        <div className="bg-white border border-tn-border rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-tn-gold-bg to-tn-yellow-bg border-b border-tn-gold-border px-8 py-6 text-center">
            <div className="mb-2 text-tn-gold">
              <Icon name="venue" size={40} />
            </div>
            <h1 className="text-xl font-extrabold text-tn-text">Create Wedding Event</h1>
            <p className="text-tn-text-secondary text-sm mt-1">புதிய திருமண நிகழ்வு உருவாக்கவும்</p>
          </div>

          <div className="p-8 space-y-5">
            {error && (
              <div className="bg-tn-red-bg border border-tn-red-bg rounded-xl px-4 py-3 text-sm text-tn-error">{error}</div>
            )}

            {/* Cover photo upload */}
            <div>
              <label className={lbl}>Cover Photo</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`relative cursor-pointer rounded-xl overflow-hidden border-2 border-dashed transition-colors ${
                  coverPreview ? 'border-tn-yellow' : 'border-tn-border hover:border-tn-yellow'
                }`}
              >
                {coverPreview ? (
                  <div className="relative h-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverPreview} alt="cover preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-semibold">Click to change</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center gap-2 text-tn-muted">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <p className="text-sm font-semibold text-tn-text">Drag & Drop</p>
                    <p className="text-xs text-tn-subtle">or click to upload cover photo</p>
                    <p className="text-[10px] text-tn-subtle">JPG, PNG, WEBP · Max 10MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Bride Name <span className="text-tn-yellow">*</span></label>
                  <input required value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} className={inp} placeholder="Priya" />
                </div>
                <div>
                  <label className={lbl}>Groom Name <span className="text-tn-yellow">*</span></label>
                  <input required value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} className={inp} placeholder="Ravi" />
                </div>
              </div>
              <div>
                <label className={lbl}>Wedding Date <span className="text-tn-yellow">*</span></label>
                <input required type="date" value={form.wedding_date} onChange={(e) => setForm({ ...form, wedding_date: e.target.value })} className={inp} />
              </div>
              <div>
                <label className={lbl}>Venue</label>
                <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className={inp} placeholder="Sri Murugan Mahal, Chennai" />
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inp} resize-none`} placeholder="A brief note about the wedding…" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-tn-yellow text-tn-text py-3.5 rounded-xl font-extrabold text-base hover:bg-tn-yellow-2 transition-colors disabled:opacity-50 shadow-lg shadow-tn-yellow/30">
                {loading ? 'Creating…' : 'Create Event →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
