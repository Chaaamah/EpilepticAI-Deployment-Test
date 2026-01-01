from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class Medication(Base):
    __tablename__ = "medications"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Medication Details
    name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    purpose = Column(String, nullable=True)
    
    # Timing
    times_per_day = Column(Integer, nullable=True)
    specific_times = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    status = Column(String, default="active")  # active, archived, discontinued
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)  # General notes about the medication
    
    # Prescriber
    prescribed_by = Column(String, nullable=True)
    prescription_date = Column(DateTime, nullable=True)
    
    # Adherence
    last_taken = Column(DateTime, nullable=True)
    adherence_rate = Column(Float, nullable=True)
    
    # Notes
    instructions = Column(Text, nullable=True)
    side_effects = Column(Text, nullable=True)
    
    # Reminders
    reminder_enabled = Column(Boolean, default=True)
    reminder_times = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="medications")
    logs = relationship("MedicationLog", back_populates="medication", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Medication(id={self.id}, name={self.name})>"


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    # Log Details
    taken_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="taken")  # taken, missed, skipped
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    medication = relationship("Medication", back_populates="logs")
    patient = relationship("Patient")

    def __repr__(self):
        return f"<MedicationLog(id={self.id}, medication_id={self.medication_id}, status={self.status})>"