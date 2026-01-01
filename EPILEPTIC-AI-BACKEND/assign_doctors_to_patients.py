"""
Script to assign doctors to existing patients in the database
Run this script to populate the treating_neurologist field for existing patients
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.patient import Patient
from app.models.doctor import Doctor

def assign_doctors_to_patients():
    """Assign doctors to patients that don't have one assigned"""
    db: Session = SessionLocal()

    try:
        # Get all doctors
        doctors = db.query(Doctor).filter(Doctor.is_active == True).all()

        if not doctors:
            print("No active doctors found in the database.")
            return

        print(f"Found {len(doctors)} active doctors:")
        for i, doctor in enumerate(doctors, 1):
            print(f"  {i}. {doctor.full_name} ({doctor.email})")

        # Get all patients without an assigned doctor
        patients = db.query(Patient).filter(
            (Patient.treating_neurologist == None) | (Patient.treating_neurologist == "")
        ).all()

        if not patients:
            print("\nNo patients without assigned doctors found.")
            return

        print(f"\nFound {len(patients)} patients without assigned doctors:")
        for patient in patients:
            print(f"  - {patient.full_name} ({patient.email})")

        # Assign doctors to patients (round-robin distribution)
        print("\nAssigning doctors to patients...")
        for i, patient in enumerate(patients):
            doctor = doctors[i % len(doctors)]  # Round-robin assignment
            patient.treating_neurologist = doctor.email
            print(f"  ✓ Assigned {doctor.full_name} to {patient.full_name}")

        # Commit changes
        db.commit()
        print(f"\n✅ Successfully assigned doctors to {len(patients)} patients!")

        # Show summary
        print("\nSummary:")
        for doctor in doctors:
            count = db.query(Patient).filter(
                Patient.treating_neurologist == doctor.email
            ).count()
            print(f"  Dr. {doctor.full_name}: {count} patients")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Assigning Doctors to Patients")
    print("=" * 60)
    assign_doctors_to_patients()
