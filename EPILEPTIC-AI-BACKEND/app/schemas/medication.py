from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

class MedicationBase(BaseModel):
    name: str
    dosage: str
    frequency: str
    purpose: Optional[str] = None
    times_per_day: Optional[int] = Field(None, ge=1, le=10)
    specific_times: Optional[List[str]] = None
    is_active: bool = True
    status: str = "active"  # active, archived, discontinued
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None
    prescribed_by: Optional[str] = None
    prescription_date: Optional[date] = None
    instructions: Optional[str] = None
    side_effects: Optional[str] = None
    reminder_enabled: bool = True
    reminder_times: Optional[List[str]] = None

class MedicationCreate(MedicationBase):
    pass

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    is_active: Optional[bool] = None
    status: Optional[str] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None
    instructions: Optional[str] = None
    side_effects: Optional[str] = None
    reminder_enabled: Optional[bool] = None

class MedicationInDB(MedicationBase):
    id: int
    patient_id: int
    last_taken: Optional[datetime] = None
    adherence_rate: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True