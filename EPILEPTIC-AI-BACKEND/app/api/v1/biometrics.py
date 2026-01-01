from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.biometric import Biometric
from app.schemas.biometric import BiometricCreate, BiometricInDB
from app.api.deps import get_current_patient, get_current_patient_user
from app.models.patient import Patient
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=BiometricInDB)
async def create_biometric(
    biometric_data: BiometricCreate,
    current_patient=Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """Create biometric data"""
    # Get the actual patient ID from either User or Patient object
    if isinstance(current_patient, User):
        # Find the corresponding Patient record by email
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient_id = patient_record.id
    else:
        patient_id = current_patient.id

    biometric = Biometric(
        patient_id=patient_id,
        **biometric_data.dict()
    )
    
    db.add(biometric)
    db.commit()
    db.refresh(biometric)
    
    return biometric

@router.post("/batch", response_model=List[BiometricInDB])
async def create_biometric_batch(
    biometrics_data: List[BiometricCreate],
    current_patient=Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """Create multiple biometric data entries"""
    # Get the actual patient ID from either User or Patient object
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient_id = patient_record.id
    else:
        patient_id = current_patient.id

    biometrics = []

    for data in biometrics_data:
        biometric = Biometric(
            patient_id=patient_id,
            **data.dict()
        )
        db.add(biometric)
        biometrics.append(biometric)
    
    db.commit()
    
    for biometric in biometrics:
        db.refresh(biometric)
    
    return biometrics

@router.get("/", response_model=List[BiometricInDB])
async def get_biometrics(
    hours: int = 24,
    current_patient=Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """Get recent biometric data"""
    # Get the actual patient ID
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient_id = patient_record.id
    else:
        patient_id = current_patient.id

    start_time = datetime.utcnow() - timedelta(hours=hours)

    biometrics = db.query(Biometric).filter(
        Biometric.patient_id == patient_id,
        Biometric.recorded_at >= start_time
    ).order_by(Biometric.recorded_at.desc()).all()

    return biometrics

@router.get("/latest", response_model=BiometricInDB)
async def get_latest_biometric(
    current_patient=Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """Get latest biometric data"""
    # Get the actual patient ID
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient_id = patient_record.id
    else:
        patient_id = current_patient.id

    biometric = db.query(Biometric).filter(
        Biometric.patient_id == patient_id
    ).order_by(Biometric.recorded_at.desc()).first()
    
    if not biometric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No biometric data found"
        )
    
    return biometric