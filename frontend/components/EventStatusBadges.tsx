'use client';

import { Event } from '@/lib/api';
import { getApprovalBadge, getEventModeBadge } from '@/lib/eventHelpers';

export default function EventStatusBadges({ event }: { event: Event }) {
  const mode = getEventModeBadge(event);
  const approval = getApprovalBadge(event);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mode.className}`}>
        {mode.label}
      </span>
      {approval && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${approval.className}`}>
          {approval.label}
        </span>
      )}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${event.is_active ? 'bg-tn-success-bg text-tn-success' : 'bg-tn-light text-tn-muted'}`}>
        {event.is_active ? 'Active' : 'Draft'}
      </span>
    </div>
  );
}
