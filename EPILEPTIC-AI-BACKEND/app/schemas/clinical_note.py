from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ClinicalNoteBase(BaseModel):
    note_type: str = Field(..., description="Type: consultation, observation, follow-up, annotation")
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)

class ClinicalNoteCreate(ClinicalNoteBase):
    patient_id: int

class ClinicalNoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    note_type: Optional[str] = None

class ClinicalNoteInDB(ClinicalNoteBase):
    id: int
    patient_id: int
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
