from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json

from app.core.database import get_db
from app.models.medication import Medication
from app.schemas.medication import MedicationCreate, MedicationUpdate, MedicationInDB
from app.api.deps import get_current_patient

router = APIRouter()

@router.post("/", response_model=MedicationInDB)
async def create_medication(
    medication_data: MedicationCreate,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Create a medication record"""
    medication = Medication(
        patient_id=current_patient.id,
        specific_times=json.dumps(medication_data.specific_times) if medication_data.specific_times else None,
        reminder_times=json.dumps(medication_data.reminder_times) if medication_data.reminder_times else None,
        **medication_data.dict(exclude={"specific_times", "reminder_times"})
    )
    
    db.add(medication)
    db.commit()
    db.refresh(medication)
    
    return medication

@router.get("/", response_model=List[MedicationInDB])
async def get_medications(
    active_only: bool = True,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get medication list"""
    query = db.query(Medication).filter(
        Medication.patient_id == current_patient.id
    )
    
    if active_only:
        query = query.filter(Medication.is_active == True)
    
    medications = query.order_by(Medication.name.asc()).all()
    
    return medications

@router.get("/{medication_id}", response_model=MedicationInDB)
async def get_medication(
    medication_id: int,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get a specific medication"""
    medication = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.patient_id == current_patient.id
    ).first()
    
    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )
    
    return medication

@router.put("/{medication_id}", response_model=MedicationInDB)
async def update_medication(
    medication_id: int,
    medication_update: MedicationUpdate,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Update a medication"""
    medication = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.patient_id == current_patient.id
    ).first()
    
    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )
    
    update_data = medication_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(medication, field, value)
    
    db.add(medication)
    db.commit()
    db.refresh(medication)
    
    return medication

@router.post("/{medication_id}/take")
async def take_medication(
    medication_id: int,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Record medication intake"""
    medication = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.patient_id == current_patient.id
    ).first()
    
    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )
    
    medication.last_taken = datetime.utcnow()
    db.commit()
    
    return {"message": "Medication intake recorded"}