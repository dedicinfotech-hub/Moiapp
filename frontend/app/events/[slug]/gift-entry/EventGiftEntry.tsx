'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Icon, { type IconName } from '@/components/ui/Icon';
import { eventsApi, moiApi, Event, type MoiEntry } from '@/lib/api';
import HostEntryShell from '@/components/event/HostEntryShell';
import EventContextCard from '@/components/event/EventContextCard';

type GiftType = 'gold' | 'silver' | 'gift';

const GIFT_TYPES: { id: GiftType; label: string; desc: string; icon: IconName }[] = [
  { id: 'gold', label: 'Gold', desc: 'Gold ornaments or coins', icon: 'sparkle' },
  { id: 'silver', label: 'Silver', desc: 'Silver items', icon: 'sparkle' },
  { id: 'gift', label: 'Gift', desc: 'Other gifts', icon: 'gift' },
];

export default function GiftEntryScreen() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    guest_name: '',
    gift_type: 'gift' as GiftType,
    description: '',
    weight: '',
    relation: 'other' as 'self' | 'spouse' | 'parent' | 'sibling' | 'friend' | 'other',
    note: '',
  });

  const relationMap: Record<'self' | 'spouse' | 'parent' | 'sibling' | 'friend' | 'other', MoiEntry['relation']> = {
    self: 'family',
    spouse: 'family',
    parent: 'family',
    sibling: 'family',
    friend: 'friend',
    other: 'other',
  };

  useEffect(() => {
    eventsApi.get(slug).then(setEvent).catch(() => router.push('/dashboard')).finally(() => setLoading(false));
  }, [slug, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSaving(true);
    setError('');
    try {
      // Use slug for public access (no auth required), event_id for authenticated users
      const token = localStorage.getItem('moi_token');
      const payload: Record<string, unknown> = token
        ? {
            event_id: event.id,
            guest_name: form.guest_name || 'Anonymous',
            relation: relationMap[form.relation],
            amount: 0,
            gift_type: form.gift_type,
            payment_mode: 'other',
            gift_description: form.description || form.note,
            note: form.note,
            entered_by: 'gift_entry',
          }
        : {
            slug: slug,
            guest_name: form.guest_name || 'Anonymous',
            relation: relationMap[form.relation],
            amount: 0,
            gift_type: form.gift_type,
            payment_mode: 'other',
            gift_description: form.description || form.note,
            note: form.note,
            entered_by: 'gift_entry',
          };
      // For gold/silver, include weight
      if (form.gift_type === 'gold' || form.gift_type === 'silver') {
        payload.gold_weight = form.weight ? parseFloat(form.weight) : null;
      }
      await moiApi.add(payload);
      router.push(`/events/${slug}/entries`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#FFC107] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <HostEntryShell slug={slug} title="Gift Entry" activeTab="entries" onBack={() => router.push(`/events/${slug}/entries`)}>
      <EventContextCard event={event} icon="gift" detailsHref={`/events/${slug}/dashboard`} />

      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#1F2937] mb-1.5">Contributor Name</label>
          <input
            type="text"
            value={form.guest_name}
            onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
            className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FFC107]"
            placeholder="Enter name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1F2937] mb-1.5">Gift Type</label>
          <div className="grid grid-cols-3 gap-2">
            {GIFT_TYPES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setForm({ ...form, gift_type: g.id })}
                className={`py-3 rounded-xl text-xs font-semibold border transition-colors ${
                  form.gift_type === g.id ? 'border-[#FFC107] bg-[#F5F3FF] text-tn-gold' : 'border-[#E5E7EB] bg-white text-[#6B7280]'
                }`}
              >
                <Icon name={g.icon} size={18} className="mx-auto mb-1" />
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1F2937] mb-1.5">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FFC107]"
            placeholder="e.g., Gold chain, Silver plate..."
          />
        </div>

        {(form.gift_type === 'gold' || form.gift_type === 'silver') && (
          <div>
            <label className="block text-sm font-semibold text-[#1F2937] mb-1.5">Weight (grams)</label>
            <input
              type="number"
              step="any"
              min="0"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FFC107]"
              placeholder="Enter weight in grams"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-[#1F2937] mb-1.5">Note (Optional)</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FFC107] resize-none"
            placeholder="Add a note..."
            rows={2}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 bg-[#FFC107] text-white rounded-xl font-semibold text-sm disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Gift'}
        </button>
      </form>
    </HostEntryShell>
  );
}
