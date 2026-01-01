from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class Biometric(Base):
    __tablename__ = "biometrics"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Heart Rate Data
    heart_rate = Column(Float, nullable=True)
    heart_rate_variability = Column(Float, nullable=True)
    spo2 = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    
    # Accelerometer Data
    accelerometer_x = Column(Float, nullable=True)
    accelerometer_y = Column(Float, nullable=True)
    accelerometer_z = Column(Float, nullable=True)
    
    # Derived Metrics
    movement_intensity = Column(Float, nullable=True)
    stress_level = Column(Float, nullable=True)
    
    # Sleep Data
    sleep_duration = Column(Float, nullable=True)
    sleep_quality = Column(Float, nullable=True)
    
    # Metadata
    device_id = Column(String, nullable=True)
    source = Column(String, default="apple_watch")
    
    # Timestamps
    recorded_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="biometrics")
    
    def __repr__(self):
        return f"<Biometric(id={self.id}, patient_id={self.patient_id})>"