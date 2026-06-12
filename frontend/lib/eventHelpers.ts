import { Event } from './api';

export function getEventModeBadge(ev: Event) {
  if (ev.event_mode === 'past') {
    return { label: 'Past Event', sublabel: 'நடந்த நிகழ்வு', className: 'bg-amber-100 text-amber-800' };
  }
  return { label: 'New Event', sublabel: 'இனி நடக்கப்போகிறது', className: 'bg-blue-100 text-blue-700' };
}

export function getApprovalBadge(ev: Event) {
  if (ev.event_mode === 'past') return null;
  if (ev.approval_status === 'pending') {
    return { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-800' };
  }
  if (ev.approval_status === 'rejected') {
    return { label: 'Rejected', className: 'bg-red-100 text-red-700' };
  }
  return null;
}

export function canAddMoi(ev: Event): boolean {
  if (ev.event_mode === 'past') return true;
  return ev.approval_status === 'approved';
}

/** Guest QR / public payment page — new approved events only */
export function canAcceptGuestMoi(ev: Event): boolean {
  if (ev.event_mode === 'past') return false;
  if (ev.approval_status !== 'approved') return false;
  return ev.qr_enabled !== 0;
}

export function getEventDisplayName(ev: Event): string {
  const typeLabels: Record<string, string> = {
    wedding: 'Wedding',
    birthday: 'Birthday',
    engagement: 'Engagement',
    valakaappu: 'Valakaappu',
    housewarming: 'Housewarming',
    graduation: 'Graduation',
    custom: ev.custom_title || 'Custom Event',
  };
  const typeName = typeLabels[ev.event_type] || 'Event';
  const dateStr = ev.wedding_date
    ? new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  return `${typeName} - ${dateStr}`.trim();
}

export function showEventQr(ev: Event): boolean {
  return ev.event_mode === 'new' && ev.approval_status === 'approved' && !!ev.guest_token;
}
