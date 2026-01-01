// ==================== AUTHENTICATION ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  specialization?: string;
  hospital?: string;
  license_number?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_type: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'doctor' | 'patient';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

// ==================== PATIENT ====================

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
  emergency_contacts?: EmergencyContact[];
  treating_neurologist?: string;
  hospital?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PatientMetrics extends Patient {
  risk_score: number;
  last_seizure_date?: string;
  total_seizures: number;
  seizures_this_month: number;
  latest_heart_rate?: number;
  health_status: 'critical' | 'high-risk' | 'stable' | 'unknown';
}

export interface PatientCreateRequest {
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
}

export interface PatientUpdateRequest {
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  epilepsy_type?: string;
  diagnosis_date?: string;
  trigger_factors?: string[];
  medical_history?: string;
  emergency_contacts?: EmergencyContact[];
  treating_neurologist?: string;
  hospital?: string;
  health_status?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  priority?: number;
  notification_method?: string;
}

// ==================== MEDICATION ====================

export interface Medication {
  id: number;
  patient_id: number;
  name: string;
  dosage: string;
  frequency: string;
  purpose?: string;
  times_per_day?: number;
  specific_times?: string[];
  is_active: boolean;
  status: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  prescribed_by?: string;
  prescription_date?: string;
  instructions?: string;
  side_effects?: string;
  reminder_enabled: boolean;
  reminder_times?: string[];
  last_taken?: string;
  adherence_rate?: number;
  created_at: string;
  updated_at?: string;
}

export interface MedicationCreateRequest {
  name: string;
  dosage: string;
  frequency: string;
  purpose?: string;
  times_per_day?: number;
  specific_times?: string[];
  is_active?: boolean;
  status?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  prescribed_by?: string;
  prescription_date?: string;
  instructions?: string;
  side_effects?: string;
  reminder_enabled?: boolean;
  reminder_times?: string[];
}

// ==================== DASHBOARD ====================

export interface DashboardStats {
  total_patients: number;
  recent_seizures_this_week: number;
  recent_seizures_this_month: number;
  critical_patients: number;
  high_risk_patients: number;
  active_alerts: number;
}

export interface SeizureDataPoint {
  date: string;
  count: number;
}

export interface SeizureStatistics {
  daily_counts: SeizureDataPoint[];
  weekly_counts: SeizureDataPoint[];
  monthly_counts: SeizureDataPoint[];
  total_count: number;
  average_per_week: number;
}

// ==================== SEIZURES ====================

export interface Seizure {
  id: number;
  patient_id: number;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  seizure_type?: string;
  intensity?: number;
  symptoms?: string[];
  location?: string;
  activity_before?: string;
  trigger_suspected?: string;
  stress_level_before?: number;
  after_effects?: string;
  recovery_time_minutes?: number;
  medication_taken?: boolean;
  emergency_called?: boolean;
  contacted_emergency_contacts?: boolean;
  confirmed_by_doctor?: boolean;
  doctor_notes?: string;
  reported_at: string;
}

export interface SeizureHistoryItem {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  seizure_type?: string;
  intensity?: number;
  location?: string;
  confirmed_by_doctor: boolean;
  doctor_notes?: string;
  reported_at: string;
}

export interface SeizureCreateRequest {
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  seizure_type?: string;
  intensity?: number;
  symptoms?: string[];
  location?: string;
  activity_before?: string;
  trigger_suspected?: string;
}

// ==================== ALERTS ====================

export interface Alert {
  id: number;
  patient_id: number;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  risk_score?: number;
  confidence?: number;
  is_active: boolean;
  acknowledged: boolean;
  resolved: boolean;
  requires_user_confirmation?: boolean;
  user_confirmed?: boolean;
  confirmation_deadline?: string;
  emergency_notified?: boolean;
  emergency_notified_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  created_at: string;
  triggered_at?: string;
  expires_at?: string;
}

// ==================== CLINICAL NOTES ====================

export interface ClinicalNote {
  id: number;
  patient_id: number;
  note_type: 'consultation' | 'observation' | 'follow-up' | 'annotation';
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface ClinicalNoteCreateRequest {
  patient_id: number;
  note_type: 'consultation' | 'observation' | 'follow-up' | 'annotation';
  title: string;
  content: string;
}

export interface ClinicalNoteUpdateRequest {
  title?: string;
  content?: string;
  note_type?: 'consultation' | 'observation' | 'follow-up' | 'annotation';
}

// ==================== DOCTOR ====================

export interface Doctor {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  specialization?: string;
  hospital?: string;
  license_number?: string;
  notification_preferences?: Record<string, any>;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

// ==================== BIOMETRICS ====================

export interface Biometric {
  id: number;
  patient_id: number;
  heart_rate?: number;
  heart_rate_variability?: number;
  accelerometer_x?: number;
  accelerometer_y?: number;
  accelerometer_z?: number;
  movement_intensity?: number;
  stress_level?: number;
  sleep_duration?: number;
  sleep_quality?: number;
  device_id?: string;
  source: string;
  recorded_at: string;
  created_at: string;
}
