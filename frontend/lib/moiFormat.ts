import type { MoiEntry } from './api';

export function parseAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoiEntryAmount(
  entry: Pick<MoiEntry, 'gift_type' | 'amount' | 'gold_weight' | 'approximate_value' | 'gift_description'>
): string {
  if (entry.gift_type === 'gold' || entry.gift_type === 'silver') {
    const weight = entry.gold_weight ? `${entry.gold_weight}g` : '';
    const value = parseAmount(entry.approximate_value ?? entry.amount);
    if (weight && value > 0) return `${weight} · ₹${value.toLocaleString('en-IN')}`;
    if (weight) return weight;
    return value > 0 ? `₹${value.toLocaleString('en-IN')}` : entry.gift_type === 'gold' ? 'Gold' : 'Silver';
  }
  if (entry.gift_type === 'gift') {
    const value = parseAmount(entry.approximate_value ?? entry.amount);
    if (value > 0) return `₹${value.toLocaleString('en-IN')}`;
    return entry.gift_description?.trim() || 'Gift';
  }
  return `₹${parseAmount(entry.amount).toLocaleString('en-IN')}`;
}
