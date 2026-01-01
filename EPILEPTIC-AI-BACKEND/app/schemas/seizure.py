from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SeizureBase(BaseModel):
    seizure_type: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    intensity: Optional[float] = Field(None, ge=0, le=10)
    symptoms: List[str] = []
    location: Optional[str] = None
    activity_before: Optional[str] = None
    trigger_suspected: Optional[str] = None
    stress_level_before: Optional[float] = Field(None, ge=0, le=10)
    after_effects: Optional[str] = None
    medication_taken: bool = False
    emergency_called: bool = False

class SeizureCreate(SeizureBase):
    pass

class SeizureUpdate(BaseModel):
    end_time: Optional[datetime] = None
    intensity: Optional[float] = None
    after_effects: Optional[str] = None
    medication_taken: Optional[bool] = None
    emergency_called: Optional[bool] = None
    confirmed_by_doctor: Optional[bool] = None
    doctor_notes: Optional[str] = None

class SeizureInDB(SeizureBase):
    id: int
    patient_id: int
    duration_minutes: Optional[float] = None
    recovery_time_minutes: Optional[float] = None
    contacted_emergency_contacts: bool = False
    confirmed_by_doctor: bool = False
    doctor_notes: Optional[str] = None
    reported_at: datetime
    
    class Config:
        from_attributes = True