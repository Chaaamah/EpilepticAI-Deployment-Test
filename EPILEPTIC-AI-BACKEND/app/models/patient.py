from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    gender = Column(String, nullable=True)
    
    # Medical Information
    epilepsy_type = Column(String, nullable=True)
    diagnosis_date = Column(DateTime, nullable=True)
    trigger_factors = Column(JSON, default=list)
    medical_history = Column(Text, nullable=True)
    
    # Emergency Contacts
    emergency_contacts = Column(JSON, default=list)
    
    # Medical Team
    treating_neurologist = Column(String, nullable=True)
    hospital = Column(String, nullable=True)

    # Contact Information
    address = Column(Text, nullable=True)

    # Health Status
    health_status = Column(String, nullable=True, default='stable')  # stable, low, medium, high, critical

    # Authentication
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Preferences
    notification_preferences = Column(JSON, default={
        "email": True,
        "sms": True,
        "push": True
    })
    
    # Statistics
    last_seizure_date = Column(DateTime, nullable=True)
    seizure_frequency = Column(Float, nullable=True)
    average_duration = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    biometrics = relationship("Biometric", back_populates="patient", cascade="all, delete-orphan")
    seizures = relationship("Seizure", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="patient", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="patient", cascade="all, delete-orphan")
    clinical_notes = relationship("ClinicalNote", back_populates="patient", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Patient(id={self.id}, email={self.email})>"