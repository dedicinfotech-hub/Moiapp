'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({ bride_name: '', groom_name: '', wedding_date: '', venue: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">Please <Link href="/login" className="text-[#B8860B] underline">login</Link> first.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await eventsApi.create(form);
      router.push(`/events/${res.slug}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FFC107] transition-colors";
  const labelCls = "block text-sm font-semibold text-gray-600 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6">
          ← Back to Dashboard
        </Link>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-card p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">💒</div>
            <h1 className="text-2xl font-bold text-gray-900">Create Wedding Event</h1>
            <p className="text-gray-400 text-sm mt-1">புதிய திருமண நிகழ்வு உருவாக்கவும்</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Bride Name <span className="text-[#FFC107]">*</span></label><input type="text" required value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} className={inputCls} placeholder="Priya" /></div>
              <div><label className={labelCls}>Groom Name <span className="text-[#FFC107]">*</span></label><input type="text" required value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} className={inputCls} placeholder="Ravi" /></div>
            </div>
            <div><label className={labelCls}>Wedding Date <span className="text-[#FFC107]">*</span></label><input type="date" required value={form.wedding_date} onChange={(e) => setForm({ ...form, wedding_date: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Venue</label><input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className={inputCls} placeholder="Sri Murugan Mahal, Chennai" /></div>
            <div><label className={labelCls}>Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} resize-none`} placeholder="A brief note about the wedding…" /></div>
            <button type="submit" disabled={loading} className="w-full bg-[#FFC107] text-gray-900 py-3.5 rounded-xl font-bold hover:bg-[#E6AC00] transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Creating…' : 'Create Event →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
