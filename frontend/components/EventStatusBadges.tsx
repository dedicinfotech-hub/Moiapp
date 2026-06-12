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
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${event.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {event.is_active ? 'Active' : 'Draft'}
      </span>
    </div>
  );
}
