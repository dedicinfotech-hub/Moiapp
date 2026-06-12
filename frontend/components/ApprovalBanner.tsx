'use client';

import { Event } from '@/lib/api';
import { canAddMoi } from '@/lib/eventHelpers';

interface ApprovalBannerProps {
  event: Event;
  onResubmit?: () => void;
  onEdit?: () => void;
  resubmitting?: boolean;
}

export default function ApprovalBanner({ event, onResubmit, onEdit, resubmitting }: ApprovalBannerProps) {
  if (canAddMoi(event)) return null;

  const isPending = event.approval_status === 'pending';
  const isRejected = event.approval_status === 'rejected';

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        isRejected
          ? 'bg-red-50 border-red-200 text-red-800'
          : 'bg-yellow-50 border-yellow-200 text-yellow-900'
      }`}
    >
      <p className="font-semibold">
        {isPending
          ? '⏳ Pending Approval / அனுமதிக்காக காத்திருக்கிறது'
          : '❌ Function Rejected / செயல்பாடு நிராகரிக்கப்பட்டது'}
      </p>
      <p className="text-xs mt-1 opacity-90">
        {isPending
          ? 'Your function is submitted. Admin will approve within 24 hours. Moi entry is disabled until then.'
          : 'Please review the reason below, edit your function details, and resubmit.'}
      </p>
      {isRejected && event.approval_reason && (
        <p className="text-xs mt-2 font-medium bg-white/60 rounded-lg px-3 py-2">
          Reason: {event.approval_reason}
        </p>
      )}
      {isRejected && (onResubmit || onEdit) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 bg-white hover:bg-red-50 transition-colors"
            >
              Edit Function
            </button>
          )}
          {onResubmit && (
            <button
              type="button"
              onClick={onResubmit}
              disabled={resubmitting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFC107] text-black hover:bg-[#E6AC00] disabled:opacity-50 transition-colors"
            >
              {resubmitting ? 'Resubmitting…' : 'Resubmit for Approval'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
