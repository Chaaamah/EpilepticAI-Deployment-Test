"""
Seizure Detection API Endpoints

Routes pour le flux complet de détection de crise:
1. POST /detect - Analyser les données biométriques
2. POST /confirm - Confirmer que le patient va bien (annule countdown)
3. GET /countdown-status - Obtenir le statut du countdown actif
4. POST /healthkit-sync - Récupérer et analyser les données depuis HealthKit
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.api.deps import get_current_patient, get_current_patient_user
from app.services.seizure_detection_service import get_seizure_detection_service
from app.models.patient import Patient
from app.models.user import User

router = APIRouter()


class BiometricDataInput(BaseModel):
    """Schema pour les données biométriques entrantes"""
    heart_rate: Optional[float] = Field(None, ge=30, le=250, description="BPM")
    heart_rate_variability: Optional[float] = Field(None, ge=0, le=200, description="ms")
    accelerometer_x: Optional[float] = None
    accelerometer_y: Optional[float] = None
    accelerometer_z: Optional[float] = None
    movement_intensity: Optional[float] = Field(None, ge=0, le=1, description="0-1")
    stress_level: Optional[float] = Field(None, ge=0, le=1, description="0-1")
    sleep_duration: Optional[float] = Field(None, ge=0, description="hours")
    sleep_quality: Optional[float] = Field(None, ge=0, le=100, description="0-100")
    source: str = Field(default="manual", description="Source des données")


class SimplePredictionInput(BaseModel):
    """Schema simplifié pour test avec Postman - 4 paramètres du modèle"""
    heart_rate: float = Field(..., ge=30, le=250, description="Heart Rate (BPM)")
    heart_rate_variability: float = Field(..., ge=0, le=200, description="HRV (ms)")
    spo2: float = Field(..., ge=70, le=100, description="SpO2 (%)")
    temperature: float = Field(..., ge=35, le=42, description="Body Temperature (°C)")


class HealthKitSyncRequest(BaseModel):
    """Schema pour la synchronisation HealthKit"""
    healthkit_token: str = Field(..., description="Token d'autorisation HealthKit")


class ConfirmSafetyRequest(BaseModel):
    """Schema pour confirmer la sécurité du patient"""
    alert_id: int = Field(..., description="ID de l'alerte à confirmer")
    notes: Optional[str] = Field(None, description="Notes optionnelles du patient")


@router.post("/detect", response_model=Dict[str, Any])
async def detect_seizure_risk(
    biometric_data: BiometricDataInput,
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Analyse les données biométriques et détecte les risques de crise

    Si un risque élevé est détecté:
    - Démarre un countdown de 30 secondes
    - Le patient doit confirmer qu'il va bien via /confirm
    - Si pas de confirmation: SMS automatique aux contacts d'urgence
    """
    # Récupérer l'ID du patient
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient_id = patient_record.id
    else:
        patient_id = current_patient.id

    # Récupérer le service de détection
    detection_service = get_seizure_detection_service()

    try:
        # Analyser les données
        result = await detection_service.process_biometric_data(
            db=db,
            patient_id=patient_id,
            biometric_data=biometric_data.dict()
        )

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing biometric data: {str(e)}"
        )


@router.post("/confirm", response_model=Dict[str, Any])
async def confirm_patient_safety(
    request: ConfirmSafetyRequest,
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Le patient confirme qu'il va bien

    Annule le countdown et empêche l'envoi de SMS aux contacts d'urgence
    """
    # Récupérer l'ID du patient
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient_id = patient_record.id
    else:
        patient_id = current_patient.id

    # Récupérer le service
    detection_service = get_seizure_detection_service()

    try:
        result = await detection_service.confirm_patient_safety(
            db=db,
            patient_id=patient_id,
            alert_id=request.alert_id
        )

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error confirming safety: {str(e)}"
        )


@router.get("/countdown-status", response_model=Dict[str, Any])
async def get_countdown_status(
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Obtient le statut du countdown actif pour le patient

    Utilisé par le frontend pour afficher le timer et le bouton de confirmation
    """
    # Récupérer l'ID du patient
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient_id = patient_record.id
    else:
        patient_id = current_patient.id

    # Récupérer le service
    detection_service = get_seizure_detection_service()

    countdown_info = await detection_service.get_active_countdown(patient_id)

    if countdown_info is None:
        return {
            "has_active_countdown": False,
            "message": "Aucun countdown actif"
        }

    return {
        "has_active_countdown": True,
        **countdown_info
    }


@router.post("/healthkit-sync", response_model=Dict[str, Any])
async def sync_healthkit_data(
    request: HealthKitSyncRequest,
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les données depuis HealthKit et lance l'analyse

    Utilisé par l'application iOS pour synchroniser automatiquement
    les données de l'Apple Watch
    """
    # Récupérer l'ID du patient
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient_id = patient_record.id
    else:
        patient_id = current_patient.id

    # Récupérer le service
    detection_service = get_seizure_detection_service()

    try:
        result = await detection_service.fetch_healthkit_data_and_analyze(
            db=db,
            patient_id=patient_id,
            user_token=request.healthkit_token
        )

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error syncing HealthKit data: {str(e)}"
        )


@router.post("/predict-simple", response_model=Dict[str, Any])
async def predict_simple(
    data: SimplePredictionInput,
    current_patient = Depends(get_current_patient_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint de test simplifié pour Postman

    Envoie 4 paramètres (HR, HRV, SPO2, Temperature) directement au modèle AI
    et déclenche le countdown si risque élevé détecté.

    ⚠️ MODE TEST: Seuil temporairement abaissé à 0.001 pour faciliter les tests.
    En production, le seuil sera à 0.70.

    Exemple de requête:
    ```json
    {
        "heart_rate": 95.5,
        "heart_rate_variability": 42.3,
        "spo2": 97.0,
        "temperature": 36.8
    }
    ```
    """
    # Récupérer l'ID du patient
    if isinstance(current_patient, User):
        patient_record = db.query(Patient).filter(Patient.email == current_patient.email).first()
        if not patient_record:
            raise HTTPException(status_code=404, detail="Patient record not found")
        patient_id = patient_record.id
    else:
        patient_id = current_patient.id

    # Convertir en format biométrique compatible
    biometric_data = {
        "heart_rate": data.heart_rate,
        "heart_rate_variability": data.heart_rate_variability,
        # Convertir SPO2 en stress_level inverse (proxy)
        # SPO2 100% = stress 0, SPO2 95% = stress 1
        "stress_level": max(0, min(1, (100 - data.spo2) / 5)),
        # Convertir température en movement_intensity (proxy)
        # 36.5°C = 0, 38°C = 1
        "movement_intensity": max(0, min(1, (data.temperature - 36.5) / 1.5)),
        "source": "postman_test"
    }

    # Récupérer le service de détection
    detection_service = get_seizure_detection_service()

    try:
        # Analyser les données
        result = await detection_service.process_biometric_data(
            db=db,
            patient_id=patient_id,
            biometric_data=biometric_data
        )

        # Ajouter les valeurs brutes dans la réponse pour debug
        result["input_data"] = {
            "heart_rate": data.heart_rate,
            "heart_rate_variability": data.heart_rate_variability,
            "spo2": data.spo2,
            "temperature": data.temperature
        }

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing data: {str(e)}"
        )
