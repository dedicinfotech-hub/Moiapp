import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { RazorpayOrderResponse } from '../api/types';
import { APP_BASE_URL } from '../api/client';

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve() : reject(new Error('Razorpay failed to load')));
    script.onerror = () => reject(new Error('Razorpay script failed to load'));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(
  order: RazorpayOrderResponse,
  onSuccess: (response: RazorpaySuccess) => void,
  onError: (message: string) => void
): Promise<void> {
  if (Platform.OS === 'web') {
    await loadRazorpayScript();
    const RazorpayCtor = window.Razorpay;
    if (!RazorpayCtor) {
      onError('Razorpay checkout unavailable');
      return;
    }

    const razorpay = new RazorpayCtor({
      key: order.razorpay_key_id,
      amount: order.order.amount,
      currency: order.order.currency,
      name: 'MoiApp',
      description: order.event_title,
      order_id: order.order.id,
      prefill: {
        name: order.guest_name,
        email: order.email || '',
        contact: order.phone || '',
      },
      theme: { color: '#FFC107' },
      handler: (response: RazorpaySuccess) => onSuccess(response),
    });

    razorpay.on('payment.failed', (response: unknown) => {
      const err = response as { error?: { description?: string } };
      onError(err?.error?.description || 'Payment failed');
    });

    razorpay.open();
    return;
  }

  const paymentUrl = `${APP_BASE_URL}/g/${order.order.receipt}/payment`;
  await WebBrowser.openBrowserAsync(paymentUrl);
  onError('Complete payment in browser, then return to the app.');
}

export type { RazorpaySuccess };
