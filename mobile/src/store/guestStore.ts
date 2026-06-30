import { create } from 'zustand';
import type { GuestFormData } from '../navigation/types';
import type { RazorpayPaymentMethod } from '../api/types';

interface GuestPaymentState {
  formByToken: Record<string, GuestFormData>;
  lastOrderByToken: Record<string, { razorpayOrderId: string; transactionId: string; total: number; amount: number; fee: number }>;
  submittedTokens: Record<string, boolean>;
  setForm: (token: string, form: GuestFormData) => void;
  getForm: (token: string) => GuestFormData | null;
  clearForm: (token: string) => void;
  setLastOrder: (token: string, order: { razorpayOrderId: string; transactionId: string; total: number; amount: number; fee: number }) => void;
  getLastOrder: (token: string) => GuestPaymentState['lastOrderByToken'][string] | null;
  markSubmitted: (token: string) => void;
  isSubmitted: (token: string) => boolean;
}

export const useGuestStore = create<GuestPaymentState>((set, get) => ({
  formByToken: {},
  lastOrderByToken: {},
  submittedTokens: {},

  setForm: (token, form) =>
    set((s) => ({ formByToken: { ...s.formByToken, [token]: form } })),

  getForm: (token) => get().formByToken[token] || null,

  clearForm: (token) =>
    set((s) => {
      const next = { ...s.formByToken };
      delete next[token];
      return { formByToken: next };
    }),

  setLastOrder: (token, order) =>
    set((s) => ({ lastOrderByToken: { ...s.lastOrderByToken, [token]: order } })),

  getLastOrder: (token) => get().lastOrderByToken[token] || null,

  markSubmitted: (token) =>
    set((s) => ({ submittedTokens: { ...s.submittedTokens, [token]: true } })),

  isSubmitted: (token) => !!get().submittedTokens[token],
}));

export function calcPaymentFee(amount: number): number {
  return Math.round(amount * 0.0018) || (amount > 0 ? 9 : 0);
}
