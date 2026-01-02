"""
Emergency Contacts API Endpoints

Routes pour gérer les contacts d'urgence du patient
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Dict, Any
from pydantic import BaseModel, Field, EmailStr

from app.core.database import get_db
from app.api.deps import get_current_patient, get_current_patient_user
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import EmergencyContact, PatientInDB

router = APIRouter()


class AddContactRequest(BaseModel):
    """Schema pour ajouter un contact d'urgence"""
    name: str = Field(..., min_length=2, max_length=100)
    relationship: str = Field(..., description="Ex: Mère, Père, Conjoint, Ami")
    phone: str = Field(..., min_length=10, max_length=15, description="Numéro de téléphone")
    email: EmailStr = None
    priority: int = Field(default=1, ge=1, le=5, description="1 = plus prioritaire")
    notification_method: str = Field(default="sms", description="sms, call, ou sms+call")


class UpdateContactRequest(BaseModel):
    """Schema pour mettre à jour un contact"""
    name: str = None
    relationship: str = None
    phone: str = None
    email: EmailStr = None
    priority: int = Field(None, ge=1, le=5)
    notification_method: str = None


class ContactsPermissionRequest(BaseModel):
    """Schema pour donner la permission d'accès aux contacts"""
    permission_granted: bool = Field(..., description="True pour autoriser l'accès")
    platform: str = Field(default="ios", description="ios ou android")


@router.get("/", response_model=List[EmergencyContact])
async def get_emergency_contacts(
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des contacts d'urgence du patient
    """
    # Récupérer le patient
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient = patient_record
    else:
        patient = current_patient

    # Retourner les contacts
    contacts = patient.emergency_contacts or []

    return contacts


@router.post("/", response_model=PatientInDB)
async def add_emergency_contact(
    contact: AddContactRequest,
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Ajoute un nouveau contact d'urgence et retourne l'objet Patient complet
    """
    # Récupérer le patient
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient = patient_record
    else:
        patient = current_patient

    # Récupérer les contacts existants
    contacts = patient.emergency_contacts or []

    # Vérifier le maximum (5 contacts)
    if len(contacts) >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 emergency contacts allowed"
        )

    # Vérifier si le numéro existe déjà
    for existing_contact in contacts:
        if existing_contact.get("phone") == contact.phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contact with phone {contact.phone} already exists"
            )

    # Ajouter le nouveau contact
    new_contact = {
        "name": contact.name,
        "relationship": contact.relationship,
        "phone": contact.phone,
        "email": contact.email,
        "priority": contact.priority,
        "notification_method": contact.notification_method
    }

    contacts.append(new_contact)

    # Mettre à jour le patient
    patient.emergency_contacts = contacts
    flag_modified(patient, "emergency_contacts")
    db.commit()
    db.refresh(patient)

    print(f"✅ Contact {contact.name} added successfully to patient {patient.email}")
    print(f"   Total contacts: {len(patient.emergency_contacts)}")

    return patient


@router.put("/{phone}", response_model=Dict[str, Any])
async def update_emergency_contact(
    phone: str,
    update_data: UpdateContactRequest,
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Met à jour un contact d'urgence existant (identifié par numéro de téléphone)
    """
    # Récupérer le patient
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient = patient_record
    else:
        patient = current_patient

    # Récupérer les contacts
    contacts = patient.emergency_contacts or []

    # Trouver le contact
    contact_found = False
    for i, contact in enumerate(contacts):
        if contact.get("phone") == phone:
            contact_found = True

            # Mettre à jour les champs fournis
            if update_data.name is not None:
                contact["name"] = update_data.name
            if update_data.relationship is not None:
                contact["relationship"] = update_data.relationship
            if update_data.phone is not None:
                contact["phone"] = update_data.phone
            if update_data.email is not None:
                contact["email"] = update_data.email
            if update_data.priority is not None:
                contact["priority"] = update_data.priority
            if update_data.notification_method is not None:
                contact["notification_method"] = update_data.notification_method

            contacts[i] = contact
            break

    if not contact_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency contact with phone {phone} not found"
        )

    # Sauvegarder
    patient.emergency_contacts = contacts
    flag_modified(patient, "emergency_contacts")
    db.commit()
    db.refresh(patient)

    return {
        "message": "Emergency contact updated successfully",
        "contact": contacts[i]
    }


@router.delete("/{phone}", response_model=PatientInDB)
async def delete_emergency_contact(
    phone: str,
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Supprime un contact d'urgence et retourne l'objet Patient complet
    """
    import re

    # Normaliser le numéro de téléphone reçu (garder seulement chiffres et +)
    normalized_phone = re.sub(r'[^0-9+]', '', phone)

    # Récupérer le patient
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient = patient_record
    else:
        patient = current_patient

    # Récupérer les contacts
    contacts = patient.emergency_contacts or []

    print(f"🗑️ Attempting to delete contact with phone: {phone}")
    print(f"   Normalized to: {normalized_phone}")
    print(f"   Current contacts: {[c.get('phone') for c in contacts]}")

    # Filtrer pour enlever le contact - comparer les numéros normalisés
    updated_contacts = []
    found = False

    for c in contacts:
        contact_phone = c.get("phone", "")
        normalized_contact_phone = re.sub(r'[^0-9+]', '', contact_phone)

        if normalized_contact_phone == normalized_phone:
            found = True
            print(f"   ✓ Found matching contact: {c.get('name')} ({contact_phone})")
        else:
            updated_contacts.append(c)

    if not found:
        print(f"❌ Contact with phone {phone} not found")
        print(f"   Searched for normalized: {normalized_phone}")
        print(f"   Available normalized: {[re.sub(r'[^0-9+]', '', c.get('phone', '')) for c in contacts]}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency contact with phone {phone} not found"
        )

    # Sauvegarder
    patient.emergency_contacts = updated_contacts
    flag_modified(patient, "emergency_contacts")
    db.commit()
    db.refresh(patient)

    print(f"✅ Contact deleted successfully!")
    print(f"   Remaining contacts: {len(patient.emergency_contacts)}")

    return patient


@router.post("/permissions", response_model=Dict[str, Any])
async def grant_contacts_permission(
    request: ContactsPermissionRequest,
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Enregistre la permission d'accès aux contacts du téléphone

    Cette permission est requise pour que l'application puisse:
    1. Suggérer des contacts à ajouter
    2. Importer automatiquement des contacts d'urgence
    """
    # Récupérer le patient
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient = patient_record
    else:
        patient = current_patient

    # Mettre à jour les préférences
    notification_prefs = patient.notification_preferences or {}
    notification_prefs["contacts_permission_granted"] = request.permission_granted
    notification_prefs["contacts_permission_platform"] = request.platform

    patient.notification_preferences = notification_prefs
    flag_modified(patient, "notification_preferences")
    db.commit()

    return {
        "message": "Contacts permission updated successfully",
        "permission_granted": request.permission_granted,
        "platform": request.platform
    }


@router.get("/permissions", response_model=Dict[str, Any])
async def get_contacts_permission(
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Vérifie si la permission d'accès aux contacts a été accordée
    """
    # Récupérer le patient
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient = patient_record
    else:
        patient = current_patient

    notification_prefs = patient.notification_preferences or {}

    return {
        "permission_granted": notification_prefs.get("contacts_permission_granted", False),
        "platform": notification_prefs.get("contacts_permission_platform", "unknown")
    }
