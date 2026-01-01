from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class AlertBase(BaseModel):
    alert_type: str = Field(..., pattern="^(prediction|fall|medication|emergency|system)$")
    severity: str = Field(..., pattern="^(low|medium|high|critical)$")
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    acknowledged: Optional[bool] = None
    resolved: Optional[bool] = None
    resolution_notes: Optional[str] = None

class AlertInDB(AlertBase):
    id: int
    patient_id: int
    is_active: bool = True
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    notifications_sent: List[Dict[str, Any]] = []
    resolved: bool = False
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    triggered_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True