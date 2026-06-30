import type { Event } from '../api/types';

/** New events need admin approval before moi entry / QR */
export function canAddMoi(event: Event): boolean {
  if (event.event_mode === 'past') return true;
  return event.approval_status === 'approved';
}

export function canAcceptGuestMoi(event: Event): boolean {
  if (event.event_mode === 'past') return false;
  if (event.approval_status !== 'approved') return false;
  return event.qr_enabled !== 0;
}

/** Route to pending screen for new events that are not yet approved */
export function needsApprovalScreen(event: Event): boolean {
  if (event.event_mode === 'past') return false;
  return event.approval_status !== 'approved';
}

export function getEventFlowScreen(event: Event): 'PendingApproval' | 'EventTabs' {
  return needsApprovalScreen(event) ? 'PendingApproval' : 'EventTabs';
}

/** Guest QR — new approved events only (matches web showEventQr) */
export function showEventQr(event: Event): boolean {
  if (event.event_mode === 'past') return false;
  return event.approval_status === 'approved';
}

export function getApprovalBlockMessage(event: Event): string {
  if (event.approval_status === 'rejected') {
    return event.approval_reason
      ? `Function was rejected: ${event.approval_reason}. Edit and resubmit for approval.`
      : 'Function was rejected. Please edit and resubmit for approval.';
  }
  return 'Function is pending admin approval. You cannot add moi entries until it is approved.';
}
