from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, date

class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    priority: int = Field(default=1, ge=1, le=5)
    notification_method: str = Field(default="sms")

class MedicationSchema(BaseModel):
    name: str
    dosage: str
    frequency: str
    time_of_day: Optional[List[str]] = None

class PatientBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    
    epilepsy_type: Optional[str] = None
    diagnosis_date: Optional[date] = None
    trigger_factors: List[str] = []
    medical_history: Optional[str] = None
    
    emergency_contacts: List[EmergencyContact] = []

    treating_neurologist: Optional[str] = None
    hospital: Optional[str] = None
    address: Optional[str] = None
    health_status: Optional[str] = None

class PatientCreate(PatientBase):
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('passwords do not match')
        return v

class PatientCreateByDoctor(BaseModel):
    """Schema for doctors to create patients - simplified without password confirmation"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, description="Password to be communicated to patient")
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None

    epilepsy_type: Optional[str] = None
    diagnosis_date: Optional[date] = None
    trigger_factors: List[str] = []
    medical_history: Optional[str] = None

    treating_neurologist: Optional[str] = None
    hospital: Optional[str] = None
    address: Optional[str] = None

class PatientUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    epilepsy_type: Optional[str] = None
    diagnosis_date: Optional[date] = None
    trigger_factors: Optional[List[str]] = None
    medical_history: Optional[str] = None
    emergency_contacts: Optional[List[EmergencyContact]] = None
    treating_neurologist: Optional[str] = None
    hospital: Optional[str] = None
    address: Optional[str] = None
    health_status: Optional[str] = None

class PatientLogin(BaseModel):
    email: EmailStr
    password: str

class PatientInDB(PatientBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user_type: str

class TokenData(BaseModel):
    sub: Optional[str] = None
    user_type: Optional[str] = None