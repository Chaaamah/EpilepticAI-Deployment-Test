from sqlalchemy import Column, Integer, Float, DateTime, Boolean, JSON, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Prediction Data
    risk_score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=True)
    prediction_window = Column(Integer, default=30)
    
    # Timing
    predicted_at = Column(DateTime(timezone=True), server_default=func.now())
    predicted_for = Column(DateTime(timezone=True), nullable=True)
    
    # Features
    features_used = Column(JSON, nullable=True)
    model_version = Column(String, nullable=True)
    
    # Alert
    alert_generated = Column(Boolean, default=False)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    
    # Outcome
    seizure_occurred = Column(Boolean, nullable=True)
    actual_seizure_id = Column(Integer, ForeignKey("seizures.id"), nullable=True)
    accuracy_feedback = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="predictions")
    
    def __repr__(self):
        return f"<Prediction(id={self.id}, risk_score={self.risk_score})>"