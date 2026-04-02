import { apiClient } from './client.ts';

export interface DashboardSummary {
  activeCampaigns: any[];
  expiringPartners: any[];
  stats: {
    totalActiveCampaigns: number;
    totalExpiringPartners: number;
  };
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get<DashboardSummary>('/api/dashboard/summary');
    return response.data;
  },
};
