import api from '@/lib/api';
import { DashboardStats, SeizureStatistics, SeizureHistoryItem, PatientMetrics } from '@/types/api';

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/doctors/dashboard/stats');
    return response.data;
  },

  // Get patients with metrics
  getPatientsWithMetrics: async (params?: {
    skip?: number;
    limit?: number;
    health_status?: string;
  }): Promise<PatientMetrics[]> => {
    const response = await api.get('/doctors/patients/with-metrics', { params });
    return response.data;
  },

  // Get seizure statistics for charts
  getSeizureStatistics: async (days: number = 30): Promise<SeizureStatistics> => {
    const response = await api.get('/doctors/seizures/statistics', {
      params: { days },
    });
    return response.data;
  },

  // Get seizure history
  getSeizureHistory: async (
    params?: {
      days?: number;
      patient_id?: number;
      skip?: number;
      limit?: number;
    }
  ): Promise<SeizureHistoryItem[]> => {
    const response = await api.get('/doctors/history', { params });
    return response.data;
  },
};
