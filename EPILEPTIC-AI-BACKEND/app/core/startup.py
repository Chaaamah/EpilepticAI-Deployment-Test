"""
Startup tasks for the application
Auto-assigns unassigned patients to doctors
"""
from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.core.database import SessionLocal
import logging

logger = logging.getLogger(__name__)

def auto_assign_orphan_patients():
    """
    Automatically assign patients without a treating neurologist
    to the first available active doctor.
    This runs on application startup.
    """
    db = SessionLocal()
    try:
        # Find patients without a treating neurologist
        orphan_patients = db.query(Patient).filter(
            (Patient.treating_neurologist == None) |
            (Patient.treating_neurologist == '')
        ).all()

        if not orphan_patients:
            logger.info("No orphan patients found. All patients are assigned.")
            return

        # Find first active doctor
        first_doctor = db.query(Doctor).filter(
            Doctor.is_active == True
        ).order_by(Doctor.id).first()

        if not first_doctor:
            logger.warning(f"Found {len(orphan_patients)} orphan patients but no active doctors to assign them to.")
            return

        # Assign all orphan patients to the first doctor
        count = 0
        for patient in orphan_patients:
            patient.treating_neurologist = first_doctor.email
            count += 1

        db.commit()
        logger.info(f"Auto-assigned {count} orphan patients to Dr. {first_doctor.full_name} ({first_doctor.email})")

    except Exception as e:
        logger.error(f"Error during auto-assignment of orphan patients: {e}")
        db.rollback()
    finally:
        db.close()
