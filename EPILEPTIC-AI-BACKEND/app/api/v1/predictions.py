from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.prediction import Prediction
from app.services.ai_prediction import AIPredictionService
from app.schemas.prediction import PredictionResult, PredictionCreate
from app.api.deps import get_current_patient, get_current_patient_user
from app.models.patient import Patient
from app.models.user import User

router = APIRouter()
prediction_service = AIPredictionService()

@router.get("/", response_model=List[PredictionResult])
async def get_predictions(
    hours: int = 24,
    current_patient=Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """Get recent predictions"""
    # Get patient ID
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient_id = patient_record.id
    else:
        patient_id = current_patient.id

    start_time = datetime.utcnow() - timedelta(hours=hours)

    predictions = db.query(Prediction).filter(
        Prediction.patient_id == patient_id,
        Prediction.predicted_at >= start_time
    ).order_by(Prediction.predicted_at.desc()).all()

    return predictions

@router.get("/latest", response_model=PredictionResult)
async def get_latest_prediction(
    current_patient=Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """Get latest prediction"""
    # Get patient ID
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient_id = patient_record.id
    else:
        patient_id = current_patient.id

    prediction = db.query(Prediction).filter(
        Prediction.patient_id == patient_id
    ).order_by(Prediction.predicted_at.desc()).first()

    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No predictions found"
        )

    return prediction

@router.post("/analyze")
async def analyze_biometric_data(
    current_patient=Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """Analyze biometric data and make prediction"""
    # Get patient ID
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient_id = patient_record.id
    else:
        patient_id = current_patient.id

    try:
        # predict_seizure_risk retourne un objet Prediction déjà sauvegardé
        prediction = await prediction_service.predict_seizure_risk(
            db=db,
            patient_id=patient_id
        )

        # Retourner les données de la prédiction
        return {
            "prediction_id": prediction.id,
            "risk_score": prediction.risk_score,
            "confidence": prediction.confidence,
            "recommendation": "Repos et surveillance" if prediction.risk_score > 70 else "Activité normale",
            "predicted_at": prediction.predicted_at.isoformat(),
            "predicted_for": prediction.predicted_for.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )