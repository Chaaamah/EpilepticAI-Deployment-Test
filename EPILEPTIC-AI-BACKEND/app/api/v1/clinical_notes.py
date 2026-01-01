from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.clinical_note import ClinicalNote
from app.models.patient import Patient
from app.schemas.clinical_note import ClinicalNoteCreate, ClinicalNoteUpdate, ClinicalNoteInDB
from app.api.deps import get_current_doctor_user

router = APIRouter()

@router.post("/", response_model=ClinicalNoteInDB, summary="Create clinical note")
async def create_clinical_note(
    note_data: ClinicalNoteCreate,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """Create a new clinical note for a patient. Only accessible by doctors."""
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == note_data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Get doctor's name/email
    doctor_identifier = getattr(current_doctor, 'full_name', None) or getattr(current_doctor, 'email', 'Unknown Doctor')

    note = ClinicalNote(
        patient_id=note_data.patient_id,
        note_type=note_data.note_type,
        title=note_data.title,
        content=note_data.content,
        created_by=doctor_identifier
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note

@router.get("/patient/{patient_id}", response_model=List[ClinicalNoteInDB], summary="Get patient's clinical notes")
async def get_patient_clinical_notes(
    patient_id: int,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """Get all clinical notes for a specific patient."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    notes = db.query(ClinicalNote).filter(
        ClinicalNote.patient_id == patient_id
    ).order_by(ClinicalNote.created_at.desc()).all()

    return notes

@router.get("/{note_id}", response_model=ClinicalNoteInDB, summary="Get clinical note by ID")
async def get_clinical_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """Get a specific clinical note by ID."""
    note = db.query(ClinicalNote).filter(ClinicalNote.id == note_id).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinical note not found"
        )

    return note

@router.put("/{note_id}", response_model=ClinicalNoteInDB, summary="Update clinical note")
async def update_clinical_note(
    note_id: int,
    note_data: ClinicalNoteUpdate,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """Update a clinical note. Only accessible by doctors."""
    note = db.query(ClinicalNote).filter(ClinicalNote.id == note_id).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinical note not found"
        )

    # Update note data
    update_data = note_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)

    db.commit()
    db.refresh(note)

    return note

@router.delete("/{note_id}", summary="Delete clinical note")
async def delete_clinical_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_doctor = Depends(get_current_doctor_user)
):
    """Delete a clinical note. Only accessible by doctors."""
    note = db.query(ClinicalNote).filter(ClinicalNote.id == note_id).first()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinical note not found"
        )

    db.delete(note)
    db.commit()

    return {"message": "Clinical note deleted successfully"}
