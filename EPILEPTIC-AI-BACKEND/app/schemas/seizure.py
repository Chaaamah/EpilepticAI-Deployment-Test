from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import json

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

    @field_validator("symptoms", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v

class SeizureCreate(SeizureBase):
    pass

class SeizureUpdate(BaseModel):
    end_time: Optional[datetime] = None
    intensity: Optional[float] = None
    symptoms: Optional[List[str]] = None
    after_effects: Optional[str] = None
    medication_taken: Optional[bool] = None
    emergency_called: Optional[bool] = None
    confirmed_by_doctor: Optional[bool] = None
    doctor_notes: Optional[str] = None

    @field_validator("symptoms", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v

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