from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

class DashboardStats(BaseModel):
    """Dashboard statistics for doctors"""
    total_patients: int
    recent_seizures_this_week: int
    recent_seizures_this_month: int
    critical_patients: int
    high_risk_patients: int
    active_alerts: int

    class Config:
        from_attributes = True

class SeizureDataPoint(BaseModel):
    """Data point for seizure temporal chart"""
    date: date
    count: int

class SeizureStatistics(BaseModel):
    """Seizure statistics over time"""
    daily_counts: List[SeizureDataPoint]
    weekly_counts: List[SeizureDataPoint]
    monthly_counts: List[SeizureDataPoint]
    total_count: int
    average_per_week: float

    class Config:
        from_attributes = True

class PatientMetrics(BaseModel):
    """Extended patient info with calculated metrics"""
    id: int
    email: Optional[str] = None  # Make optional in case null
    full_name: str
    phone: Optional[str] = None
    epilepsy_type: Optional[str] = None

    # Calculated metrics
    risk_score: float = 0.0
    last_seizure_date: Optional[datetime] = None
    total_seizures: int = 0
    seizures_this_month: int = 0
    latest_heart_rate: Optional[float] = None
    health_status: str = "unknown"  # "critical", "high-risk", "stable", "unknown"

    created_at: Optional[datetime] = None  # Make optional in case null

    class Config:
        from_attributes = True

class SeizureHistoryItem(BaseModel):
    """Seizure event for history page"""
    id: int
    patient_id: int
    patient_name: str
    patient_email: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    seizure_type: Optional[str] = None
    intensity: Optional[float] = None
    location: Optional[str] = None
    confirmed_by_doctor: bool = False
    doctor_notes: Optional[str] = None
    reported_at: datetime

    class Config:
        from_attributes = True
