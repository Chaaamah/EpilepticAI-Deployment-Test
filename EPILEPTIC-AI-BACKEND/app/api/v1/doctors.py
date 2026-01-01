from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.schemas.doctor import DoctorCreate, DoctorInDB, DoctorUpdate
from app.schemas.patient import PatientCreateByDoctor, PatientInDB, PatientUpdate
from app.api.deps import get_current_doctor_user, get_current_admin_or_doctor, get_current_admin

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
    # Auto-assign to current doctor's email
    doctor_email = None
    if hasattr(current_doctor, 'email'):
        doctor_email = current_doctor.email

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
        treating_neurologist=patient_data.treating_neurologist or doctor_email,
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

@router.get("/patients", response_model=List[PatientInDB], summary="Get all patients (Doctor/Admin)")
async def get_patients_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_or_doctor)
):
    """
    Get list of all patients. Accessible by doctors and admins.
    """
    patients = db.query(Patient).offset(skip).limit(limit).all()
    return patients

@router.get("/patients/{patient_id}", response_model=PatientInDB, summary="Get patient by ID (Doctor only)")
async def get_patient_by_id(
    patient_id: int,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """Get patient details by ID. Only accessible by doctors."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    return patient

@router.put("/patients/{patient_id}", response_model=PatientInDB, summary="Update patient (Doctor only)")
async def update_patient_by_doctor(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """Update patient information. Only accessible by doctors."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
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

@router.delete("/patients/{patient_id}", summary="Delete patient (Doctor only)")
async def delete_patient_by_doctor(
    patient_id: int,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """
    Delete a patient. Only accessible by doctors.
    This will remove the patient from both Patient and User tables.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
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
