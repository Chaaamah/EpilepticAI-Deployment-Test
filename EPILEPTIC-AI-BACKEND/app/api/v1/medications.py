from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json

from app.core.database import get_db
from app.models.medication import Medication, MedicationLog
from app.schemas.medication import MedicationCreate, MedicationUpdate, MedicationInDB, MedicationLogCreate, MedicationLogInDB
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

@router.delete("/{medication_id}")
async def delete_medication(
    medication_id: int,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Delete a medication (for mobile app)"""
    medication = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.patient_id == current_patient.id
    ).first()

    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )

    db.delete(medication)
    db.commit()

    return {"message": f"Medication {medication.name} deleted successfully"}


@router.post("/{medication_id}/take", response_model=MedicationLogInDB)
async def take_medication(
    medication_id: int,
    log_data: MedicationLogCreate = None,
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

    # Use provided data or defaults
    taken_at = log_data.taken_at if log_data and log_data.taken_at else datetime.utcnow()
    log_status = log_data.status if log_data and log_data.status else "taken"
    notes = log_data.notes if log_data else None

    # Create medication log
    medication_log = MedicationLog(
        medication_id=medication_id,
        patient_id=current_patient.id,
        taken_at=taken_at,
        status=log_status,
        notes=notes
    )

    db.add(medication_log)

    # Update medication's last_taken timestamp
    medication.last_taken = taken_at
    db.commit()
    db.refresh(medication_log)

    return medication_log


@router.get("/logs")
async def get_medication_logs(
    days: int = 30,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """
    Get medication intake logs for the last N days.
    Returns history of medication taken/missed.
    """
    from datetime import timedelta

    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Get medication logs from database
    medication_logs = db.query(MedicationLog).filter(
        MedicationLog.patient_id == current_patient.id,
        MedicationLog.taken_at >= start_date,
        MedicationLog.taken_at <= end_date
    ).order_by(MedicationLog.taken_at.desc()).all()

    # Convert to dict format for response
    logs = []
    for log in medication_logs:
        logs.append({
            "id": log.id,
            "medication_id": log.medication_id,
            "taken_at": log.taken_at.isoformat(),
            "status": log.status,
            "notes": log.notes
        })

    return {
        "logs": logs,
        "period_days": days,
        "total_entries": len(logs)
    }