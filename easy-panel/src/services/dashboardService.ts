import api from '../api/client';
import { DashboardStats } from '../types/dashboard';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};
