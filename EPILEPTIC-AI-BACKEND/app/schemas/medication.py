from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import json

class MedicationBase(BaseModel):
    name: str
    dosage: str
    frequency: str
    purpose: Optional[str] = None
    times_per_day: Optional[int] = Field(None, ge=1, le=10)
    specific_times: Optional[List[str]] = None
    is_active: bool = True
    status: str = "active"  # active, archived, discontinued
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    notes: Optional[str] = None
    prescribed_by: Optional[str] = None
    prescription_date: Optional[datetime] = None
    instructions: Optional[str] = None
    side_effects: Optional[str] = None
    reminder_enabled: bool = True
    reminder_times: Optional[List[str]] = None

    @field_validator("specific_times", "reminder_times", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v

class MedicationCreate(MedicationBase):
    pass

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    is_active: Optional[bool] = None
    status: Optional[str] = None
    end_date: Optional[datetime] = None
    notes: Optional[str] = None
    instructions: Optional[str] = None
    side_effects: Optional[str] = None
    reminder_enabled: Optional[bool] = None
    specific_times: Optional[List[str]] = None
    reminder_times: Optional[List[str]] = None

    @field_validator("specific_times", "reminder_times", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v

class MedicationInDB(MedicationBase):
    id: int
    patient_id: int
    last_taken: Optional[datetime] = None
    adherence_rate: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MedicationLogBase(BaseModel):
    taken_at: datetime
    status: str = "taken"  # taken, missed, skipped
    notes: Optional[str] = None


class MedicationLogCreate(BaseModel):
    status: Optional[str] = "taken"
    taken_at: Optional[datetime] = None
    notes: Optional[str] = None


class MedicationLogInDB(MedicationLogBase):
    id: int
    medication_id: int
    patient_id: int
    created_at: datetime

    class Config:
        from_attributes = True