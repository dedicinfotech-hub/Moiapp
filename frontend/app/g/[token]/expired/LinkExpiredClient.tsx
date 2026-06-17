'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi, Event } from '@/lib/api';
import Icon from '@/components/ui/Icon';
import { useSlug } from '@/lib/useSlug';

export default function LinkExpiredScreen() {
  const router = useRouter();
  const token = useSlug(1); // /g/[token]/expired → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    eventsApi.getByGuestToken(token).then(setEvent).catch(() => setEvent(null)).finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-200 border-t-[#7C3AED] rounded-full animate-spin" /></div>;
  }

  const title = event?.custom_title || (event?.bride_name && event?.groom_name ? `${event.bride_name} & ${event.groom_name}` : event?.event_type);
  const dateStr = event?.wedding_date ? new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' }) : '—';

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="max-w-md mx-auto text-center">
        <div className="w-24 h-24 bg-[#FFF1F2] rounded-full flex items-center justify-center mx-auto mb-5 relative">
          <Icon name="download" size={32} className="text-[#7C3AED]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1F2937] mb-2">Link Expired</h1>
        <p className="text-sm text-[#6B7280] mb-6">This link has expired or is no longer valid. Please request a new link to continue.</p>

        <div className="bg-[#F5F3FF] border border-[#EDE9FE] rounded-2xl p-4 mb-5 text-left flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-sm font-bold shrink-0">i</div>
          <div>
            <p className="text-sm font-bold text-[#4B218B]">Why did this happen?</p>
            <p className="text-xs text-[#6B7280] mt-1">For your security, invitation links are valid only for a limited time. Please contact the host to get a new link.</p>
          </div>
        </div>

        {event && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-6 text-left shadow-sm">
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 bg-[#F5F3FF] rounded-xl flex items-center justify-center text-[#7C3AED]">
                <Icon name="gift" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1F2937]">{title}</p>
                <p className="text-[11px] text-[#6B7280] mt-1 inline-flex items-center gap-1"><Icon name="calendar" size={12} /> {dateStr}</p>
                <p className="text-[11px] text-[#6B7280] inline-flex items-center gap-1"><Icon name="map" size={12} /> {event.venue || event.city || '—'}</p>
              </div>
            </div>
            <div className="border-t border-[#F3F4F6] pt-3">
              <p className="text-xs font-bold text-[#1F2937]">Need Help?</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Contact the host or event organizer for a new invitation link.</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button type="button" onClick={() => alert('Request sent to host')} className="w-full h-12 bg-[#4B218B] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            <Icon name="list" size={16} /> Request New Link
          </button>
          <button type="button" onClick={() => router.push('/')} className="w-full h-12 border-2 border-[#7C3AED] text-[#7C3AED] rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            <Icon name="venue" size={16} /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}