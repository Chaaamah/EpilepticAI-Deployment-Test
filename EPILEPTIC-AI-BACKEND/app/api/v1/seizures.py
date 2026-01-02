from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.seizure import Seizure
from app.schemas.seizure import SeizureCreate, SeizureUpdate, SeizureInDB
from app.api.deps import get_current_patient

router = APIRouter()

@router.post("/", response_model=SeizureInDB)
async def create_seizure(
    seizure_data: SeizureCreate,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Create a seizure record"""
    # Calculate duration if end_time is provided
    duration_minutes = None
    if seizure_data.end_time:
        duration = seizure_data.end_time - seizure_data.start_time
        duration_minutes = duration.total_seconds() / 60
    
    seizure = Seizure(
        patient_id=current_patient.id,
        duration_minutes=duration_minutes,
        **seizure_data.dict()
    )
    
    db.add(seizure)
    db.commit()
    db.refresh(seizure)
    
    # Update patient's last seizure date
    current_patient.last_seizure_date = seizure.start_time
    db.commit()
    
    return seizure

@router.get("/", response_model=List[SeizureInDB])
async def get_seizures(
    days: int = 30,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get seizure history"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    seizures = db.query(Seizure).filter(
        Seizure.patient_id == current_patient.id,
        Seizure.start_time >= start_date
    ).order_by(Seizure.start_time.desc()).all()
    
    return seizures

@router.get("/{seizure_id}", response_model=SeizureInDB)
async def get_seizure(
    seizure_id: int,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get a specific seizure"""
    seizure = db.query(Seizure).filter(
        Seizure.id == seizure_id,
        Seizure.patient_id == current_patient.id
    ).first()
    
    if not seizure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seizure not found"
        )
    
    return seizure

@router.put("/{seizure_id}", response_model=SeizureInDB)
async def update_seizure(
    seizure_id: int,
    seizure_update: SeizureUpdate,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Update a seizure record"""
    seizure = db.query(Seizure).filter(
        Seizure.id == seizure_id,
        Seizure.patient_id == current_patient.id
    ).first()
    
    if not seizure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seizure not found"
        )
    
    update_data = seizure_update.dict(exclude_unset=True)
    
    # Recalculate duration if end_time is updated
    if "end_time" in update_data and update_data["end_time"]:
        duration = update_data["end_time"] - seizure.start_time
        update_data["duration_minutes"] = duration.total_seconds() / 60
    
    for field, value in update_data.items():
        setattr(seizure, field, value)
    
    db.add(seizure)
    db.commit()
    db.refresh(seizure)
    
    return seizure