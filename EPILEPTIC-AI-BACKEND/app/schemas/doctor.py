from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime, date

class DoctorBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    specialization: Optional[str] = None
    hospital: Optional[str] = None
    license_number: Optional[str] = None
    location: Optional[str] = None
    department: Optional[str] = None

class DoctorCreate(DoctorBase):
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('passwords do not match')
        return v

class DoctorUpdate(BaseModel):
    email: Optional[EmailStr] = None  # Allow email updates with validation
    full_name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    hospital: Optional[str] = None
    license_number: Optional[str] = None
    location: Optional[str] = None
    department: Optional[str] = None
    availability: Optional[str] = None
    qualifications: Optional[str] = None
    blood_group: Optional[str] = None
    gender: Optional[str] = None
    years_experience: Optional[str] = None  # Changed from int to str to support "15+ Years" format
    bio: Optional[str] = None
    education: Optional[str] = None
    certifications: Optional[str] = None
    awards: Optional[str] = None
    dob: Optional[date] = None
    clinic: Optional[str] = None
    status: Optional[str] = None

class DoctorLogin(BaseModel):
    email: EmailStr
    password: str

class DoctorInDB(DoctorBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Additional profile fields (beyond DoctorBase)
    availability: Optional[str] = None
    qualifications: Optional[str] = None
    blood_group: Optional[str] = None
    gender: Optional[str] = None
    years_experience: Optional[str] = None  # Changed from int to str to support "15+ Years" format
    bio: Optional[str] = None
    education: Optional[str] = None
    certifications: Optional[str] = None
    awards: Optional[str] = None
    dob: Optional[date] = None
    clinic: Optional[str] = None
    status: Optional[str] = None

    class Config:
        from_attributes = True