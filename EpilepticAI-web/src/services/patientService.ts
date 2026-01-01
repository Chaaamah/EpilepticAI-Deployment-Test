import api from '@/lib/api';
import {
  Patient,
  PatientMetrics,
  PatientCreateRequest,
  PatientUpdateRequest,
} from '@/types/api';

export const patientService = {
  // Get all patients with metrics
  getPatientsWithMetrics: async (
    params?: {
      skip?: number;
      limit?: number;
      health_status?: string;
    }
  ): Promise<PatientMetrics[]> => {
    const response = await api.get('/doctors/patients/with-metrics', { params });
    return response.data;
  },

  // Get all patients (basic info)
  getPatients: async (params?: { skip?: number; limit?: number }): Promise<Patient[]> => {
    const response = await api.get('/doctors/patients', { params });
    return response.data;
  },

  // Get patient by ID
  getPatientById: async (id: number): Promise<Patient> => {
    const response = await api.get(`/doctors/patients/${id}`);
    return response.data;
  },

  // Create patient
  createPatient: async (data: PatientCreateRequest): Promise<Patient> => {
    const response = await api.post('/doctors/patients', data);
    return response.data;
  },

  // Update patient
  updatePatient: async (id: number, data: PatientUpdateRequest): Promise<Patient> => {
    const response = await api.put(`/doctors/patients/${id}`, data);
    return response.data;
  },

  // Delete patient
  deletePatient: async (id: number): Promise<void> => {
    await api.delete(`/doctors/patients/${id}`);
  },

  // Transfer patient to another doctor
  transferPatient: async (id: number, newDoctorEmail: string): Promise<any> => {
    const response = await api.put(`/doctors/patients/${id}/transfer`, null, {
      params: { new_doctor_email: newDoctorEmail },
    });
    return response.data;
  },
};
