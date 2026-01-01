from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, verify_password, get_password_hash, get_current_user
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.user import User, UserRole
from app.schemas.patient import PatientCreate, PatientInDB, Token, PatientLogin
from app.schemas.doctor import DoctorCreate, DoctorInDB, DoctorLogin

router = APIRouter()


# Schema for unified login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Note: Patient registration is now handled by doctors only.
# See /api/v1/doctors/patients endpoint for patient creation.

@router.post("/register/doctor", response_model=DoctorInDB)
async def register_doctor(
    doctor_data: DoctorCreate,
    db: Session = Depends(get_db)
):
    """Register a new doctor"""
    # Check if email already exists in User table
    existing_user = db.query(User).filter(User.email == doctor_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if email already exists in Doctor table (legacy)
    existing_doctor = db.query(Doctor).filter(
        Doctor.email == doctor_data.email
    ).first()

    if existing_doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user in User table
    user = User(
        email=doctor_data.email,
        full_name=doctor_data.full_name,
        phone=doctor_data.phone,
        role=UserRole.DOCTOR,
        hashed_password=get_password_hash(doctor_data.password),
        is_active=True,
        is_verified=False,
        is_superuser=False
    )
    db.add(user)

    # Create doctor in Doctor table
    doctor = Doctor(
        email=doctor_data.email,
        full_name=doctor_data.full_name,
        phone=doctor_data.phone,
        specialization=doctor_data.specialization,
        hospital=doctor_data.hospital,
        license_number=doctor_data.license_number,
        hashed_password=get_password_hash(doctor_data.password),
        is_active=True
    )

    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    db.refresh(user)

    return doctor

# Admin registration schema
class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str
    full_name: str
    phone: str = ""

@router.post("/register/admin", response_model=dict)
async def register_admin(
    admin_data: AdminCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new admin user.
    Only creates entry in User table with admin role.
    """
    # Verify passwords match
    if admin_data.password != admin_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )

    # Check if email already exists in User table
    existing_user = db.query(User).filter(User.email == admin_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create admin user in User table only
    user = User(
        email=admin_data.email,
        full_name=admin_data.full_name,
        phone=admin_data.phone,
        role=UserRole.ADMIN,
        hashed_password=get_password_hash(admin_data.password),
        is_active=True,
        is_verified=True,  # Auto-verify admin accounts
        is_superuser=True  # Admins are superusers
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

@router.post("/login/patient", response_model=Token)
async def login_patient(
    form_data: PatientLogin,
    db: Session = Depends(get_db)
):
    """Login for patients"""
    patient = db.query(Patient).filter(
        Patient.email == form_data.email
    ).first()
    
    if not patient or not verify_password(form_data.password, patient.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not patient.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive account"
        )
    
    access_token = create_access_token(
        subject=patient.email,
        user_type="patient"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "patient"
    }

@router.post("/login/doctor", response_model=Token)
async def login_doctor(
    form_data: DoctorLogin,
    db: Session = Depends(get_db)
):
    """Login for doctors"""
    doctor = db.query(Doctor).filter(
        Doctor.email == form_data.email
    ).first()
    
    if not doctor or not verify_password(form_data.password, doctor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive account"
        )
    
    access_token = create_access_token(
        subject=doctor.email,
        user_type="doctor"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "doctor"
    }

@router.post("/login", response_model=Token)
async def login_user(
    form_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Unified login endpoint for all user types (admin, patient, doctor).
    Uses the User table for authentication.
    """
    user = db.query(User).filter(User.email == form_data.email).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive account"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(
        subject=user.email,
        user_type=user.role.value
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": user.role.value
    }


@router.post("/refresh-token", response_model=Token)
async def refresh_access_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    Mobile apps can use this to get a new access token without re-login.
    """
    from app.core.security import verify_token

    # Verify refresh token
    email = verify_token(refresh_token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive account"
        )

    # Create new access token
    access_token = create_access_token(
        subject=user.email,
        user_type=user.role.value
    )

    # Optionally create new refresh token (for rotation)
    new_refresh_token = create_access_token(
        subject=user.email,
        user_type=user.role.value,
        expires_delta=timedelta(days=30)
    )

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user_type": user.role.value
    }


@router.post("/logout")
async def logout(current_user = Depends(get_current_user)):
    """
    Logout endpoint for mobile apps.
    Since we use stateless JWT, this is mainly for client-side token cleanup.
    Future: Could implement token blacklisting here.
    """
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=DoctorInDB)
async def read_users_me(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user info - returns complete doctor profile with all fields"""
    # If user is from Doctor table, fetch fresh data to ensure all fields are included
    if isinstance(current_user, Doctor):
        doctor = db.query(Doctor).filter(Doctor.id == current_user.id).first()
        return doctor

    # If user is from User table but is a doctor, fetch from Doctor table
    if isinstance(current_user, User) and current_user.role.value == "doctor":
        doctor = db.query(Doctor).filter(Doctor.email == current_user.email).first()
        if doctor:
            return doctor

    # Fallback to current_user (for non-doctor users or if doctor not found)
    return current_user