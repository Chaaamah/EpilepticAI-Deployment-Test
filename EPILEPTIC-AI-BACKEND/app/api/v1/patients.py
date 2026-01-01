from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientUpdate, PatientInDB, EmergencyContact
from app.api.deps import get_current_patient_user

router = APIRouter()

# Schema for adding emergency contacts from iPhone contacts
class EmergencyContactFromPhone(BaseModel):
    """Schema for emergency contacts selected from iPhone contact list"""
    name: str
    phone: str
    relationship: str = "Emergency Contact"
    email: str = None
    priority: int = 1
    notification_method: str = "sms"

@router.get("/me", response_model=PatientInDB)
async def get_me(
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """Get current patient profile"""
    # If current user is from User table, get Patient record
    if isinstance(current_patient, User):
        patient = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient profile not found"
            )
        return patient
    return current_patient

@router.put("/me", response_model=PatientInDB)
async def update_me(
    patient_update: PatientUpdate,
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """Update current patient profile"""
    # Get the actual Patient object
    if isinstance(current_patient, User):
        patient = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient profile not found"
            )
    else:
        patient = current_patient

    update_data = patient_update.dict(exclude_unset=True)

    if "emergency_contacts" in update_data:
        update_data["emergency_contacts"] = [ec.dict() for ec in patient_update.emergency_contacts]

    for field, value in update_data.items():
        setattr(patient, field, value)

    db.add(patient)
    db.commit()
    db.refresh(patient)

    return patient

@router.post("/me/emergency-contacts", response_model=PatientInDB, summary="Add emergency contact from iPhone")
async def add_emergency_contact(
    contact: EmergencyContactFromPhone,
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Add emergency contact selected from iPhone contacts app.
    This endpoint allows patients to select contacts from their phone and add them as emergency contacts.
    """
    # Get the actual Patient object
    if isinstance(current_patient, User):
        patient = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient profile not found"
            )
    else:
        patient = current_patient

    # Get existing emergency contacts
    existing_contacts = patient.emergency_contacts or []

    # Add new contact
    new_contact = {
        "name": contact.name,
        "phone": contact.phone,
        "relationship": contact.relationship,
        "email": contact.email,
        "priority": contact.priority,
        "notification_method": contact.notification_method
    }

    existing_contacts.append(new_contact)
    patient.emergency_contacts = existing_contacts

    db.commit()
    db.refresh(patient)

    return patient

@router.delete("/me/emergency-contacts/{contact_index}", response_model=PatientInDB, summary="Remove emergency contact")
async def remove_emergency_contact(
    contact_index: int,
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Remove an emergency contact by index.
    """
    # Get the actual Patient object
    if isinstance(current_patient, User):
        patient = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient profile not found"
            )
    else:
        patient = current_patient

    # Get existing emergency contacts
    existing_contacts = patient.emergency_contacts or []

    if contact_index < 0 or contact_index >= len(existing_contacts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid contact index"
        )

    # Remove contact
    existing_contacts.pop(contact_index)
    patient.emergency_contacts = existing_contacts

    db.commit()
    db.refresh(patient)

    return patient

@router.get("/{patient_id}", response_model=PatientInDB)
async def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get patient by ID (for doctors)"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    return patient