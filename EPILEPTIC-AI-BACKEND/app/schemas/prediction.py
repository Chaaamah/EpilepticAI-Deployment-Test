from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
import json

class PredictionBase(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=1.0)
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    prediction_window: int = Field(default=30, gt=0)
    features_used: Optional[Dict[str, Any]] = None

    @field_validator("features_used", mode="before")
    @classmethod
    def parse_json_dict(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return {}
        return v

class PredictionCreate(PredictionBase):
    patient_id: int

class PredictionResult(PredictionBase):
    """Result of a seizure prediction"""
    id: int
    patient_id: int
    predicted_at: datetime
    predicted_for: Optional[datetime] = None
    model_version: Optional[str] = None
    alert_generated: bool = False
    alert_id: Optional[int] = None
    seizure_occurred: Optional[bool] = None
    accuracy_feedback: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class PredictionInDB(PredictionResult):
    pass
