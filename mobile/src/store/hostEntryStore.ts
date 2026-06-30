import { create } from 'zustand';
import type { MoiEntry } from '../api/types';

interface HostEntryState {
  paymentModes: Record<string, { mode: MoiEntry['payment_mode']; label: string }>;
  setPaymentMode: (slug: string, mode: MoiEntry['payment_mode'], label: string) => void;
  getPaymentMode: (slug: string) => { mode: MoiEntry['payment_mode']; label: string } | null;
}

export const useHostEntryStore = create<HostEntryState>((set, get) => ({
  paymentModes: {},
  setPaymentMode: (slug, mode, label) =>
    set((s) => ({ paymentModes: { ...s.paymentModes, [slug]: { mode, label } } })),
  getPaymentMode: (slug) => get().paymentModes[slug] || null,
}));
