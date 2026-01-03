import api from '@/lib/api';
import { Alert } from '@/types/api';

export const alertService = {
  // Get alerts
  getAlerts: async (
    params?: {
      active_only?: boolean;
      days?: number;
      skip?: number;
      limit?: number;
    }
  ): Promise<Alert[]> => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  // Get managed alerts (Doctor)
  getManagedAlerts: async (
    params?: {
      active_only?: boolean;
      days?: number;
      limit?: number;
    }
  ): Promise<Alert[]> => {
    const response = await api.get('/alerts/managed', { params });
    return response.data;
  },

  // Get unread alerts
  getUnreadAlerts: async (): Promise<Alert[]> => {
    const response = await api.get('/alerts/unread');
    return response.data;
  },

  // Acknowledge alert
  acknowledgeAlert: async (id: number): Promise<Alert> => {
    const response = await api.put(`/alerts/${id}/acknowledge`);
    return response.data;
  },

  // Resolve alert
  resolveAlert: async (id: number, notes?: string): Promise<Alert> => {
    const response = await api.put(`/alerts/${id}/resolve`, {
      resolution_notes: notes,
    });
    return response.data;
  },
};
