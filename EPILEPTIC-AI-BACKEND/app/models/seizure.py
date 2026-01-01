from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class Seizure(Base):
    __tablename__ = "seizures"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Timing
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Float, nullable=True)
    
    # Type & Severity
    seizure_type = Column(String, nullable=True)
    intensity = Column(Float, nullable=True)
    
    # Symptoms
    symptoms = Column(JSON, default=list)
    
    # Context
    location = Column(String, nullable=True)
    activity_before = Column(String, nullable=True)
    trigger_suspected = Column(String, nullable=True)
    stress_level_before = Column(Float, nullable=True)
    
    # After Effects
    after_effects = Column(Text, nullable=True)
    recovery_time_minutes = Column(Float, nullable=True)
    
    # Response
    medication_taken = Column(Boolean, default=False)
    emergency_called = Column(Boolean, default=False)
    contacted_emergency_contacts = Column(Boolean, default=False)
    
    # Verification
    confirmed_by_doctor = Column(Boolean, default=False)
    doctor_notes = Column(Text, nullable=True)
    
    # Timestamps
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="seizures")
    
    def __repr__(self):
        return f"<Seizure(id={self.id}, patient_id={self.patient_id})>"