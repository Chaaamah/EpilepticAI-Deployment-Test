import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "doctor";
  phone?: string;
  location?: string;
  bio?: string;
  specialization?: string;
  licenseNumber?: string;
  yearsExperience?: string;
  department?: string;
  education?: string;
  availability?: string;
  password?: string;
  // Additional doctor profile fields
  gender?: string;
  bloodGroup?: string;
  dob?: string;
  clinic?: string;
  status?: string;
  qualifications?: string;
  certifications?: string;
  awards?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  addDoctor: (doctorData: Omit<User, "id" | "role">) => void;
  updateDoctor: (doctorId: number, data: Partial<Omit<User, "id" | "role">>) => void;
  deleteDoctor: (doctorId: number) => void;
  getDoctors: () => User[];
  getDoctorById: (id: number) => User | undefined;
  getDoctorByEmail: (email: string) => User | undefined;
  updatePatientsOwner: (oldEmail: string, newEmail: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -------------------------
// DOCTEURS INITIAUX
// -------------------------

const initialDoctors: User[] = [
  {
    id: 1,
    name: "Dr. Ahmed Ben Salem",
    email: "ahmed@gmail.com",
    password: "doctor123",
    role: "doctor",
    phone: "+216 55 123 456",
    location: "Tunis",
    specialization: "Neurologist",
    yearsExperience: "15",
    department: "Neurology",
    education: "MD in Neurology\nPhD in Neuroscience",
    availability: "Mon-Fri: 8AM-5PM"
  },
  {
    id: 2,
    name: "Dr. Sarah Johnson",
    email: "sarah@gmail.com",
    password: "doctor123",
    role: "doctor",
    phone: "+216 55 789 123",
    location: "Sousse",
    specialization: "Epileptologist",
    yearsExperience: "10",
    department: "Epilepsy Center",
    education: "MD in Neurology\nFellowship in Epilepsy",
    availability: "Mon-Wed-Fri: 9AM-4PM"
  }
];

const defaultAdmin: User = {
  id: 999,
  name: "Administrator",
  email: "admin@gmail.com",
  password: "admin",
  role: "admin",
  location: "Tunisia",
  specialization: "System Administrator"
};

// -------------------------
// CHARGER DOCTEURS
// -------------------------

const getStoredDoctors = (): User[] => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("epilepticai_doctors");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((doc: any) => ({
          ...doc,
          role: "doctor" as const,
          password: doc.password || "doctor123"
        }));
      } catch {
        return initialDoctors;
      }
    }
  }
  return initialDoctors;
};

// -------------------------
// UPDATE PATIENTS OWNER
// -------------------------

const updatePatientsOwnerInStorage = (oldEmail: string, newEmail: string): boolean => {
  try {
    const oldKey = `patients_${oldEmail}`;
    const newKey = `patients_${newEmail}`;

    const oldPatients = localStorage.getItem(oldKey);

    if (oldPatients) {
      const patients = JSON.parse(oldPatients);
      const updated = patients.map((p: any) => ({ ...p, owner: newEmail }));

      localStorage.setItem(newKey, JSON.stringify(updated));
      localStorage.removeItem(oldKey);
      return true;
    }

    localStorage.setItem(newKey, JSON.stringify([]));
    return true;
  } catch {
    return false;
  }
};

// -------------------------
// PROVIDER
// -------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [doctors, setDoctors] = useState<User[]>(() =>
    getStoredDoctors().map(d => ({ ...d, role: "doctor" as const }))
  );

  useEffect(() => {
    const savedUser = localStorage.getItem("epilepticai_user");
    const authToken = localStorage.getItem("auth_token");

    if (savedUser && authToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser({ ...parsed, role: parsed.role as "admin" | "doctor" });
      } catch {
        localStorage.removeItem("epilepticai_user");
        localStorage.removeItem("auth_token");
      }
    }

    setIsLoading(false);
  }, []);

  // -------------------------
  // LOGIN
  // -------------------------

  const login = async (email: string, password: string): Promise<boolean> => {
    // Login via API for all users (admin, doctor, patient)
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      console.log('Login response:', data);

      // Store the token
      localStorage.setItem('auth_token', data.access_token);

      // Determine user role from login response
      const userRole = data.user_type; // "admin", "doctor", or "patient"

      // For admin users, create a minimal user object
      if (userRole === "admin") {
        // For admins, we don't have a /me endpoint that returns admin data
        // So we create a user object from the login data
        const adminUser = {
          id: 0, // Will be updated if needed
          name: "Administrator",
          email: email,
          role: "admin" as const,
          phone: "",
          specialization: "System Administrator",
          location: ""
        };

        setUser(adminUser);
        localStorage.setItem("epilepticai_user", JSON.stringify(adminUser));
        return true;
      }

      // For doctor users, get full profile from /me endpoint
      if (userRole === "doctor") {
        const userResponse = await fetch('/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();

          // Handle both User and Doctor models - Map ALL fields
          const logged = {
            id: userData.id,
            name: userData.full_name || userData.name,
            email: userData.email,
            role: "doctor" as const,
            phone: userData.phone || "",
            specialization: userData.specialization || "",
            location: userData.hospital || "",
            licenseNumber: userData.license_number || "",
            bio: userData.bio || "",
            yearsExperience: String(userData.years_experience || ""),
            education: userData.education || "",
            availability: userData.availability || "",
            gender: userData.gender || "",
            bloodGroup: userData.blood_group || "",
            dob: userData.dob || "",
            clinic: userData.clinic || "",
            status: userData.status || "available",
            qualifications: userData.qualifications || "",
            certifications: userData.certifications || "",
            awards: userData.awards || "",
            profileImage: userData.profile_image || ""
          };

          console.log('User data from API:', userData);
          console.log('Logged user:', logged);

          setUser(logged);
          localStorage.setItem("epilepticai_user", JSON.stringify(logged));
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("epilepticai_user");
    localStorage.removeItem("auth_token");
  };

  // -------------------------
  // PROFILE UPDATE
  // -------------------------

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;

    // Admin updates only locally
    if (user.role === "admin") {
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem("epilepticai_user", JSON.stringify(updated));
      return;
    }

    // Doctor updates via API
    if (user.role === "doctor") {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Prepare data for API (map frontend fields to backend fields)
        const updateData: any = {};
        if (data.email !== undefined) updateData.email = data.email;
        if (data.name !== undefined) updateData.full_name = data.name;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.specialization !== undefined) updateData.specialization = data.specialization;
        if (data.location !== undefined) updateData.hospital = data.location;
        if (data.licenseNumber !== undefined) updateData.license_number = data.licenseNumber;
        if ((data as any).bio !== undefined) updateData.bio = (data as any).bio;
        if ((data as any).qualifications !== undefined) updateData.qualifications = (data as any).qualifications;
        if ((data as any).yearsExperience !== undefined) updateData.years_experience = (data as any).yearsExperience;
        if ((data as any).gender !== undefined) updateData.gender = (data as any).gender;
        if ((data as any).bloodGroup !== undefined) updateData.blood_group = (data as any).bloodGroup;
        if ((data as any).dob !== undefined) updateData.dob = (data as any).dob;
        if ((data as any).clinic !== undefined) updateData.clinic = (data as any).clinic;
        if ((data as any).status !== undefined) updateData.status = (data as any).status;
        if ((data as any).availability !== undefined) updateData.availability = (data as any).availability;
        if ((data as any).education !== undefined) updateData.education = (data as any).education;
        if ((data as any).certifications !== undefined) updateData.certifications = (data as any).certifications;
        if ((data as any).awards !== undefined) updateData.awards = (data as any).awards;

        console.log('Sending update to API:', updateData);

        // Call API to update doctor profile
        const response = await fetch('/api/v1/doctors/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to update profile');
        }

        const updatedDoctor = await response.json();
        console.log('Updated doctor from API:', updatedDoctor);

        // Update local state with response from API - Map ALL fields
        const updated = {
          ...user,
          email: updatedDoctor.email || user.email,
          name: updatedDoctor.full_name || user.name,
          phone: updatedDoctor.phone || user.phone,
          specialization: updatedDoctor.specialization || user.specialization,
          location: updatedDoctor.hospital || user.location,
          licenseNumber: updatedDoctor.license_number || user.licenseNumber,
          bio: updatedDoctor.bio || user.bio,
          yearsExperience: String(updatedDoctor.years_experience || user.yearsExperience || ''),
          education: updatedDoctor.education || user.education,
          availability: updatedDoctor.availability || user.availability,
          gender: updatedDoctor.gender || user.gender,
          bloodGroup: updatedDoctor.blood_group || user.bloodGroup,
          dob: updatedDoctor.dob || user.dob,
          clinic: updatedDoctor.clinic || user.clinic,
          status: updatedDoctor.status || user.status,
          qualifications: updatedDoctor.qualifications || user.qualifications,
          certifications: updatedDoctor.certifications || user.certifications,
          awards: updatedDoctor.awards || user.awards,
        };

        console.log('Updated user state:', updated);

        setUser(updated);
        localStorage.setItem("epilepticai_user", JSON.stringify(updated));

        // Also update doctors list
        const updatedDoctors = doctors.map(d => (d.id === user.id ? updated : d));
        setDoctors(updatedDoctors);
        localStorage.setItem("epilepticai_doctors", JSON.stringify(updatedDoctors));

      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    }
  };

  // -------------------------
  // UPDATE DOCTOR
  // -------------------------

  const updateDoctor = (doctorId: number, data: Partial<Omit<User, "id" | "role">>) => {
    const current = getStoredDoctors();
    const old = current.find(d => d.id === doctorId);
    if (!old) return;

    const oldEmail = old.email;
    const newEmail = data.email || oldEmail;

    const updatedDoctors = current.map(doc =>
      doc.id === doctorId
        ? {
            ...doc,
            ...data,
            role: "doctor" as const,
            password: data.password || doc.password || "doctor123"
          }
        : doc
    );

    setDoctors(updatedDoctors);
    localStorage.setItem("epilepticai_doctors", JSON.stringify(updatedDoctors));

    if (oldEmail !== newEmail) updatePatientsOwnerInStorage(oldEmail, newEmail);

    if (user && user.id === doctorId) {
      setUser({ ...user, ...data, role: "doctor" });
    }
  };

  // -------------------------
  // ADD DOCTOR
  // -------------------------

  const addDoctor = (doctorData: Omit<User, "id" | "role">) => {
    const current = getStoredDoctors();

    if (current.some(d => d.email.toLowerCase() === doctorData.email.toLowerCase())) {
      alert("Email already used.");
      return;
    }

    const newDoctor: User = {
      ...doctorData,
      id: current.length > 0 ? Math.max(...current.map(d => d.id)) + 1 : 1,
      role: "doctor" as const,
      password: doctorData.password || "doctor123"
    };

    const updated = [...current, newDoctor];

    setDoctors(updated);
    localStorage.setItem("epilepticai_doctors", JSON.stringify(updated));
    localStorage.setItem(`patients_${doctorData.email}`, JSON.stringify([]));
  };

  // -------------------------
  // DELETE DOCTOR
  // -------------------------

  const deleteDoctor = (doctorId: number) => {
    if (doctorId === 999) return alert("Cannot delete admin");

    const current = getStoredDoctors();
    const doctor = current.find(d => d.id === doctorId);

    const updated = current.filter(d => d.id !== doctorId);

    setDoctors(updated);
    localStorage.setItem("epilepticai_doctors", JSON.stringify(updated));

    if (doctor) localStorage.removeItem(`patients_${doctor.email}`);

    if (user && user.id === doctorId) logout();
  };

  // -------------------------
  // PROVIDER RETURN
  // -------------------------

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
        addDoctor,
        updateDoctor,
        deleteDoctor,
        getDoctors: () => getStoredDoctors(),
        getDoctorById: id => getStoredDoctors().find(d => d.id === id),
        getDoctorByEmail: email =>
          getStoredDoctors().find(d => d.email.toLowerCase() === email.toLowerCase()),
        updatePatientsOwner: updatePatientsOwnerInStorage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
