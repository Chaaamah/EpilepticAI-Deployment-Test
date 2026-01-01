import api from '@/lib/api';
import { Doctor } from '@/types/api';

export interface DoctorUpdateRequest {
  full_name?: string;
  phone?: string;
  specialization?: string;
  hospital?: string;
}

export const doctorService = {
  // Get current doctor profile
  getCurrentDoctor: async (): Promise<Doctor> => {
    const response = await api.get('/doctors/me');
    return response.data;
  },

  // Update current doctor profile
  updateCurrentDoctor: async (data: DoctorUpdateRequest): Promise<Doctor> => {
    const response = await api.put('/doctors/me', data);
    return response.data;
  },

  // Get all doctors (for patient app)
  getDoctors: async (params?: { skip?: number; limit?: number }): Promise<Doctor[]> => {
    const response = await api.get('/doctors', { params });
    return response.data;
  },

  // Get doctor by ID
  getDoctorById: async (id: number): Promise<Doctor> => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },
};
