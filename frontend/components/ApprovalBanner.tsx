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
          ? 'bg-tn-error-bg border-tn-error/20 text-tn-error'
          : 'bg-tn-warning/10 border-tn-warning/30 text-tn-warning'
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
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-tn-error/30 bg-white hover:bg-tn-error-bg transition-colors"
            >
              Edit Function
            </button>
          )}
          {onResubmit && (
            <button
              type="button"
              onClick={onResubmit}
              disabled={resubmitting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-tn-yellow text-tn-text hover:bg-tn-yellow-2 disabled:opacity-50 transition-colors"
            >
              {resubmitting ? 'Resubmitting…' : 'Resubmit for Approval'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
