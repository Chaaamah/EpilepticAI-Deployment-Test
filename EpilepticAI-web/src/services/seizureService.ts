import api from '@/lib/api';
import { Seizure, SeizureCreateRequest } from '@/types/api';

export const seizureService = {
  // Get seizures for a patient
  getSeizures: async (days: number = 30): Promise<Seizure[]> => {
    const response = await api.get('/seizures', {
      params: { days },
    });
    return response.data;
  },

  // Get specific seizure
  getSeizureById: async (id: number): Promise<Seizure> => {
    const response = await api.get(`/seizures/${id}`);
    return response.data;
  },

  // Create seizure record
  createSeizure: async (data: SeizureCreateRequest): Promise<Seizure> => {
    const response = await api.post('/seizures', data);
    return response.data;
  },

  // Update seizure record
  updateSeizure: async (id: number, data: Partial<SeizureCreateRequest>): Promise<Seizure> => {
    const response = await api.put(`/seizures/${id}`, data);
    return response.data;
  },
};
