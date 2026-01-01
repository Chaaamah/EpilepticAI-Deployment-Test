import api from '@/lib/api';
import { Medication, MedicationCreateRequest } from '@/types/api';

export const medicationService = {
  // Get medications for current patient (requires patient auth)
  getMedications: async (): Promise<Medication[]> => {
    const response = await api.get('/medications');
    return response.data;
  },

  // Get medication by ID
  getMedicationById: async (id: number): Promise<Medication> => {
    const response = await api.get(`/medications/${id}`);
    return response.data;
  },

  // Create medication
  createMedication: async (data: MedicationCreateRequest): Promise<Medication> => {
    const response = await api.post('/medications', data);
    return response.data;
  },

  // Update medication
  updateMedication: async (id: number, data: Partial<MedicationCreateRequest>): Promise<Medication> => {
    const response = await api.put(`/medications/${id}`, data);
    return response.data;
  },

  // Delete medication
  deleteMedication: async (id: number): Promise<void> => {
    await api.delete(`/medications/${id}`);
  },

  // ==================== DOCTOR ENDPOINTS ====================

  // Get medications for a specific patient (doctor auth)
  getPatientMedications: async (patientId: number, statusFilter?: string): Promise<Medication[]> => {
    const params = statusFilter ? { status: statusFilter } : {};
    const response = await api.get(`/doctors/patients/${patientId}/medications`, { params });
    return response.data;
  },

  // Create medication for a patient (doctor auth)
  createPatientMedication: async (
    patientId: number,
    data: MedicationCreateRequest
  ): Promise<Medication> => {
    const response = await api.post(`/doctors/patients/${patientId}/medications`, data);
    return response.data;
  },

  // Update patient's medication (doctor auth)
  updatePatientMedication: async (
    patientId: number,
    medicationId: number,
    data: Partial<MedicationCreateRequest>
  ): Promise<Medication> => {
    const response = await api.put(
      `/doctors/patients/${patientId}/medications/${medicationId}`,
      data
    );
    return response.data;
  },

  // Delete patient's medication (doctor auth)
  deletePatientMedication: async (patientId: number, medicationId: number): Promise<void> => {
    await api.delete(`/doctors/patients/${patientId}/medications/${medicationId}`);
  },

  // Mark medication as taken
  markTaken: async (medicationId: number): Promise<void> => {
    await api.post(`/medications/${medicationId}/take`);
  },
};
