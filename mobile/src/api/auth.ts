import { request } from './client';
import type { User } from './types';

export const authApi = {
  login: (body: { email: string; password: string; otp?: string }) =>
    request<{ token?: string; user?: User; requires_otp?: boolean; message?: string; otp_email?: string }>('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  sendOTP: (phone: string) =>
    request<{ success: boolean; message: string; delivery?: 'sms' | 'email' | 'dev'; dev_otp?: string }>(
      '/auth.php?action=send-otp',
      { method: 'POST', body: JSON.stringify({ phone }) }
    ),

  verifyOTP: (phone: string, otp: string) =>
    request<{ success: boolean; token: string; user: User; needsProfile: boolean }>(
      '/auth.php?action=verify-otp',
      { method: 'POST', body: JSON.stringify({ phone, otp }) }
    ),

  me: () => request<{ user: User }>('/auth.php?action=me'),

  updateProfile: (body: Partial<User>) =>
    request<{ success: boolean; user: User }>('/auth.php?action=profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    request<{ token: string; user: User }>('/auth.php?action=register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/auth.php?action=forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  deleteAccount: () =>
    request<{ success: boolean; message: string; grace_period_days?: number }>(
      '/auth.php?action=account',
      { method: 'DELETE' }
    ),

  logout: () =>
    request<{ success: boolean }>('/auth.php?action=logout', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};
