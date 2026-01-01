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
      setAllPatients([]);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setAllPatients([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await patientService.getPatientsWithMetrics();

      // Transform API data to match our Patient interface
      const transformedPatients: Patient[] = response.map((p: any) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        age: calculateAge(p.date_of_birth),
        email: p.email || '',
        phone: p.phone || '',
        description: p.medical_history || '',
        owner: user.email,
        riskScore: p.high_risk ? 85 : p.last_seizure_days_ago <= 7 ? 60 : 30,
        heartRate: 75, // Default value, update if you have this data
        healthStatus: p.high_risk ? 'critical' : p.last_seizure_days_ago <= 7 ? 'moderate' : 'stable',
        lastVisit: p.last_seizure_date || p.created_at,
        createdAt: p.created_at,
        epilepsyType: '', // Add if available in API
        seizureFrequency: `${p.total_seizures} total seizures`,
        medications: '', // Add if available in API
        allergies: '',
        admissionDate: p.created_at,
        nextAppointment: ''
      }));

      setAllPatients(transformedPatients);
    } catch (err: any) {
      console.error('Error loading patients:', err);
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
      // Parse name into first_name and last_name
      const nameParts = patient.name.split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      // Calculate date_of_birth from age
      const today = new Date();
      const birthYear = today.getFullYear() - patient.age;
      const date_of_birth = `${birthYear}-01-01`;

      const newPatient = await patientService.createPatient({
        first_name,
        last_name,
        date_of_birth,
        gender: 'M', // Default, you might want to add this to the form
        blood_type: 'O+', // Default
        phone: patient.phone || '',
        emergency_contact: patient.phone || '',
        address: '',
        medical_history: patient.description || '',
        email: patient.email
      });

      // Reload patients after adding
      await loadPatients();
    } catch (err: any) {
      console.error('Error adding patient:', err);
      setError(err.message || 'Failed to add patient');
      throw err;
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

      if (data.name) {
        const nameParts = data.name.split(' ');
        updates.first_name = nameParts[0] || '';
        updates.last_name = nameParts.slice(1).join(' ') || '';
      }

      if (data.phone) updates.phone = data.phone;
      if (data.email) updates.email = data.email;
      if (data.description) updates.medical_history = data.description;

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
