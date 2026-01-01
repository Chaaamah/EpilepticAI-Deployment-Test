from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BiometricBase(BaseModel):
    heart_rate: Optional[float] = Field(None, ge=30, le=200)
    heart_rate_variability: Optional[float] = Field(None, ge=0)
    spo2: Optional[float] = Field(None, ge=0, le=100)
    temperature: Optional[float] = None
    accelerometer_x: Optional[float] = None
    accelerometer_y: Optional[float] = None
    accelerometer_z: Optional[float] = None
    movement_intensity: Optional[float] = Field(None, ge=0, le=10)
    stress_level: Optional[float] = Field(None, ge=0, le=10)
    sleep_duration: Optional[float] = Field(None, ge=0, le=24)
    sleep_quality: Optional[float] = Field(None, ge=0, le=100)
    device_id: Optional[str] = None
    source: str = "apple_watch"

class BiometricCreate(BiometricBase):
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

class BiometricUpdate(BaseModel):
    movement_intensity: Optional[float] = None
    stress_level: Optional[float] = None
    sleep_quality: Optional[float] = None

class BiometricInDB(BiometricBase):
    id: int
    patient_id: int
    recorded_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True