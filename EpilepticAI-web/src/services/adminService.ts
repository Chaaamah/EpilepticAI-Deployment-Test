import axios from 'axios';

const API_BASE_URL = '/api/v1';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Configure axios with auth header
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// ============================================
// DOCTOR MANAGEMENT (Admin)
// ============================================

export interface DoctorCreateData {
  email: string;
  full_name: string;
  password: string;
  phone?: string;
  specialization?: string;
  hospital?: string;
  license_number?: string;
  location?: string;
  department?: string;
  availability?: string;
  qualifications?: string;
  blood_group?: string;
  gender?: string;
  years_experience?: string;
  bio?: string;
  education?: string;
  certifications?: string;
  awards?: string;
  dob?: string;
  clinic?: string;
  status?: string;
}

export interface DoctorUpdateData {
  email?: string;
  full_name?: string;
  phone?: string;
  specialization?: string;
  hospital?: string;
  license_number?: string;
  location?: string;
  department?: string;
  availability?: string;
  qualifications?: string;
  blood_group?: string;
  gender?: string;
  years_experience?: string;
  bio?: string;
  education?: string;
  certifications?: string;
  awards?: string;
  dob?: string;
  clinic?: string;
  status?: string;
}

export interface Doctor {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  specialization?: string;
  hospital?: string;
  license_number?: string;
  location?: string;
  department?: string;
  availability?: string;
  qualifications?: string;
  blood_group?: string;
  gender?: string;
  years_experience?: string;
  bio?: string;
  education?: string;
  certifications?: string;
  awards?: string;
  dob?: string;
  clinic?: string;
  status?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Get all doctors (uses /doctors endpoint to get full doctor profiles)
 */
export const getAllDoctors = async (): Promise<Doctor[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doctors/`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
};

/**
 * Get a specific doctor by ID
 */
export const getDoctorById = async (doctorId: number): Promise<Doctor> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doctors/${doctorId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching doctor:', error);
    throw error;
  }
};

/**
 * Create a new doctor (admin only)
 * Uses the /auth/register/doctor endpoint which creates both User and Doctor records
 */
export const createDoctor = async (doctorData: DoctorCreateData): Promise<Doctor> => {
  try {
    // Use the registration endpoint which handles both User and Doctor creation
    const response = await axios.post(
      `${API_BASE_URL}/auth/register/doctor`,
      {
        ...doctorData,
        confirm_password: doctorData.password, // Required for registration
      },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating doctor:', error);
    throw error;
  }
};

/**
 * Update doctor information (admin)
 */
export const updateDoctor = async (
  doctorId: number,
  doctorData: DoctorUpdateData
): Promise<Doctor> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/doctors/${doctorId}`,
      doctorData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating doctor:', error);
    throw error;
  }
};

/**
 * Delete/deactivate a doctor (admin only)
 */
export const deleteDoctor = async (doctorId: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/doctors/${doctorId}`, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    throw error;
  }
};

/**
 * Change doctor password (admin only)
 */
export const changeDoctorPassword = async (
  doctorId: number,
  newPassword: string
): Promise<void> => {
  try {
    await axios.patch(
      `${API_BASE_URL}/users/${doctorId}/password`,
      { new_password: newPassword },
      {
        headers: getAuthHeaders(),
      }
    );
  } catch (error) {
    console.error('Error changing doctor password:', error);
    throw error;
  }
};

// ============================================
// PATIENT MANAGEMENT (Admin)
// ============================================

export interface Patient {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  epilepsy_type?: string;
  diagnosis_date?: string;
  trigger_factors?: string[];
  medical_history?: string;
  treating_neurologist?: string;
  hospital?: string;
  address?: string;
  health_status?: string;
  emergency_contacts?: any[];
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PatientCreateData {
  email: string;
  full_name: string;
  password: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  epilepsy_type?: string;
  diagnosis_date?: string;
  trigger_factors?: string[];
  medical_history?: string;
  treating_neurologist?: string;
  hospital?: string;
  address?: string;
  health_status?: string;
}

export interface PatientUpdateData {
  email?: string;
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  epilepsy_type?: string;
  diagnosis_date?: string;
  trigger_factors?: string[];
  medical_history?: string;
  treating_neurologist?: string;
  hospital?: string;
  address?: string;
  health_status?: string;
}

/**
 * Get all patients (admin - uses doctor endpoint)
 */
export const getAllPatients = async (): Promise<Patient[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doctors/patients`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
};

/**
 * Get a specific patient by ID
 */
export const getPatientById = async (patientId: number): Promise<Patient> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doctors/patients/${patientId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw error;
  }
};

/**
 * Create a new patient (admin - uses doctor endpoint)
 */
export const createPatient = async (patientData: PatientCreateData): Promise<Patient> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/doctors/patients`,
      patientData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};

/**
 * Update patient information (admin - uses doctor endpoint)
 */
export const updatePatient = async (
  patientId: number,
  patientData: PatientUpdateData
): Promise<Patient> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/doctors/patients/${patientId}`,
      patientData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

/**
 * Delete/deactivate a patient (admin - uses doctor endpoint)
 */
export const deletePatient = async (patientId: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/doctors/patients/${patientId}`, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};

// ============================================
// STATISTICS (Admin)
// ============================================

export interface UserStats {
  total_users: number;
  total_admins: number;
  total_doctors: number;
  total_patients: number;
  active_users: number;
  inactive_users: number;
  verified_users: number;
  unverified_users: number;
}

/**
 * Get user statistics
 */
export const getUserStats = async (): Promise<UserStats> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/stats`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

export default {
  // Doctor management
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  changeDoctorPassword,

  // Patient management
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,

  // Statistics
  getUserStats,
};
