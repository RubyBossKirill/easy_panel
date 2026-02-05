import api from '../utils/apiClient';
import { DashboardStats } from '../types/dashboard';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');

    // Backend returns stats object directly
    if ((response as any).today_appointments !== undefined) {
      return response as any as DashboardStats;
    }

    if (!response.status || !response.data) {
      throw new Error(response.message || 'Failed to fetch stats');
    }
    return response.data;
  },
};
