import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
  addPatient: (patient: Omit<Patient, "id">) => void;
  updatePatient: (id: string | number, data: Partial<Omit<Patient, "id">>) => void;
  deletePatient: (id: string | number) => void;
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

// Charger tous les patients
const loadAllPatientsFromStorage = (): Patient[] => {
  if (typeof window === "undefined") return [];

  const all: Patient[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("patients_")) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed: Patient[] = JSON.parse(saved);
          parsed.forEach(p => {
            if (!p.createdAt) p.createdAt = new Date().toISOString();
            all.push(p);
          });
        } catch {}
      }
    }
  }

  return all;
};

export const PatientsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [allPatients, setAllPatients] = useState<Patient[]>(() => loadAllPatientsFromStorage());

  const patients = user?.email
    ? allPatients.filter(p => p.owner === user.email)
    : [];

  // Sauvegarder patients groupés
  const saveAllPatients = (patientsList: Patient[]) => {
    const groups: Record<string, Patient[]> = {};

    patientsList.forEach(p => {
      if (!groups[p.owner]) groups[p.owner] = [];
      groups[p.owner].push(p);
    });

    Object.entries(groups).forEach(([owner, list]) => {
      localStorage.setItem(`patients_${owner}`, JSON.stringify(list));
    });

    const keys = Object.keys(localStorage).filter(k => k.startsWith("patients_"));
    keys.forEach(key => {
      const email = key.replace("patients_", "");
      if (!groups[email]) localStorage.removeItem(key);
    });
  };

  useEffect(() => {
    saveAllPatients(allPatients);
  }, [allPatients]);

  const addPatient = (data: Omit<Patient, "id">) => {
    const newId =
      allPatients.length > 0 ? Math.max(...allPatients.map(p => Number(p.id))) + 1 : 1;

    const newPatient: Patient = {
      ...data,
      id: newId,
      owner: user?.email || "",
      createdAt: new Date().toISOString()
    };

    setAllPatients(prev => [newPatient, ...prev]);
  };

  const updatePatient = (id: string | number, data: Partial<Omit<Patient, "id">>) => {
    const numericId = Number(id);
    setAllPatients(prev => prev.map(p => (Number(p.id) === numericId ? { ...p, ...data } : p)));
  };

  const deletePatient = (id: string | number) => {
    const numericId = Number(id);
    setAllPatients(prev => prev.filter(p => Number(p.id) !== numericId));
  };

  const updatePatientOwner = (oldEmail: string, newEmail: string) => {
    setAllPatients(prev =>
      prev.map(p => (p.owner === oldEmail ? { ...p, owner: newEmail } : p))
    );
  };

  const getPatientById = (id: string | number) => {
    const numericId = id.toString();
    return allPatients.find(p => p.id.toString() === numericId);
  };

  return (
    <PatientsContext.Provider
      value={{
        patients,
        addPatient,
        updatePatient,
        deletePatient,
        getPatientById,
        getPatientByName: name =>
          allPatients.find(p => p.name.toLowerCase() === name.toLowerCase()),
        getPatientsByDoctor: email => allPatients.filter(p => p.owner === email),
        getAllPatients: () => allPatients,
        updatePatientOwner,
        getTotalPatients: () => allPatients.length,
        getPatientsByStatus: status =>
          allPatients.filter(p => p.healthStatus?.toLowerCase() === status.toLowerCase()),
        getCriticalPatients: () =>
          allPatients.filter(p => p.healthStatus?.toLowerCase() === "critical"),
        getPatientsCountByDoctor: email =>
          allPatients.filter(p => p.owner === email).length
      }}
    >
      {children}
    </PatientsContext.Provider>
  );
};

export const usePatients = () => {
  const ctx = useContext(PatientsContext);
  if (!ctx) throw new Error("usePatients must be used inside PatientsProvider");
  return ctx;
};
