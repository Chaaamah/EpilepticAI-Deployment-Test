import api from '@/lib/api';

export interface BiometricData {
  id: number;
  patient_id: number;
  heart_rate?: number;
  heart_rate_variability?: number;
  spo2?: number;
  skin_temp?: number;
  stress_level?: number;
  activity_level?: string;
  steps?: number;
  calories?: number;
  sleep_hours?: number;
  recorded_at: string;
}

export const biometricService = {
  // Get latest biometric data for a patient (for doctors)
  getLatestBiometrics: async (patientId: number): Promise<BiometricData | null> => {
    try {
      const response = await api.get(`/doctors/patients/${patientId}/biometrics/latest`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch latest biometrics:', error);
      return null;
    }
  },

  // Get biometric history for a patient (for doctors)
  getBiometrics: async (
    patientId: number,
    params?: {
      hours?: number;
    }
  ): Promise<BiometricData[]> => {
    try {
      const response = await api.get(`/doctors/patients/${patientId}/biometrics`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch biometrics:', error);
      return [];
    }
  },
};
