from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.models.medication import Medication
from app.schemas.doctor import DoctorCreate, DoctorInDB, DoctorUpdate
from app.schemas.patient import PatientCreateByDoctor, PatientInDB, PatientUpdate
from app.schemas.medication import MedicationCreate, MedicationUpdate, MedicationInDB
from app.api.deps import get_current_doctor_user, get_current_admin_or_doctor, get_current_admin
import json

router = APIRouter()

# ==================== PATIENT MANAGEMENT BY DOCTORS ====================

@router.post("/patients", response_model=PatientInDB, summary="Create a new patient (Doctor only)")
async def create_patient(
    patient_data: PatientCreateByDoctor,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """
    Create a new patient. Only accessible by doctors.
    The password should be communicated to the patient for mobile app login.
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == patient_data.email).first()
    existing_patient = db.query(Patient).filter(Patient.email == patient_data.email).first()

    if existing_user or existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user in User table
    user = User(
        email=patient_data.email,
        full_name=patient_data.full_name,
        phone=patient_data.phone,
        role=UserRole.PATIENT,
        hashed_password=get_password_hash(patient_data.password),
        is_active=True,
        is_verified=True,  # Auto-verified when created by doctor
        is_superuser=False
    )
    db.add(user)

    # Create patient in Patient table
    # ALWAYS assign to current doctor's email (ignore treating_neurologist from frontend)
    doctor_email = None
    if isinstance(current_doctor, Doctor):
        doctor_email = current_doctor.email
    elif hasattr(current_doctor, 'email'):
        doctor_email = current_doctor.email

    if not doctor_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not determine doctor email"
        )

    patient = Patient(
        email=patient_data.email,
        full_name=patient_data.full_name,
        phone=patient_data.phone,
        date_of_birth=patient_data.date_of_birth,
        gender=patient_data.gender,
        epilepsy_type=patient_data.epilepsy_type,
        diagnosis_date=patient_data.diagnosis_date,
        trigger_factors=patient_data.trigger_factors,
        medical_history=patient_data.medical_history,
        emergency_contacts=[],  # Empty initially, patient will add from mobile
        treating_neurologist=doctor_email,  # FORCE assignment to current doctor
        hospital=patient_data.hospital,
        hashed_password=get_password_hash(patient_data.password),
        is_active=True,
        is_verified=True
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)
    db.refresh(user)

    return patient

@router.get("/patients", response_model=List[PatientInDB], summary="Get patients (admin sees all, doctor sees only assigned)")
async def get_patients_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_or_doctor)
):
    """
    Get list of patients.
    - Admin users: see all patients
    - Doctor users: see only patients assigned to them (filtered by treating_neurologist)
    """
    # Check if user is admin
    if hasattr(current_user, 'role') and current_user.role == UserRole.ADMIN:
        # Admin sees all patients
        patients = db.query(Patient).offset(skip).limit(limit).all()
        return patients

    # For doctors: filter by treating_neurologist
    doctor_email = None
    if isinstance(current_user, Doctor):
        doctor_email = current_user.email
    elif hasattr(current_user, 'email'):
        doctor_email = current_user.email

    if not doctor_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not determine doctor email"
        )

    # Filter patients by treating_neurologist (doctor's email)
    patients = db.query(Patient).filter(
        Patient.treating_neurologist == doctor_email
    ).offset(skip).limit(limit).all()

    return patients

@router.get("/patients/{patient_id}", response_model=PatientInDB, summary="Get patient by ID (admin sees all, doctor sees only assigned)")
async def get_patient_by_id(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_or_doctor)
):
    """
    Get patient details by ID.
    - Admin users: can access any patient
    - Doctor users: can only access patients assigned to them
    """
    # If admin, allow access to any patient
    if hasattr(current_user, 'role') and current_user.role == UserRole.ADMIN:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        return patient

    # For doctors: verify patient belongs to them
    doctor_email = None
    if isinstance(current_user, Doctor):
        doctor_email = current_user.email
    elif hasattr(current_user, 'email'):
        doctor_email = current_user.email

    # Find patient and verify it belongs to this doctor
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.treating_neurologist == doctor_email
    ).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found or not assigned to you"
        )

    return patient

@router.put("/patients/{patient_id}", response_model=PatientInDB, summary="Update patient (admin or assigned doctor)")
async def update_patient_by_doctor(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_or_doctor)
):
    """
    Update patient information.
    - Admin users: can update any patient
    - Doctor users: can only update patients assigned to them
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # For doctors: verify patient belongs to them
    if not (hasattr(current_user, 'role') and current_user.role == UserRole.ADMIN):
        doctor_email = None
        if isinstance(current_user, Doctor):
            doctor_email = current_user.email
        elif hasattr(current_user, 'email'):
            doctor_email = current_user.email

        if patient.treating_neurologist != doctor_email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update patients assigned to you"
            )

    # Update patient data
    update_data = patient_data.dict(exclude_unset=True)

    if "emergency_contacts" in update_data:
        update_data["emergency_contacts"] = [ec.dict() for ec in patient_data.emergency_contacts]

    for field, value in update_data.items():
        setattr(patient, field, value)

    # Also update User table if exists
    user = db.query(User).filter(User.email == patient.email).first()
    if user and patient_data.full_name:
        user.full_name = patient_data.full_name
    if user and patient_data.phone:
        user.phone = patient_data.phone

    db.commit()
    db.refresh(patient)

    return patient

@router.delete("/patients/{patient_id}", summary="Delete patient (admin or assigned doctor)")
async def delete_patient_by_doctor(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_or_doctor)
):
    """
    Delete a patient.
    - Admin users: can delete any patient
    - Doctor users: can only delete patients assigned to them
    This will remove the patient from both Patient and User tables.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # For doctors: verify patient belongs to them
    if not (hasattr(current_user, 'role') and current_user.role == UserRole.ADMIN):
        doctor_email = None
        if isinstance(current_user, Doctor):
            doctor_email = current_user.email
        elif hasattr(current_user, 'email'):
            doctor_email = current_user.email

        if patient.treating_neurologist != doctor_email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete patients assigned to you"
            )

    # Delete from User table if exists
    user = db.query(User).filter(User.email == patient.email).first()
    if user:
        db.delete(user)

    # Delete from Patient table
    db.delete(patient)
    db.commit()

    return {"message": f"Patient {patient.full_name} deleted successfully"}

# ==================== DOCTOR MANAGEMENT ====================

@router.get("/", response_model=List[DoctorInDB])
async def get_doctors(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get list of doctors (public endpoint for patient app)"""
    doctors = db.query(Doctor).filter(Doctor.is_active == True).offset(skip).limit(limit).all()
    return doctors

@router.get("/me", response_model=DoctorInDB, summary="Get current doctor profile")
async def get_current_doctor_profile(
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """Get current doctor's profile"""
    if isinstance(current_doctor, Doctor):
        return current_doctor

    # If User object, find corresponding Doctor record
    doctor = db.query(Doctor).filter(Doctor.email == current_doctor.email).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    return doctor

@router.put("/me", response_model=DoctorInDB, summary="Update current doctor profile")
async def update_current_doctor_profile(
    doctor_data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """
    Update current doctor's own profile.
    Doctors can update their own information without admin privileges.
    """
    # Get the current doctor's record
    if isinstance(current_doctor, Doctor):
        doctor = current_doctor
    else:
        doctor = db.query(Doctor).filter(Doctor.email == current_doctor.email).first()
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor profile not found"
            )

    # Get update data excluding unset fields
    update_data = doctor_data.model_dump(exclude_unset=True)

    # Don't allow doctors to change their own email through this endpoint
    if "email" in update_data and update_data["email"] != doctor.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change email through this endpoint. Contact an administrator."
        )

    # Apply updates to doctor
    for field, value in update_data.items():
        setattr(doctor, field, value)

    # Also update User table if exists
    user = db.query(User).filter(User.email == doctor.email).first()
    if user:
        if doctor_data.full_name:
            user.full_name = doctor_data.full_name
        if doctor_data.phone:
            user.phone = doctor_data.phone

    db.commit()
    db.refresh(doctor)

    return doctor

# ============================================
# ADMIN ENDPOINTS FOR DOCTOR MANAGEMENT
# Must be BEFORE the generic /{doctor_id} route
# ============================================

@router.put("/{doctor_id}", response_model=DoctorInDB, summary="Update any doctor profile (Admin only)")
async def update_doctor_by_admin(
    doctor_id: int,
    doctor_data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Update any doctor's profile. Only accessible by admins.
    
    This allows admins to update any doctor's information including:
    - Basic info (email, name, phone, specialization)
    - Profile details (bio, education, certifications, awards)
    - Availability and qualifications
    - Location and department
    """
    # Get the doctor by ID
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Get update data excluding unset fields
    update_data = doctor_data.model_dump(exclude_unset=True)
    
    # Check if email is being changed
    if doctor_data.email and doctor_data.email != doctor.email:
        # Check if new email already exists
        existing_doctor = db.query(Doctor).filter(Doctor.email == doctor_data.email).first()
        if existing_doctor:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use by another doctor"
            )
        
        # Also check in User table
        existing_user = db.query(User).filter(User.email == doctor_data.email).first()
        if existing_user and existing_user.email != doctor.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        
        # Update email in User table if exists
        user = db.query(User).filter(User.email == doctor.email).first()
        if user:
            user.email = doctor_data.email
    
    # Apply updates to doctor
    for field, value in update_data.items():
        setattr(doctor, field, value)
    
    db.commit()
    db.refresh(doctor)
    
    return doctor


@router.delete("/{doctor_id}", summary="Delete doctor (Admin only)")
async def delete_doctor_by_admin(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Delete/deactivate a doctor. Only accessible by admins.
    
    This sets the doctor's is_active status to False instead of hard-deleting.
    """
    # Get the doctor by ID
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Deactivate instead of deleting (soft delete)
    doctor.is_active = False
    
    # Also deactivate in User table if exists
    user = db.query(User).filter(User.email == doctor.email).first()
    if user:
        user.is_active = False
    
    db.commit()
    
    return {"message": f"Doctor {doctor.full_name} has been deactivated"}

# ==================== MEDICATION MANAGEMENT BY DOCTORS ====================

@router.get("/patients/{patient_id}/medications", response_model=List[MedicationInDB], summary="Get patient medications (Doctor only)")
async def get_patient_medications(
    patient_id: int,
    status_filter: str = None,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """Get all medications for a specific patient. Only accessible by the patient's assigned doctor."""
    # Get doctor's email
    doctor_email = None
    if isinstance(current_doctor, Doctor):
        doctor_email = current_doctor.email
    elif hasattr(current_doctor, 'email'):
        doctor_email = current_doctor.email

    # Verify patient exists and belongs to this doctor
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.treating_neurologist == doctor_email
    ).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found or not assigned to you"
        )

    # Query medications
    query = db.query(Medication).filter(Medication.patient_id == patient_id)

    if status_filter:
        query = query.filter(Medication.status == status_filter)

    medications = query.order_by(Medication.name.asc()).all()
    return medications

@router.post("/patients/{patient_id}/medications", response_model=MedicationInDB, summary="Create medication for patient (Doctor only)")
async def create_patient_medication(
    patient_id: int,
    medication_data: MedicationCreate,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """Create a new medication for a patient. Only accessible by the patient's assigned doctor."""
    # Get doctor's email
    doctor_email = None
    if isinstance(current_doctor, Doctor):
        doctor_email = current_doctor.email
    elif hasattr(current_doctor, 'email'):
        doctor_email = current_doctor.email

    # Verify patient exists and belongs to this doctor
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.treating_neurologist == doctor_email
    ).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found or not assigned to you"
        )

    # Create medication
    medication = Medication(
        patient_id=patient_id,
        specific_times=json.dumps(medication_data.specific_times) if medication_data.specific_times else None,
        reminder_times=json.dumps(medication_data.reminder_times) if medication_data.reminder_times else None,
        **medication_data.dict(exclude={"specific_times", "reminder_times"})
    )

    db.add(medication)
    db.commit()
    db.refresh(medication)

    return medication

@router.put("/patients/{patient_id}/medications/{medication_id}", response_model=MedicationInDB, summary="Update patient medication (Doctor only)")
async def update_patient_medication(
    patient_id: int,
    medication_id: int,
    medication_data: MedicationUpdate,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """Update a medication for a patient. Only accessible by doctors."""
    # Verify medication exists and belongs to patient
    medication = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.patient_id == patient_id
    ).first()

    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )

    # Update medication
    update_data = medication_data.dict(exclude_unset=True)

    for field, value in update_data.items():
        if field in ["specific_times", "reminder_times"] and value is not None:
            setattr(medication, field, json.dumps(value))
        else:
            setattr(medication, field, value)

    db.commit()
    db.refresh(medication)

    return medication

@router.delete("/patients/{patient_id}/medications/{medication_id}", summary="Delete patient medication (Doctor only)")
async def delete_patient_medication(
    patient_id: int,
    medication_id: int,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """Delete a medication for a patient. Only accessible by doctors."""
    # Verify medication exists and belongs to patient
    medication = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.patient_id == patient_id
    ).first()

    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )

    db.delete(medication)
    db.commit()

    return {"message": f"Medication {medication.name} deleted successfully"}

# ==================== PUBLIC ENDPOINTS ====================

@router.get("/{doctor_id}", response_model=DoctorInDB)
async def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db)
):
    """Get doctor by ID (public endpoint for patient app)"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    return doctor
