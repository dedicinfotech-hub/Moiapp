import type { Event, MoiEntry } from '../api/types';

/** Coerce API amount fields (often strings) to a finite number. */
export function parseAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrency(amount: unknown): string {
  return `₹${parseAmount(amount).toLocaleString('en-IN')}`;
}

/** Display moi entry value — handles gold/silver/gift without showing ₹0. */
export function formatMoiEntryAmount(entry: Pick<MoiEntry, 'gift_type' | 'amount' | 'gold_weight' | 'approximate_value' | 'gift_description'>): string {
  if (entry.gift_type === 'gold' || entry.gift_type === 'silver') {
    const weight = entry.gold_weight ? `${entry.gold_weight}g` : '';
    const value = parseAmount(entry.approximate_value || entry.amount);
    if (weight && value > 0) return `${weight} · ${formatCurrency(value)}`;
    if (weight) return weight;
    return value > 0 ? formatCurrency(value) : entry.gift_type === 'gold' ? 'Gold' : 'Silver';
  }
  if (entry.gift_type === 'gift') {
    const value = parseAmount(entry.approximate_value || entry.amount);
    if (value > 0) return formatCurrency(value);
    return entry.gift_description?.trim() || 'Gift';
  }
  return formatCurrency(entry.amount);
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      weekday: 'long',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getEventDisplayName(ev: Event): string {
  if (ev.custom_title) return ev.custom_title;
  if (ev.event_type === 'wedding' && ev.bride_name && ev.groom_name) {
    return `${ev.bride_name} & ${ev.groom_name} Wedding`;
  }
  if (ev.event_type === 'birthday' && ev.birthday_person_name) {
    return `${ev.birthday_person_name}'s Birthday`;
  }
  if (ev.host_name) return ev.host_name;
  return ev.event_type.charAt(0).toUpperCase() + ev.event_type.slice(1);
}

export function getEventTypeLabel(type: Event['event_type']): string {
  const labels: Record<Event['event_type'], string> = {
    wedding: 'Wedding',
    birthday: 'Birthday',
    engagement: 'Engagement',
    valakaappu: 'Valakaappu',
    housewarming: 'Housewarming',
    graduation: 'Graduation',
    custom: 'Custom Event',
  };
  return labels[type] || type;
}

/** Primary headline on public event pages (matches web /e/:slug). */
export function getEventPrimaryTitle(ev: Event): string {
  if (ev.event_type === 'graduation' && ev.graduate_name) return ev.graduate_name;
  if (ev.event_type === 'birthday' && ev.birthday_person_name) return ev.birthday_person_name;
  if (ev.event_type === 'housewarming') {
    return [ev.host_name, ev.spouse_name].filter(Boolean).join(' & ');
  }
  if (ev.event_type === 'custom' && ev.custom_title) return ev.custom_title;
  if (ev.bride_name || ev.groom_name) {
    return [ev.bride_name, ev.groom_name].filter(Boolean).join(' & ');
  }
  return getEventDisplayName(ev);
}

/** Name shown in "Organized by" card. */
export function getOrganizerDisplayName(ev: Event): string {
  if (ev.event_type === 'graduation' && ev.graduate_name) return ev.graduate_name;
  if (ev.event_type === 'birthday' && ev.birthday_person_name) return ev.birthday_person_name;
  if (ev.event_type === 'housewarming') {
    return [ev.host_name, ev.spouse_name].filter(Boolean).join(' & ');
  }
  if (ev.event_type === 'custom' && ev.custom_title) return ev.custom_title;
  if (ev.bride_name || ev.groom_name) {
    return [ev.bride_name, ev.groom_name].filter(Boolean).join(' & ');
  }
  return ev.host_name || getEventDisplayName(ev);
}

export const AVATAR_COLORS = [
  { bg: '#FFF9E6', text: '#B8860B' },
  { bg: '#EFF6FF', text: '#3B82F6' },
  { bg: '#F0FFF4', text: '#22C55E' },
  { bg: '#FFF9E6', text: '#F59E0B' },
  { bg: '#FFFCF5', text: '#FFC107' },
];

export function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
