import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Users, Trash2, Mail, Phone, MapPin, GraduationCap, BriefcaseMedical, Clock, FileText, Edit, Eye, Calendar, Shield, User, Heart, Activity, PieChart, Filter, ArrowLeft, AlertCircle, Brain, Pill, Stethoscope, Thermometer, ActivitySquare, BrainCircuit, HeartPulse, Clock3, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePatients, Patient } from "@/contexts/PatientsContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import * as adminService from "@/services/adminService";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { patients: allPatients, deletePatient, getPatientsByDoctor, getPatientById } = usePatients();
  const { toast } = useToast();
  const navigate = useNavigate();
  
 
  
  // State for doctors and patients
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState("doctors");
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [doctorPatientsDialogOpen, setDoctorPatientsDialogOpen] = useState(false);
  const [patientViewDialogOpen, setPatientViewDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDoctorForPatients, setSelectedDoctorForPatients] = useState(null);

  interface ExtendedPatient extends Patient {
    epilepsyType?: string;
    seizureFrequency?: string;
    medications?: string;
    allergies?: string;
    admissionDate?: string;
    nextAppointment?: string;
  }

  const [selectedDoctorPatients, setSelectedDoctorPatients] = useState<ExtendedPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ExtendedPatient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    location: "",
    customLocation: "",
    password: "",
    specialization: "",
    customSpecialization: "",
    licenseNumber: "",
    yearsExperience: "",
    department: "",
    education: "",
    availability: "",
    bio: ""
  });

  const [patientStatusFilter, setPatientStatusFilter] = useState("all");
  const [patientDoctorFilter, setPatientDoctorFilter] = useState("all");
  const [patientSortBy, setPatientSortBy] = useState("recent");
  const [isAssigningDoctor, setIsAssigningDoctor] = useState(false);
  const [selectedDoctorForAssignment, setSelectedDoctorForAssignment] = useState("");

  const countries = [
    "Select a country",
    "Tunisia",
    "France",
    "United States",
    "Canada",
    "United Kingdom",
    "Germany",
    "Spain",
    "Italy",
    "Japan",
    "Australia",
    "Brazil",
    "Mexico",
    "India",
    "China",
    "South Korea",
    "Other"
  ];

  const specializations = [
    "Select a specialization",
    "Neurologist",
    "Epileptologist",
    "Neurosurgeon",
    "General Practitioner",
    "Pediatric Neurologist",
    "Clinical Neurophysiologist",
    "Psychiatrist",
    "Cardiologist",
    "General Medicine",
    "Emergency Medicine",
    "Other"
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
    toast({
      title: "Logged out successfully",
      description: "You have been logged out successfully.",
    });
  };

  useEffect(() => {
    loadDoctors();
    loadPatients();
  }, []);

  const loadDoctors = async () => {
    try {
      const doctorsList = await adminService.getAllDoctors();
      // Map backend fields to frontend format
      const mappedDoctors = doctorsList.map(doc => ({
        id: doc.id,
        name: doc.full_name,
        email: doc.email,
        phone: doc.phone || "",
        location: doc.location || doc.hospital || "",
        specialization: doc.specialization || "",
        licenseNumber: doc.license_number || "",
        yearsExperience: doc.years_experience || "",
        department: doc.department || "",
        education: doc.education || "",
        availability: doc.availability || "",
        bio: doc.bio || "",
        createdAt: doc.created_at,
        isActive: doc.is_active
      }));
      setDoctors(mappedDoctors);
      console.log('Doctors loaded from API:', mappedDoctors);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "Error",
        description: "Unable to load doctors list from server.",
        variant: "destructive"
      });
    }
  };

  const loadPatients = async () => {
    try {
      const patientsList = await adminService.getAllPatients();
      // Map backend fields to frontend format
      const mappedPatients = patientsList.map(patient => ({
        id: patient.id,
        name: patient.full_name,
        email: patient.email,
        phone: patient.phone || "",
        dateOfBirth: patient.date_of_birth || "",
        gender: patient.gender || "",
        epilepsyType: patient.epilepsy_type || "",
        diagnosisDate: patient.diagnosis_date || "",
        triggerFactors: patient.trigger_factors || [],
        medicalHistory: patient.medical_history || "",
        treatingNeurologist: patient.treating_neurologist || "",
        hospital: patient.hospital || "",
        address: patient.address || "",
        healthStatus: patient.health_status || "stable",
        emergencyContacts: patient.emergency_contacts || [],
        isActive: patient.is_active,
        createdAt: patient.created_at
      }));
      setPatients(mappedPatients);
      console.log('Patients loaded from API:', mappedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        title: "Error",
        description: "Unable to load patients list from server.",
        variant: "destructive"
      });
    }
  };

  const addDoctor = async (doctorData) => {
    try {
      const newDoctor = await adminService.createDoctor({
        email: doctorData.email,
        full_name: doctorData.name,
        password: doctorData.password || "doctor123",
        phone: doctorData.phone,
        specialization: doctorData.customSpecialization || doctorData.specialization,
        hospital: doctorData.customLocation || doctorData.location,
        license_number: doctorData.licenseNumber,
        location: doctorData.customLocation || doctorData.location,
        department: doctorData.department,
        years_experience: doctorData.yearsExperience,
        bio: doctorData.bio,
        education: doctorData.education,
        availability: doctorData.availability,
      });

      // Reload doctors list from API
      await loadDoctors();

      return newDoctor;
    } catch (error) {
      console.error('Error adding doctor:', error);
      throw error;
    }
  };

  const updateDoctor = async (doctorId, updatedData) => {
    try {
      const updatedDoctor = await adminService.updateDoctor(doctorId, {
        full_name: updatedData.name,
        email: updatedData.email,
        phone: updatedData.phone,
        specialization: updatedData.customSpecialization || updatedData.specialization,
        hospital: updatedData.customLocation || updatedData.location,
        license_number: updatedData.licenseNumber,
        location: updatedData.customLocation || updatedData.location,
        department: updatedData.department,
        years_experience: updatedData.yearsExperience,
        bio: updatedData.bio,
        education: updatedData.education,
        availability: updatedData.availability,
      });

      // Reload doctors list from API
      await loadDoctors();

      return updatedDoctor;
    } catch (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }
  };

  const deleteDoctor = async (doctorId) => {
    try {
      await adminService.deleteDoctor(doctorId);

      // Reload doctors list from API
      await loadDoctors();

      return true;
    } catch (error) {
      console.error('Error deleting doctor:', error);
      throw error;
    }
  };

  const getDoctorById = (doctorId) => {
    return doctors.find(d => d.id === doctorId);
  };

  const getAllPatients = () => {
    // Return patients from state (loaded from API)
    return patients;
  };

  const getDoctorPatients = (doctorEmail: string) => {
    // Filter patients from state based on treating neurologist email
    return patients.filter(patient =>
      patient.treatingNeurologist?.toLowerCase() === doctorEmail.toLowerCase()
    );
  };

  const getDoctorStats = (doctorEmail: string) => {
    const doctorPatients = getDoctorPatients(doctorEmail);
    
    return {
      totalPatients: doctorPatients.length,
      criticalPatients: doctorPatients.filter(p => p.healthStatus?.toLowerCase() === "critical").length,
      highRiskPatients: doctorPatients.filter(p => p.healthStatus?.toLowerCase() === "high").length,
      mediumRiskPatients: doctorPatients.filter(p => p.healthStatus?.toLowerCase() === "medium").length,
      stablePatients: doctorPatients.filter(p => p.healthStatus?.toLowerCase() === "stable").length,
      lowRiskPatients: doctorPatients.filter(p => p.healthStatus?.toLowerCase() === "low").length,
    };
  };

  const getAllPatientsStats = () => {
    const allPatientsList = getAllPatients();
    
    return {
      totalPatients: allPatientsList.length,
      criticalPatients: allPatientsList.filter(p => p.healthStatus?.toLowerCase() === "critical").length,
      highRiskPatients: allPatientsList.filter(p => p.healthStatus?.toLowerCase() === "high").length,
      mediumRiskPatients: allPatientsList.filter(p => p.healthStatus?.toLowerCase() === "medium").length,
      stablePatients: allPatientsList.filter(p => p.healthStatus?.toLowerCase() === "stable").length,
      lowRiskPatients: allPatientsList.filter(p => p.healthStatus?.toLowerCase() === "low").length,
    };
  };

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
    doctor.email.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
    doctor.location?.toLowerCase().includes(doctorSearchQuery.toLowerCase())
  );

  const allPatientsList = getAllPatients();
  const patientsStats = getAllPatientsStats();
  
  const filteredPatients = allPatientsList
    .filter(patient => {
      const matchesSearch = 
        patient.name?.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        patient.email?.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        patient.phone?.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        patient.description?.toLowerCase().includes(patientSearchQuery.toLowerCase());
      
      const matchesStatus = patientStatusFilter === "all" || 
        patient.healthStatus?.toLowerCase() === patientStatusFilter.toLowerCase();
      
      const matchesDoctor = patientDoctorFilter === "all" ||
        patient.treatingNeurologist?.toLowerCase() === patientDoctorFilter.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesDoctor;
    })
    .sort((a, b) => {
      switch (patientSortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "risk":
          return b.riskScore - a.riskScore;
        case "status":
          const statusOrder = { critical: 0, high: 1, medium: 2, stable: 3, low: 4 };
          return (statusOrder[a.healthStatus?.toLowerCase()] || 5) - (statusOrder[b.healthStatus?.toLowerCase()] || 5);
        case "recent":
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

  const getHealthStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "stable":
        return "default";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const getHealthStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "critical":
        return "Critical";
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "stable":
        return "Stable";
      case "low":
        return "Low";
      default:
        return status || "Unknown";
    }
  };

  const handleViewPatient = (patientId: string | number) => {
    const id = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
    const patient = getPatientById(id);
    if (patient) {
      setSelectedPatient(patient);
      setPatientViewDialogOpen(true);
      setIsAssigningDoctor(false);
      setSelectedDoctorForAssignment("");
    } else {
      toast({
        title: "Patient not found",
        description: "The requested patient does not exist.",
        variant: "destructive"
      });
    }
  };

  const handleAddDoctor = async () => {
    try {
      if (!formData.name || !formData.email) {
        toast({
          title: "Missing information",
          description: "Name and email are required.",
          variant: "destructive"
        });
        return;
      }

      if (formData.email.toLowerCase() === "admin@gmail.com") {
        toast({
          title: "Reserved email",
          description: "This email is reserved for the administrator.",
          variant: "destructive"
        });
        return;
      }

      const passwordToUse = formData.password.trim() || "doctor123";

      if (!isEditing) {
        const emailExists = doctors.some(
          d => d.email.toLowerCase() === formData.email.toLowerCase()
        );
        if (emailExists) {
          toast({
            title: "Email already used",
            description: "A doctor with this email already exists.",
            variant: "destructive"
          });
          return;
        }
      }

      let finalLocation = formData.location;
      if (formData.location === "Other" && formData.customLocation.trim()) {
        finalLocation = formData.customLocation;
      } else if (formData.location === "Select a country") {
        finalLocation = "";
      }

      let finalSpecialization = formData.specialization;
      if (formData.specialization === "Other" && formData.customSpecialization.trim()) {
        finalSpecialization = formData.customSpecialization;
      } else if (formData.specialization === "Select a specialization") {
        finalSpecialization = "";
      }

      const doctorData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: finalLocation,
        customLocation: formData.location === "Other" ? formData.customLocation : finalLocation,
        specialization: finalSpecialization,
        customSpecialization: formData.specialization === "Other" ? formData.customSpecialization : finalSpecialization,
        licenseNumber: formData.licenseNumber,
        yearsExperience: formData.yearsExperience,
        department: formData.department,
        education: formData.education,
        availability: formData.availability,
        bio: formData.bio
      };

      if (!isEditing || (formData.password && formData.password.trim())) {
        doctorData.password = passwordToUse;
      }

      if (isEditing && formData.id) {
        await updateDoctor(formData.id, doctorData);

        toast({
          title: "Doctor updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        await addDoctor({
          ...doctorData,
          password: passwordToUse
        });

        toast({
          title: "Doctor added",
          description: `${formData.name} has been added successfully.`,
        });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error in handleAddDoctor:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during the operation.",
        variant: "destructive"
      });
    }
  };

  const handleEditDoctor = (doctor) => {
    setIsEditing(true);
    setFormData({
      id: doctor.id,
      name: doctor.name || "",
      email: doctor.email || "",
      phone: doctor.phone || "",
      location: doctor.location || "",
      customLocation: "",
      password: "",
      specialization: doctor.specialization || "",
      customSpecialization: "",
      licenseNumber: doctor.licenseNumber || "",
      yearsExperience: doctor.yearsExperience || "",
      department: doctor.department || "",
      education: doctor.education || "",
      availability: doctor.availability || "",
      bio: doctor.bio || ""
    });
    setDialogOpen(true);
  };

  const handleViewDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setViewDialogOpen(true);
  };

  const handleViewDoctorPatients = (doctor) => {
    const doctorPatients = getDoctorPatients(doctor.email);
    setSelectedDoctorPatients(doctorPatients);
    setSelectedDoctorForPatients(doctor);
    setDoctorPatientsDialogOpen(true);
  };

  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (doctorId === 999 || doctorName === "Administrator") {
      alert("Cannot delete the main administrator");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${doctorName}? This action will deactivate the account.`)) {
      try {
        await deleteDoctor(doctorId);

        toast({
          title: "Doctor deactivated",
          description: `${doctorName} has been deactivated successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Unable to delete the doctor.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeletePatient = (patientId, patientName) => {
    if (window.confirm(`Are you sure you want to delete patient "${patientName}"? This action is irreversible.`)) {
      deletePatient(patientId);
      toast({
        title: "Patient deleted",
        description: `Patient "${patientName}" has been deleted.`,
      });

      if (selectedDoctorForPatients) {
        const updatedPatients = getDoctorPatients(selectedDoctorForPatients.email);
        setSelectedDoctorPatients(updatedPatients);
      }
    }
  };

  const handleAssignDoctor = async () => {
    if (!selectedPatient || !selectedDoctorForAssignment) {
      toast({
        title: "Error",
        description: "Please select a doctor to assign.",
        variant: "destructive"
      });
      return;
    }

    try {
      await adminService.updatePatient(selectedPatient.id, {
        treating_neurologist: selectedDoctorForAssignment
      });

      toast({
        title: "Doctor assigned",
        description: `Doctor successfully assigned to ${selectedPatient.name}.`,
      });

      // Reload patients to reflect the change
      await loadPatients();

      // Update selected patient
      const updatedPatient = patients.find(p => p.id === selectedPatient.id);
      if (updatedPatient) {
        setSelectedPatient(updatedPatient);
      }

      setIsAssigningDoctor(false);
      setSelectedDoctorForAssignment("");
    } catch (error) {
      console.error('Error assigning doctor:', error);
      toast({
        title: "Error",
        description: "Unable to assign doctor to patient.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      email: "",
      phone: "",
      location: "",
      customLocation: "",
      password: "",
      specialization: "",
      customSpecialization: "",
      licenseNumber: "",
      yearsExperience: "",
      department: "",
      education: "",
      availability: "",
      bio: ""
    });
    setIsEditing(false);
  };

  const showCustomLocation = formData.location === "Other";
  const showCustomSpecialization = formData.specialization === "Other";

  const stats = {
    totalDoctors: doctors.length,
    totalPatients: patientsStats.totalPatients,
    criticalPatients: patientsStats.criticalPatients,
    highRiskPatients: patientsStats.highRiskPatients,
    doctorsWithPatients: doctors.filter(d => getDoctorPatients(d.email).length > 0).length,
    averagePatientsPerDoctor: doctors.length > 0 
      ? (patientsStats.totalPatients / doctors.length).toFixed(1)
      : "0",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Complete management of doctors and patients
          </p>
        </div>
        
        <div className="flex items-center gap-4">
        
          
          {/* Clickable avatar for logout */}
          <button 
            onClick={handleLogout}
            className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center text-white font-semibold shadow-lg hover:opacity-90 transition-opacity cursor-pointer group relative"
            title="Logout"
          >
            A
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Log out
            </span>
          </button>
        </div>
      </div>

      {/* Simplified statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Doctors</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalDoctors}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.doctorsWithPatients} with patients
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-md">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalPatients}</p>
                <div className="flex items-center gap-2 mt-2">
                  <User className="h-4 w-4 text-green-500 dark:text-green-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.averagePatientsPerDoctor} per doctor
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-md">
                <User className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">At-risk Patients</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.criticalPatients + stats.highRiskPatients}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Activity className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.criticalPatients} critical, {stats.highRiskPatients} high
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-md">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctors/Patients Tabs */}
      <Card className="border-none shadow-lg dark:bg-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl dark:text-white">System Management</CardTitle>
              <CardDescription className="dark:text-gray-400">Manage doctors and patients on your platform</CardDescription>
            </div>
            
            {activeTab === "doctors" && (
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
                    <Plus className="h-4 w-4" />
                    Add a Doctor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-xl dark:text-white">{isEditing ? "Edit Doctor" : "Add New Doctor"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Basic information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="dark:text-gray-300">Full Name *</Label>
                        <Input 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Dr. First Name Last Name"
                          className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="dark:text-gray-300">Email *</Label>
                        <Input 
                          type="email" 
                          value={formData.email} 
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="doctor@example.com"
                          className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="dark:text-gray-300">Password {!isEditing && "(Optional)"}</Label>
                        <Input 
                          type="text" 
                          value={formData.password} 
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder={isEditing ? "Leave empty to keep current" : "Leave empty for 'doctor123'"}
                          className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                          {isEditing ? "Leave empty to keep current password" : "Default: doctor123"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="dark:text-gray-300">Phone</Label>
                        <Input 
                          value={formData.phone} 
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="+216 XX XXX XXX"
                          className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 dark:text-gray-300">
                        <MapPin className="h-4 w-4" />
                        Location
                      </Label>
                      <Select 
                        value={formData.location} 
                        onValueChange={(v) => setFormData({...formData, location: v})}
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          {countries.map(country => (
                            <SelectItem key={country} value={country} className="dark:text-gray-300 dark:hover:bg-gray-700">{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {showCustomLocation && (
                        <div className="mt-2 space-y-2">
                          <Label className="dark:text-gray-300">Specify location</Label>
                          <Input 
                            value={formData.customLocation} 
                            onChange={(e) => setFormData({...formData, customLocation: e.target.value})}
                            placeholder="Enter custom location"
                            className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Specialization */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 dark:text-gray-300">
                        <BriefcaseMedical className="h-4 w-4" />
                        Specialization
                      </Label>
                      <Select 
                        value={formData.specialization} 
                        onValueChange={(v) => setFormData({...formData, specialization: v})}
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                          <SelectValue placeholder="Select a specialization" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          {specializations.map(spec => (
                            <SelectItem key={spec} value={spec} className="dark:text-gray-300 dark:hover:bg-gray-700">{spec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {showCustomSpecialization && (
                        <div className="mt-2 space-y-2">
                          <Label className="dark:text-gray-300">Specify specialization</Label>
                          <Input 
                            value={formData.customSpecialization} 
                            onChange={(e) => setFormData({...formData, customSpecialization: e.target.value})}
                            placeholder="Enter custom medical specialization"
                            className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Professional information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="dark:text-gray-300">License Number</Label>
                        <Input 
                          value={formData.licenseNumber} 
                          onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                          placeholder="MED-XXXX-XXXX"
                          className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="dark:text-gray-300">Years of Experience</Label>
                        <Input 
                          type="number"
                          value={formData.yearsExperience} 
                          onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                          placeholder="ex: 10"
                          className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="dark:text-gray-300">Department</Label>
                      <Input 
                        value={formData.department} 
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        placeholder="ex: Neurology Department"
                        className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 dark:text-gray-300">
                        <GraduationCap className="h-4 w-4" />
                        Education
                      </Label>
                      <Textarea 
                        value={formData.education} 
                        onChange={(e) => setFormData({...formData, education: e.target.value})}
                        placeholder="MD in Medicine\nSpecialization in Neurology..."
                        rows={3}
                        className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 dark:text-gray-300">
                        <Clock className="h-4 w-4" />
                        Availability
                      </Label>
                      <Textarea 
                        value={formData.availability} 
                        onChange={(e) => setFormData({...formData, availability: e.target.value})}
                        placeholder="Monday-Friday: 8am-5pm\nEmergencies: Weekends"
                        rows={3}
                        className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 dark:text-gray-300">
                        <FileText className="h-4 w-4" />
                        Bio / Description
                      </Label>
                      <Textarea 
                        value={formData.bio} 
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        placeholder="Professional background, achievements, research interests..."
                        rows={4}
                        className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Note:</strong> {isEditing 
                          ? "Leave the password field empty to keep the current password."
                          : "The doctor will use the provided email and password to log in. If no password is specified, 'doctor123' will be used by default."
                        }
                      </p>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                      <Button variant="outline" onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }} className="dark:border-gray-600 dark:text-gray-300">
                        Cancel
                      </Button>
                      <Button onClick={handleAddDoctor} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                        {isEditing ? "Update" : "Add Doctor"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-gray-100 dark:bg-gray-700 p-1">
              <TabsTrigger value="doctors" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">
                <Users className="h-4 w-4 mr-2" />
                Doctors ({doctors.length})
              </TabsTrigger>
              <TabsTrigger value="patients" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400">
                <User className="h-4 w-4 mr-2" />
                Patients ({allPatientsList.length})
              </TabsTrigger>
            </TabsList>

            {/* Doctors Tab */}
            <TabsContent value="doctors" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="Search doctors..."
                      value={doctorSearchQuery}
                      onChange={(e) => setDoctorSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-[350px] bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                  <Button variant="outline" size="icon" className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{filteredDoctors.length}</span> doctor{filteredDoctors.length !== 1 ? 's' : ''} found
                </div>
              </div>

              {/* Doctors Table */}
              <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700">
                <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Doctors List</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Complete management of doctor accounts
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-700">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold dark:text-gray-300">Doctor</TableHead>
                        <TableHead className="font-semibold dark:text-gray-300">Contact</TableHead>
                        <TableHead className="font-semibold dark:text-gray-300">Specialization</TableHead>
                        <TableHead className="font-semibold dark:text-gray-300">Location</TableHead>
                        <TableHead className="font-semibold dark:text-gray-300">Patients</TableHead>
                        <TableHead className="font-semibold text-right dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDoctors.length > 0 ? (
                        filteredDoctors.map((doctor) => {
                          const doctorPatients = getDoctorPatients(doctor.email);
                          const doctorStats = getDoctorStats(doctor.email);
                          
                          return (
                            <TableRow key={doctor.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 dark:border-gray-700">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center shadow-sm">
                                    <span className="text-blue-700 dark:text-blue-400 font-bold">
                                      {doctor.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{doctor.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {doctor.yearsExperience && (
                                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                          {doctor.yearsExperience} years
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{doctor.email}</span>
                                  </div>
                                  {doctor.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">{doctor.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                  {doctor.specialization || "Not specified"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {doctor.location ? (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{doctor.location}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400 dark:text-gray-500">Not specified</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{doctorStats.totalPatients}</span>
                                  </div>
                                  {doctorStats.criticalPatients > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-red-600 dark:text-red-400">Critical</span>
                                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">{doctorStats.criticalPatients}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                    onClick={() => handleViewDoctor(doctor)}
                                    title="View details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                                    onClick={() => handleViewDoctorPatients(doctor)}
                                    title="View patients"
                                  >
                                    <Users className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                    onClick={() => handleEditDoctor(doctor)}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}
                                    title="Delete"
                                    disabled={doctor.email === "admin@gmail.com"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center gap-4">
                              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                <Users className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                              </div>
                              <div className="text-center">
                                <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                                  {doctorSearchQuery ? "No doctors found" : "No doctors registered"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {doctorSearchQuery ? "Try another search" : "Start by adding your first doctor"}
                                </p>
                              </div>
                              {!doctorSearchQuery && (
                                <Button 
                                  onClick={() => setDialogOpen(true)} 
                                  className="mt-2 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
                                >
                                  <Plus className="h-4 w-4" />
                                  Add a doctor
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* Patients Tab */}
            <TabsContent value="patients" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-700 dark:to-green-900/20 rounded-xl">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="Search patients..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-[300px] bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                  
                  <select 
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:text-white transition-all"
                    value={patientStatusFilter}
                    onChange={(e) => setPatientStatusFilter(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="stable">Stable</option>
                    <option value="low">Low</option>
                  </select>
                  
                  <select 
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:text-white transition-all"
                    value={patientDoctorFilter}
                    onChange={(e) => setPatientDoctorFilter(e.target.value)}
                  >
                    <option value="all">All doctors</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.email}>
                        Dr. {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-white">{filteredPatients.length}</span> patient{filteredPatients.length !== 1 ? 's' : ''} of {allPatientsList.length}
                  </div>
                  <select 
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"
                    value={patientSortBy}
                    onChange={(e) => setPatientSortBy(e.target.value)}
                  >
                    <option value="recent">Most recent</option>
                    <option value="name">Name</option>
                    <option value="risk">Risk level</option>
                    <option value="status">Health status</option>
                  </select>
                </div>
              </div>

              {/* Patients Table */}
              <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700">
                <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">All System Patients</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Patients from all doctors combined
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-700">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold dark:text-gray-300">Patient</TableHead>
                        <TableHead className="font-semibold dark:text-gray-300">Age</TableHead>
                        <TableHead className="font-semibold dark:text-gray-300">Doctor</TableHead>
                        <TableHead className="font-semibold dark:text-gray-300">Risk</TableHead>
                        <TableHead className="font-semibold dark:text-gray-300">Heart rate</TableHead>
                        <TableHead className="font-semibold dark:text-gray-300">Status</TableHead>
                        <TableHead className="font-semibold dark:text-gray-300">Last visit</TableHead>
                        <TableHead className="font-semibold text-right dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => {
                          const doctor = doctors.find(d => d.email?.toLowerCase() === patient.treatingNeurologist?.toLowerCase());
                          return (
                            <TableRow key={patient.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 group dark:border-gray-700">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center shadow-sm">
                                    <span className="text-green-700 dark:text-green-400 font-bold">
                                      {patient.name.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{patient.name}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium dark:text-gray-300">{patient.age} years</div>
                              </TableCell>
                              <TableCell>
                                {doctor ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                                        {doctor.name.split(' ').map(n => n[0]).join('')}
                                      </span>
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{doctor.name}</span>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                    Not assigned
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span className="font-bold text-gray-900 dark:text-white">{patient.riskScore}/100</span>
                                  <Progress value={patient.riskScore} className="h-2 w-20 dark:bg-gray-700" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Heart className="h-4 w-4 text-red-500 dark:text-red-400" />
                                  <span className="font-medium dark:text-gray-300">{patient.heartRate} bpm</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={getHealthStatusColor(patient.healthStatus)}
                                  className={`px-3 py-1 ${
                                    patient.healthStatus?.toLowerCase() === 'critical' 
                                      ? 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                      : patient.healthStatus?.toLowerCase() === 'high'
                                      ? 'bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                                      : patient.healthStatus?.toLowerCase() === 'stable'
                                      ? 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                                      : ''
                                  }`}
                                >
                                  {getHealthStatusText(patient.healthStatus)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-700 dark:text-gray-300">{patient.lastVisit}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                    onClick={() => handleViewPatient(patient.id)}
                                    title="View details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    onClick={() => handleDeletePatient(patient.id, patient.name)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center gap-4">
                              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                <User className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                              </div>
                              <div className="text-center">
                                <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                                  No patients found
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {patientSearchQuery || patientStatusFilter !== "all" || patientDoctorFilter !== "all" 
                                    ? "Try adjusting your search criteria"
                                    : "No patients have been added by doctors"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Patient statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <Card className="border-none shadow-sm dark:bg-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total patients</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{patientsStats.totalPatients}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">All doctors combined</p>
                      </div>
                      <User className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-none shadow-sm dark:bg-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">At-risk patients</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{patientsStats.criticalPatients + patientsStats.highRiskPatients}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Critical: {patientsStats.criticalPatients}, High: {patientsStats.highRiskPatients}</p>
                      </div>
                      <Activity className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-none shadow-sm dark:bg-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Average per doctor</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.averagePatientsPerDoctor}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Fair distribution</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog to view patient information */}
      <Dialog open={patientViewDialogOpen} onOpenChange={setPatientViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          {selectedPatient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center shadow-md">
                    <span className="text-green-700 dark:text-green-400 font-bold text-lg">
                      {selectedPatient.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPatient.name}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Patient #{String(selectedPatient.id).padStart(6, '0')}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Main Information section */}
                <Card className="border-none shadow-sm dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full name</Label>
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                          <span className="font-medium dark:text-white">{selectedPatient.name}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Age</Label>
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="font-medium dark:text-white">{selectedPatient.age} years</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</Label>
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="dark:text-gray-300">{selectedPatient.email || "Not provided"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</Label>
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="dark:text-gray-300">{selectedPatient.phone || "Not provided"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</Label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md min-h-[100px]">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {selectedPatient.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Health section */}
                <Card className="border-none shadow-sm dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                      <Activity className="h-5 w-5 text-red-600 dark:text-red-400" />
                      Health Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Score</Label>
                        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{selectedPatient.riskScore}/100</p>
                            <Progress value={selectedPatient.riskScore} className="h-2 mt-2 dark:bg-gray-700" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Overall risk level</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Health Status</Label>
                        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg">
                          <Badge 
                            variant={getHealthStatusColor(selectedPatient.healthStatus)}
                            className={`text-lg px-4 py-2 ${
                              selectedPatient.healthStatus?.toLowerCase() === 'critical' 
                                ? 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                : selectedPatient.healthStatus?.toLowerCase() === 'high'
                                ? 'bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                                : selectedPatient.healthStatus?.toLowerCase() === 'stable'
                                ? 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                                : ''
                            }`}
                          >
                            {getHealthStatusText(selectedPatient.healthStatus)}
                          </Badge>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Last updated: {selectedPatient.lastVisit}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Heart Rate</Label>
                        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                              <p className="text-3xl font-bold text-red-700 dark:text-red-300">{selectedPatient.heartRate}</p>
                            </div>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">beats per minute</p>
                            <p className="text-xs text-red-500 dark:text-red-400 mt-2">Last measurement</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned doctor section */}
                <Card className="border-none shadow-sm dark:bg-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                      <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Assigned Doctor
                    </CardTitle>
                    {!isAssigningDoctor && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAssigningDoctor(true);
                          setSelectedDoctorForAssignment(selectedPatient.treatingNeurologist || "");
                        }}
                        className="dark:border-gray-600 dark:text-gray-300"
                      >
                        {selectedPatient.treatingNeurologist ? "Change Doctor" : "Assign Doctor"}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isAssigningDoctor ? (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Doctor</Label>
                          <select
                            className="w-full bg-card border border-input rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={selectedDoctorForAssignment}
                            onChange={(e) => setSelectedDoctorForAssignment(e.target.value)}
                          >
                            <option value="">-- Select a doctor --</option>
                            {doctors.map(doctor => (
                              <option key={doctor.id} value={doctor.email}>
                                Dr. {doctor.name} - {doctor.specialization || "Specialist"}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAssignDoctor}
                            disabled={!selectedDoctorForAssignment}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600"
                          >
                            Assign
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsAssigningDoctor(false);
                              setSelectedDoctorForAssignment("");
                            }}
                            className="dark:border-gray-600 dark:text-gray-300"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : selectedPatient.treatingNeurologist ? (() => {
                      const doctor = doctors.find(d => d.email?.toLowerCase() === selectedPatient.treatingNeurologist?.toLowerCase());
                      return doctor ? (
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800/30 dark:to-blue-700/30 flex items-center justify-center shadow-md">
                            <span className="text-blue-700 dark:text-blue-400 font-bold text-xl">
                              {doctor.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{doctor.name}</h3>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{doctor.email}</span>
                              </div>
                              {doctor.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{doctor.phone}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                {doctor.specialization || "Specialist"}
                              </Badge>
                              {doctor.location && (
                                <Badge variant="outline" className="bg-white dark:bg-gray-700">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {doctor.location}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            Doctor with email "{selectedPatient.treatingNeurologist}" not found in the system.
                          </p>
                        </div>
                      );
                    })() : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                        <AlertCircle className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No doctor assigned to this patient yet.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Medical information section */}
                <Card className="border-none shadow-sm dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                      <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      Medical Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Epilepsy type</Label>
                          <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <BrainCircuit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              <span className="font-medium text-purple-700 dark:text-purple-300">
                                {selectedPatient.epilepsyType || "Not specified"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Seizure frequency</Label>
                          <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <ActivitySquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-blue-700 dark:text-blue-300">
                                {selectedPatient.seizureFrequency || "Not specified"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Medications</Label>
                          <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Pill className="h-5 w-5 text-green-600 dark:text-green-400" />
                              <span className="font-medium text-green-700 dark:text-green-300">
                                {selectedPatient.medications || "No medications listed"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Allergies</Label>
                          <div className="p-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                              <span className="font-medium text-red-700 dark:text-red-300">
                                {selectedPatient.allergies || "No known allergies"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* History section */}
                <Card className="border-none shadow-sm dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                      <Clock3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      History and Follow-up
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Admission date</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPatient.admissionDate || "Not specified"}</p>
                        </div>
                        <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Last consultation</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPatient.lastVisit}</p>
                        </div>
                        <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      
                      {selectedPatient.nextAppointment && (
                        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-300">Next appointment</p>
                            <p className="text-sm text-blue-700 dark:text-blue-400">{selectedPatient.nextAppointment}</p>
                          </div>
                          <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <DialogFooter className="pt-4 border-t dark:border-gray-700">
                <Button variant="outline" onClick={() => setPatientViewDialogOpen(false)} className="dark:border-gray-600 dark:text-gray-300">
                  Close
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20" 
                  onClick={() => {
                    setPatientViewDialogOpen(false);
                    handleDeletePatient(selectedPatient.id, selectedPatient.name);
                  }}>
                  Delete patient
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog to view doctor details */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          {selectedDoctor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center shadow-md">
                    <span className="text-blue-700 dark:text-blue-400 font-bold text-lg">
                      {selectedDoctor.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedDoctor.name}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedDoctor.specialization || "Specialization not specified"}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Contact section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</Label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="dark:text-gray-300">{selectedDoctor.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</Label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="dark:text-gray-300">{selectedDoctor.phone || "Not provided"}</span>
                    </div>
                  </div>
                </div>

                {/* Professional section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</Label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="dark:text-gray-300">{selectedDoctor.location || "Not specified"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Specialization</Label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <BriefcaseMedical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <Badge variant="outline" className="dark:bg-gray-600 dark:text-gray-300">{selectedDoctor.specialization || "Not specified"}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Years of Experience</Label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="dark:text-gray-300">{selectedDoctor.yearsExperience || "Not specified"}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">License Number</Label>
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <span className="dark:text-gray-300">{selectedDoctor.licenseNumber || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Department</Label>
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <span className="dark:text-gray-300">{selectedDoctor.department || "Not specified"}</span>
                    </div>
                  </div>
                </div>

                {/* Education */}
                {selectedDoctor.education && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Education
                    </Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md whitespace-pre-line dark:text-gray-300">
                      {selectedDoctor.education}
                    </div>
                  </div>
                )}

                {/* Availability */}
                {selectedDoctor.availability && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Availability
                    </Label>
                    <div className="p-3 bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-md whitespace-pre-line dark:text-blue-300">
                      {selectedDoctor.availability}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {selectedDoctor.bio && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Bio / Description
                    </Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md whitespace-pre-line dark:text-gray-300">
                      {selectedDoctor.bio}
                    </div>
                  </div>
                )}

                {/* Patients assigned */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assigned Patients - Statistics
                  </Label>
                  <div className="p-3 bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600 rounded-md">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                        <p className="text-xl font-bold dark:text-white">{getDoctorPatients(selectedDoctor.email).length}</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                        <p className="text-xs text-red-600 dark:text-red-400">Critical</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
                          {getDoctorPatients(selectedDoctor.email).filter(p => p.healthStatus?.toLowerCase() === "critical").length}
                        </p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-800">
                        <p className="text-xs text-orange-600 dark:text-orange-400">High</p>
                        <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          {getDoctorPatients(selectedDoctor.email).filter(p => p.healthStatus?.toLowerCase() === "high").length}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-600 dark:text-green-400">Stable</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          {getDoctorPatients(selectedDoctor.email).filter(p => p.healthStatus?.toLowerCase() === "stable").length}
                        </p>
                      </div>
                    </div>
                    
                    {getDoctorPatients(selectedDoctor.email).length > 0 ? (
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b dark:border-gray-600">
                              <th className="text-left py-2 dark:text-gray-300">Name</th>
                              <th className="text-left py-2 dark:text-gray-300">Age</th>
                              <th className="text-left py-2 dark:text-gray-300">Status</th>
                              <th className="text-left py-2 dark:text-gray-300">Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getDoctorPatients(selectedDoctor.email).map(patient => (
                              <tr key={patient.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-600 dark:border-gray-600">
                                <td className="py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                                        {patient.name.charAt(0)}
                                      </span>
                                    </div>
                                    <span className="font-medium dark:text-gray-300">{patient.name}</span>
                                  </div>
                                </td>
                                <td className="py-2 dark:text-gray-300">{patient.age} years</td>
                                <td className="py-2">
                                  <Badge variant={getHealthStatusColor(patient.healthStatus)} className="dark:bg-gray-600">
                                    {getHealthStatusText(patient.healthStatus)}
                                  </Badge>
                                </td>
                                <td className="py-2 font-semibold dark:text-white">{patient.riskScore}/100</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No patients assigned
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Account Status
                  </Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex items-center justify-between">
                    <div>
                      <span className="font-medium dark:text-gray-300">Active</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Can log in and manage patients</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="dark:border-gray-600 dark:text-gray-300">
                  Close
                </Button>
                <Button onClick={() => {
                  setViewDialogOpen(false);
                  handleEditDoctor(selectedDoctor);
                }} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={() => {
                  setViewDialogOpen(false);
                  handleViewDoctorPatients(selectedDoctor);
                }} className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <Users className="h-4 w-4" />
                  View all patients
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog to view all patients of a doctor */}
      <Dialog open={doctorPatientsDialogOpen} onOpenChange={setDoctorPatientsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          {selectedDoctorForPatients && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary dark:text-blue-400" />
                  <div>
                    <h2 className="text-xl font-bold dark:text-white">Patients of Dr. {selectedDoctorForPatients.name}</h2>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Total: {selectedDoctorPatients.length} patient(s) - Email: {selectedDoctorForPatients.email}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Filters and search */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500" />
                    <Input
                      placeholder="Search a patient..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                  <select 
                    className="bg-card border border-input rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={patientStatusFilter}
                    onChange={(e) => setPatientStatusFilter(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="stable">Stable</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                {/* Patients table */}
                <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                  <Table>
                    <TableHeader className="dark:bg-gray-700">
                      <TableRow>
                        <TableHead className="dark:text-gray-300">Patient</TableHead>
                        <TableHead className="dark:text-gray-300">Age</TableHead>
                        <TableHead className="dark:text-gray-300">Description</TableHead>
                        <TableHead className="dark:text-gray-300">Score</TableHead>
                        <TableHead className="dark:text-gray-300">Heart rate</TableHead>
                        <TableHead className="dark:text-gray-300">Status</TableHead>
                        <TableHead className="dark:text-gray-300">Last visit</TableHead>
                        <TableHead className="dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDoctorPatients
                        .filter(patient => {
                          const query = patientSearchQuery.toLowerCase();
                          return patient.name?.toLowerCase().includes(query) ||
                                 patient.description?.toLowerCase().includes(query);
                        })
                        .filter(patient => 
                          patientStatusFilter === "all" || 
                          patient.healthStatus?.toLowerCase() === patientStatusFilter.toLowerCase()
                        )
                        .map(patient => (
                          <TableRow key={patient.id} className="dark:border-gray-700">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-blue-900/30 flex items-center justify-center">
                                  <span className="text-primary dark:text-blue-400 text-sm font-bold">
                                    {patient.name.charAt(0)}
                                  </span>
                                </div>
                                <span className="font-medium dark:text-gray-300">{patient.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="dark:text-gray-300">{patient.age} years</TableCell>
                            <TableCell className="max-w-xs truncate dark:text-gray-300">
                              {patient.description}
                            </TableCell>
                            <TableCell>
                              <Badge variant={patient.riskScore > 80 ? "destructive" : "default"} className="dark:bg-gray-600">
                                {patient.riskScore}
                              </Badge>
                            </TableCell>
                            <TableCell className="dark:text-gray-300">{patient.heartRate} bpm</TableCell>
                            <TableCell>
                              <Badge variant={getHealthStatusColor(patient.healthStatus)} className="dark:bg-gray-600">
                                {getHealthStatusText(patient.healthStatus)}
                              </Badge>
                            </TableCell>
                            <TableCell className="dark:text-gray-300">{patient.lastVisit}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 dark:text-gray-400 dark:hover:bg-gray-700"
                                  onClick={() => handleViewPatient(patient.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                  onClick={() => handleDeletePatient(patient.id, patient.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDoctorPatientsDialogOpen(false)} className="dark:border-gray-600 dark:text-gray-300">
                  Close
                </Button>
                <Button onClick={() => {
                  setDoctorPatientsDialogOpen(false);
                  setActiveTab("patients");
                  setPatientDoctorFilter(selectedDoctorForPatients.email);
                }}>
                  View in Patients tab
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;