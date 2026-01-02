from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.biometric import Biometric
from app.schemas.biometric import BiometricCreate, BiometricInDB
from app.api.deps import get_current_patient, get_current_patient_user
from app.models.patient import Patient
from app.models.user import User

router = APIRouter()

@router.post("", response_model=BiometricInDB)
async def create_biometric(
    biometric_data: BiometricCreate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Create biometric data"""
    biometric = Biometric(
        patient_id=current_patient.id,
        **biometric_data.dict()
    )
    
    db.add(biometric)
    db.commit()
    db.refresh(biometric)
    
    return biometric

@router.post("/batch", response_model=List[BiometricInDB])
async def create_biometric_batch(
    biometrics_data: List[BiometricCreate],
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Create multiple biometric data entries"""
    biometrics = []

    for data in biometrics_data:
        biometric = Biometric(
            patient_id=current_patient.id,
            **data.dict()
        )
        db.add(biometric)
        biometrics.append(biometric)
    
    db.commit()
    
    for biometric in biometrics:
        db.refresh(biometric)
    
    return biometrics

@router.get("", response_model=List[BiometricInDB])
async def get_biometrics(
    hours: int = 24,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get recent biometric data"""
    query = db.query(Biometric).filter(Biometric.patient_id == current_patient.id)

    if startDate and endDate:
        try:
            # Handle potential ISO format differences
            start_dt = datetime.fromisoformat(startDate.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(endDate.replace('Z', '+00:00'))
            query = query.filter(Biometric.recorded_at >= start_dt, Biometric.recorded_at <= end_dt)
        except (ValueError, TypeError):
            start_time = datetime.utcnow() - timedelta(hours=hours)
            query = query.filter(Biometric.recorded_at >= start_time)
    else:
        start_time = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(Biometric.recorded_at >= start_time)

    biometrics = query.order_by(Biometric.recorded_at.desc()).all()
    return biometrics

@router.get("/latest", response_model=BiometricInDB)
async def get_latest_biometric(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get latest biometric data"""
    biometric = db.query(Biometric).filter(
        Biometric.patient_id == current_patient.id
    ).order_by(Biometric.recorded_at.desc()).first()
    
    if not biometric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No biometric data found"
        )
    
    return biometric