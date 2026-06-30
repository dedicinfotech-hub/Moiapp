import { request } from './client';
import type {
  RazorpayPaymentMethod,
  RazorpayCreateOrderRequest,
  RazorpayOrderResponse,
  RazorpayVerifyPaymentRequest,
  RazorpayPaymentResult,
  RazorpayReceipt,
} from './types';

export const paymentApi = {
  createOrder: (body: RazorpayCreateOrderRequest) =>
    request<RazorpayOrderResponse>('/payment.php?action=create-order', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  verifyPayment: (body: RazorpayVerifyPaymentRequest) =>
    request<RazorpayPaymentResult>('/payment.php?action=verify-payment', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getReceipt: (guestToken: string, razorpayOrderId: string) =>
    request<{ success: true; receipt: RazorpayReceipt }>(
      `/payment.php?action=receipt&guest_token=${encodeURIComponent(guestToken)}&razorpay_order_id=${encodeURIComponent(razorpayOrderId)}`
    ),
};

export type {
  RazorpayPaymentMethod,
  RazorpayCreateOrderRequest,
  RazorpayOrderResponse,
  RazorpayVerifyPaymentRequest,
  RazorpayPaymentResult,
  RazorpayReceipt,
};
