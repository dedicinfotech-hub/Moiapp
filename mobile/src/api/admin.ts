import { request } from './client';
import type { Event } from './types';

export interface AdminUser {
  id: number;
  name: string;
  city?: string;
  phone?: string;
  created_at: string;
  function_count: number;
  is_blocked?: number;
}

export interface SupportTicket {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

export interface FeatureToggle {
  id: number;
  feature_key: string;
  is_enabled: number;
  description: string;
}

export const adminApi = {
  getStats: () =>
    request<{
      stats: {
        totalUsers: number;
        newToday: number;
        activeToday: number;
        totalFunctions: number;
        monthlyRevenue: number;
        lastMonthRevenue: number;
        totalRevenue: number;
        openTickets: number;
        pendingApprovals: number;
        activePrivateEvents: number;
      };
    }>('/admin.php?action=stats'),

  getPrivateEvents: () =>
    request<{
      events: Array<{
        id: number;
        event_type: string;
        wedding_date: string;
        venue: string;
        city: string;
        host_name: string;
        guest_count: number;
        total_moi: number;
        qr_enabled: number;
        guest_token: string;
      }>;
    }>('/admin.php?action=private-events'),

  deactivateEvent: (id: number) =>
    request<{ success: boolean; message: string }>(
      `/admin.php?action=deactivate-event&id=${id}`,
      { method: 'PUT', body: JSON.stringify({}) }
    ),

  getUsers: (search?: string, filter?: string) =>
    request<{ users: AdminUser[] }>(
      `/admin.php?action=users&search=${encodeURIComponent(search || '')}&filter=${filter || 'all'}`
    ),

  blockUser: (userId: number) =>
    request<{ success: boolean; message: string }>('/admin.php?action=block-user', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  deleteUser: (userId: number) =>
    request<{ success: boolean; message: string }>('/admin.php?action=delete-user', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  getAnalytics: (period?: string) =>
    request<{
      analytics: {
        userGrowth: Array<{ date: string; count: number }>;
        topCities: Array<{ city: string; count: number }>;
        peakMonths: Array<{ month: string; count: number }>;
        featureUsage: Array<{ event_type: string; count: number }>;
        premiumRatio: { premium: number; free: number };
      };
    }>(`/admin.php?action=analytics&period=${period || 'daily'}`),

  getTickets: (status?: string) =>
    request<{ tickets: SupportTicket[] }>(
      `/admin.php?action=tickets&status=${status || 'open'}`
    ),

  resolveTicket: (ticketId: number) =>
    request<{ success: boolean; message: string }>('/admin.php?action=resolve-ticket', {
      method: 'POST',
      body: JSON.stringify({ ticket_id: ticketId }),
    }),

  getFeatures: () =>
    request<{ features: FeatureToggle[] }>('/admin.php?action=features'),

  updateFeature: (id: number, is_enabled: number) =>
    request<{ success: boolean; message: string }>('/admin.php?action=toggle-feature', {
      method: 'POST',
      body: JSON.stringify({ id, is_enabled }),
    }),

  getLoginLogs: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const q = new URLSearchParams({ action: 'login-logs' });
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    return request<{
      logs: Array<{
        id: number;
        user_id: number | null;
        email: string | null;
        role: string | null;
        ip_address: string | null;
        user_agent: string | null;
        status: 'success' | 'failed' | 'blocked';
        created_at: string;
      }>;
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/admin.php?${q.toString()}`);
  },
};

export const eventsAdminApi = {
  listPending: (status: 'pending' | 'rejected' | 'all' = 'pending') =>
    request<Event[]>(`/events.php?action=pending&status=${status}`),

  approve: (id: number, body: { status: 'approved' | 'rejected'; reason?: string }) =>
    request<{ success: boolean; message: string }>(`/events.php?action=approve&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  resubmit: (id: number) =>
    request<{ success: boolean; message: string }>(`/events.php?action=resubmit&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({}),
    }),
};
