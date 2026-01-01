from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=True)

    # Alert Details
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)

    # Risk Information
    risk_score = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)

    # Data
    data = Column(JSON, nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    # User Confirmation (for countdown feature)
    requires_user_confirmation = Column(Boolean, default=False)
    user_confirmed = Column(Boolean, default=False)
    user_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    confirmation_deadline = Column(DateTime(timezone=True), nullable=True)

    # Emergency Notifications
    emergency_notified = Column(Boolean, default=False)
    emergency_notified_at = Column(DateTime(timezone=True), nullable=True)

    # Notifications
    notifications_sent = Column(JSON, default=list)

    # Error tracking
    error_message = Column(String, nullable=True)

    # Resolution
    resolved = Column(Boolean, default=False)
    resolved_by = Column(String, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="alerts")
    prediction = relationship("Prediction", foreign_keys=[prediction_id])

    def __repr__(self):
        return f"<Alert(id={self.id}, type={self.alert_type})>"