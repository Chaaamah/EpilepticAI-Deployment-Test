from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class ClinicalNote(Base):
    __tablename__ = "clinical_notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, nullable=True)  # Can link to doctor if needed

    # Note details
    note_type = Column(String, nullable=False)  # "consultation", "observation", "follow-up", "annotation"
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)

    # Metadata
    created_by = Column(String, nullable=False)  # Doctor's name or email
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="clinical_notes")

    def __repr__(self):
        return f"<ClinicalNote(id={self.id}, patient_id={self.patient_id}, type={self.note_type})>"
