'use client';

import Link from 'next/link';
import { Event } from '@/lib/api';

interface EventContextCardProps {
  event: Event;
  icon?: 'calendar' | 'gift';
  detailsHref?: string;
}

export default function EventContextCard({ event, icon = 'calendar', detailsHref }: EventContextCardProps) {
  const title = event.custom_title || (event.bride_name && event.groom_name ? `${event.bride_name} & ${event.groom_name}` : event.event_type);
  const dateStr = event.wedding_date
    ? new Date(event.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })
    : '—';
  const timeStr = (event as Event & { wedding_time?: string }).wedding_time;
  const location = [event.venue, event.city].filter(Boolean).join(', ') || '—';
  const isActive = event.approval_status === 'approved';

  return (
    <div className="bg-white border border-tn-border rounded-2xl p-4 mb-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-tn-purple-bg flex items-center justify-center shrink-0">
          {icon === 'gift' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-tn-purple">
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-tn-purple">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-tn-text leading-tight">{title}</h3>
              {isActive && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 bg-tn-success rounded-full" />
                  <span className="text-[10px] font-semibold text-tn-success">Function is Active</span>
                </div>
              )}
            </div>
            {detailsHref && (
              <Link href={detailsHref} className="text-[10px] font-semibold text-tn-purple whitespace-nowrap shrink-0">
                View Details &gt;
              </Link>
            )}
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-[11px] text-tn-muted flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/></svg>
              {dateStr}{timeStr ? ` • ${timeStr}` : ''}
            </p>
            <p className="text-[11px] text-tn-muted flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
              {location}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
