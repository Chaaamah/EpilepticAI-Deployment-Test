import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { patientService } from "@/services/patientService";

export interface Patient {
  id: string | number;
  name: string;
  age: number;
  email?: string;
  phone?: string;
  description?: string;
  owner: string;
  riskScore: number;
  heartRate: number;
  healthStatus?: string;
  lastVisit: string;
  createdAt?: string;

  epilepsyType?: string;
  seizureFrequency?: string;
  medications?: string;
  allergies?: string;
  admissionDate?: string;
  nextAppointment?: string;

  // Medical team and factors
  treating_neurologist?: string;
  trigger_factors?: string[];
  hospital?: string;
  address?: string;
}

interface PatientsContextType {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  refreshPatients: () => Promise<void>;
  addPatient: (patient: Omit<Patient, "id">) => Promise<void>;
  updatePatient: (id: string | number, data: Partial<Omit<Patient, "id">>) => Promise<void>;
  deletePatient: (id: string | number) => Promise<void>;
  getPatientById: (id: string | number) => Patient | undefined;
  getPatientByName: (name: string) => Patient | undefined;
  getPatientsByDoctor: (doctorEmail: string) => Patient[];
  getAllPatients: () => Patient[];
  updatePatientOwner: (oldEmail: string, newEmail: string) => void;
  getTotalPatients: () => number;
  getPatientsByStatus: (status: string) => Patient[];
  getCriticalPatients: () => Patient[];
  getPatientsCountByDoctor: (doctorEmail: string) => number;
}

const PatientsContext = createContext<PatientsContextType | undefined>(undefined);

export const PatientsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load patients from API
  const loadPatients = async () => {
    if (!user || user.role !== 'doctor') {
      console.log('User not doctor or not logged in');
      setAllPatients([]);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('No auth token found');
      setAllPatients([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading patients from API...');

      // Use the simple endpoint that works
      const response = await patientService.getPatients();

      console.log('Patients loaded from API:', response);

      // Transform API data to match our Patient interface
      const transformedPatients: Patient[] = response.map((p: any) => ({
        id: p.id,
        name: p.full_name || '',
        age: calculateAge(p.date_of_birth),
        email: p.email || '',
        phone: p.phone || '',
        description: p.medical_history || '',
        owner: user.email,
        riskScore: 50, // Default value since we don't have metrics
        heartRate: 75, // Default value
        healthStatus: p.health_status || 'stable',
        lastVisit: p.created_at,
        createdAt: p.created_at,
        epilepsyType: p.epilepsy_type || '',
        seizureFrequency: '0 total seizures', // We don't have this data in basic endpoint
        medications: '',
        allergies: '',
        admissionDate: p.created_at,
        nextAppointment: '',
        // Medical team and factors
        treating_neurologist: p.treating_neurologist || '',
        trigger_factors: p.trigger_factors || [],
        hospital: p.hospital || '',
        address: p.address || ''
      }));

      console.log('Transformed patients:', transformedPatients);
      setAllPatients(transformedPatients);
    } catch (err: any) {
      console.error('Error loading patients:', err);
      console.error('Error response:', err.response);
      setError(err.message || 'Failed to load patients');
      setAllPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Load patients when user changes
  useEffect(() => {
    loadPatients();
  }, [user]);

  const refreshPatients = async () => {
    await loadPatients();
  };

  const patients = allPatients;

  // Add patient via API
  const addPatient = async (patient: Omit<Patient, "id">) => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate date_of_birth from age
      const today = new Date();
      const birthYear = today.getFullYear() - patient.age;
      const birthMonth = String(today.getMonth() + 1).padStart(2, '0');
      const birthDay = String(today.getDate()).padStart(2, '0');
      const date_of_birth = `${birthYear}-${birthMonth}-${birthDay}`;

      // Prepare request data - only include defined fields
      const requestData: any = {
        email: patient.email || `patient${Date.now()}@epileptic.ai`,
        full_name: patient.name,
        password: (patient as any).password || 'EpilepticAI2024!',
        date_of_birth: date_of_birth,
      };

      // Add optional fields only if they have values
      if (patient.phone) requestData.phone = patient.phone;
      if (patient.description) requestData.medical_history = patient.description;
      if (patient.epilepsyType) requestData.epilepsy_type = patient.epilepsyType;
      if (user?.name) requestData.treating_neurologist = user.name;
      if (user?.location) requestData.hospital = user.location;

      // Gender defaults to 'M' if not specified
      requestData.gender = 'M';

      // Trigger factors as empty array
      requestData.trigger_factors = [];

      console.log('Creating patient with data:', requestData);

      // Create patient data matching PatientCreateByDoctor schema
      const createdPatient = await patientService.createPatient(requestData);

      console.log('Patient created successfully:', createdPatient);

      // Reload patients after adding
      await loadPatients();
    } catch (err: any) {
      console.error('Error adding patient:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      console.error('Error status:', err.response?.status);

      // For 422 errors, log validation details
      if (err.response?.status === 422 && err.response?.data?.detail) {
        console.error('Validation errors:', err.response.data.detail);
      }

      const errorMessage = err.response?.data?.detail || err.message || 'Failed to add patient';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update patient via API
  const updatePatient = async (id: string | number, data: Partial<Omit<Patient, "id">>) => {
    setIsLoading(true);
    setError(null);

    try {
      const updates: any = {};

      if (data.name) updates.full_name = data.name;
      if (data.email) updates.email = data.email;
      if (data.phone) updates.phone = data.phone;
      if (data.description) updates.medical_history = data.description;
      if (data.epilepsyType) updates.epilepsy_type = data.epilepsyType;
      if (data.healthStatus) updates.health_status = data.healthStatus;
      if ((data as any).country) updates.hospital = (data as any).country;
      if ((data as any).address !== undefined) updates.address = (data as any).address;

      // Medical team and triggers
      if ((data as any).treating_neurologist !== undefined) {
        updates.treating_neurologist = (data as any).treating_neurologist;
      }
      if ((data as any).trigger_factors !== undefined) {
        updates.trigger_factors = (data as any).trigger_factors;
      }

      // Convert age to date_of_birth if age is provided
      if (data.age !== undefined) {
        const today = new Date();
        const birthYear = today.getFullYear() - data.age;
        const birthMonth = String(today.getMonth() + 1).padStart(2, '0');
        const birthDay = String(today.getDate()).padStart(2, '0');
        updates.date_of_birth = `${birthYear}-${birthMonth}-${birthDay}`;
      }

      console.log('Sending update to API:', updates);

      await patientService.updatePatient(Number(id), updates);

      // Reload patients after updating
      await loadPatients();
    } catch (err: any) {
      console.error('Error updating patient:', err);
      setError(err.message || 'Failed to update patient');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete patient via API
  const deletePatient = async (id: string | number) => {
    setIsLoading(true);
    setError(null);

    try {
      await patientService.deletePatient(Number(id));

      // Reload patients after deleting
      await loadPatients();
    } catch (err: any) {
      console.error('Error deleting patient:', err);
      setError(err.message || 'Failed to delete patient');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getPatientById = (id: string | number): Patient | undefined => {
    return allPatients.find(p => p.id === id);
  };

  const getPatientByName = (name: string): Patient | undefined => {
    return allPatients.find(p => p.name.toLowerCase() === name.toLowerCase());
  };

  const getPatientsByDoctor = (doctorEmail: string): Patient[] => {
    return allPatients.filter(p => p.owner === doctorEmail);
  };

  const getAllPatients = (): Patient[] => {
    return allPatients;
  };

  const updatePatientOwner = (oldEmail: string, newEmail: string) => {
    // This would require a backend endpoint to transfer patients
    console.warn('updatePatientOwner not implemented for API version');
  };

  const getTotalPatients = (): number => {
    return allPatients.length;
  };

  const getPatientsByStatus = (status: string): Patient[] => {
    return allPatients.filter(p => p.healthStatus === status);
  };

  const getCriticalPatients = (): Patient[] => {
    return allPatients.filter(p => p.healthStatus === 'critical' || p.riskScore >= 70);
  };

  const getPatientsCountByDoctor = (doctorEmail: string): number => {
    return allPatients.filter(p => p.owner === doctorEmail).length;
  };

  return (
    <PatientsContext.Provider
      value={{
        patients,
        isLoading,
        error,
        refreshPatients,
        addPatient,
        updatePatient,
        deletePatient,
        getPatientById,
        getPatientByName,
        getPatientsByDoctor,
        getAllPatients,
        updatePatientOwner,
        getTotalPatients,
        getPatientsByStatus,
        getCriticalPatients,
        getPatientsCountByDoctor,
      }}
    >
      {children}
    </PatientsContext.Provider>
  );
};

export const usePatients = () => {
  const context = useContext(PatientsContext);
  if (!context) {
    throw new Error("usePatients must be used within PatientsProvider");
  }
  return context;
};
