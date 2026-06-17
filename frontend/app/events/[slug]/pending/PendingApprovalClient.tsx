'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { eventsApi, Event } from '@/lib/api';
import { CreateFlowHeader } from '@/components/event/EventLayout';
import { useSlug } from '@/lib/useSlug';

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#F3F4F6] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#F9FAFB] flex items-center justify-center shrink-0 text-[#9CA3AF]">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[#9CA3AF]">{label}</p>
        <p className="text-sm font-semibold text-[#1F2937]">{value}</p>
      </div>
    </div>
  );
}

export default function PendingApprovalScreen() {
  const router = useRouter();
  const slug = useSlug(1); // /events/[slug]/pending → skip 1 segment

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!slug) return;
    eventsApi.get(slug).then(setEvent).catch(() => router.push('/dashboard')).finally(() => setLoading(false));
  }, [slug, router]);

  useEffect(() => {
    if (!polling || !event || event.approval_status !== 'pending') return;
    const interval = setInterval(async () => {
      try {
        const data = await eventsApi.get(slug);
        setEvent(data);
        if (data.approval_status === 'approved') {
          setPolling(false);
          router.push(`/events/${slug}/dashboard-empty`);
        } else if (data.approval_status !== 'pending') {
          setPolling(false);
        }
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [polling, event, slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-tn-yellow rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) return null;

  const isPending = event.approval_status === 'pending';
  const isRejected = event.approval_status === 'rejected';
  const eventTitle = event.custom_title || event.event_type;
  const dateStr = event.wedding_date
    ? new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })
    : '—';
  const timeStr = (event as Event & { wedding_time?: string }).wedding_time || '—';
  const locationStr = [event.venue, event.city].filter(Boolean).join(', ') || '—';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CreateFlowHeader title="Pending Approval" onBack={() => router.push('/dashboard')} showHelp={false} />

      <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
        {/* Illustration */}
        <div className="text-center mb-6">
          <div className="w-28 h-28 mx-auto rounded-full bg-tn-yellow-light flex items-center justify-center mb-5 relative">
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
              <rect x="16" y="10" width="32" height="40" rx="3" stroke="currentColor" strokeWidth="2" fill="white" className="text-tn-yellow"/>
              <line x1="22" y1="20" x2="42" y2="20" stroke="currentColor" strokeWidth="2" className="text-tn-yellow-text"/>
              <line x1="22" y1="28" x2="38" y2="28" stroke="currentColor" strokeWidth="2" className="text-tn-yellow-text"/>
              <line x1="22" y1="36" x2="34" y2="36" stroke="currentColor" strokeWidth="2" className="text-tn-yellow-text"/>
            </svg>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-tn-yellow flex items-center justify-center border-2 border-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-tn-text mb-2">Your Function is Submitted!</h2>
          <p className="text-sm text-tn-muted max-w-xs mx-auto">
            We are reviewing your details. You&apos;ll be notified once it&apos;s approved.
          </p>
          {isPending && (
            <div className="inline-flex items-center gap-2 bg-tn-yellow-light border border-tn-yellow-border rounded-full px-4 py-2 mt-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-tn-yellow">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="text-xs font-bold text-tn-yellow">Pending Approval</span>
            </div>
          )}
          {isRejected && (
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 mt-4">
              <span className="text-xs font-bold text-red-600">Rejected</span>
            </div>
          )}
        </div>

        {/* Function details card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-tn-border">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-tn-yellow">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            </svg>
            <h3 className="text-sm font-bold text-tn-yellow">Function Details</h3>
          </div>
          <DetailRow
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
            label="Function Name"
            value={eventTitle}
          />
          <DetailRow
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/></svg>}
            label="Date"
            value={dateStr}
          />
          <DetailRow
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            label="Time"
            value={timeStr}
          />
          <DetailRow
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>}
            label="Location"
            value={locationStr}
          />
          <DetailRow
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/></svg>}
            label="Event Type"
            value={event.event_mode === 'past' ? 'Past Event' : 'New Event'}
          />
        </div>

        {isRejected && event.approval_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-red-600 mb-1">Rejection Reason</p>
            <p className="text-xs text-[#6B7280]">{event.approval_reason}</p>
          </div>
        )}

        <div className="bg-tn-yellow-light rounded-xl p-4 mb-4 flex items-start gap-3">
          <svg className="shrink-0 text-tn-yellow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
          </svg>
          <div>
            <p className="text-sm font-bold text-tn-yellow">What happens next?</p>
            <p className="text-xs text-tn-muted mt-1">
              We will verify your details. Once approved, you can start sharing the QR code with your guests.
            </p>
            <p className="text-xs text-tn-yellow font-semibold mt-2">Approval usually within 24 hours</p>
          </div>
        </div>

        <div className="bg-tn-yellow rounded-xl p-4 mb-6 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">You will be notified</p>
            <p className="text-xs text-white/80 mt-1">
              We&apos;ll send you a notification as soon as your function is approved.
            </p>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full h-[52px] border-2 border-tn-yellow text-tn-yellow rounded-xl font-semibold hover:bg-tn-yellow-light transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Go to Home
          </Link>
          {isRejected && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await eventsApi.resubmit(event.id);
                  router.refresh();
                } catch { /* ignore */ }
              }}
              className="w-full h-[52px] bg-tn-yellow text-tn-text rounded-xl font-semibold"
            >
              Resubmit for Approval
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
