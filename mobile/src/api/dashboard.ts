import { request } from './client';
import type { DashboardSummaryResponse } from './types';

export const dashboardApi = {
  summary: () => request<DashboardSummaryResponse>('/dashboard.php?action=summary'),
};
