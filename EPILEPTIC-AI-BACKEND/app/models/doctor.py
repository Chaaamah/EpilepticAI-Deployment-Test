from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Date
from sqlalchemy.sql import func

from app.core.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    hospital = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    location = Column(String(255), nullable=True)
    department = Column(String(100), nullable=True)

    # Additional profile fields
    availability = Column(Text, nullable=True)
    qualifications = Column(Text, nullable=True)
    blood_group = Column(String(10), nullable=True)
    gender = Column(String(20), nullable=True)
    years_experience = Column(String, nullable=True)  # Changed from Integer to String to support "15+ Years" format
    bio = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    certifications = Column(Text, nullable=True)
    awards = Column(Text, nullable=True)
    dob = Column(Date, nullable=True)
    clinic = Column(Text, nullable=True)
    status = Column(String(50), default='available')

    # Authentication
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # Preferences
    notification_preferences = Column(Text, default='{"email": true, "sms": false}')

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Doctor(id={self.id}, email={self.email})>"