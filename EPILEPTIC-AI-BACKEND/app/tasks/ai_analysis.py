from celery import shared_task
from datetime import datetime, timedelta
from typing import List, Dict, Any
import asyncio
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.patient import Patient
from app.models.biometric import Biometric
from app.models.prediction import Prediction
from app.models.alert import Alert
from app.services.ai_prediction import AIPredictionService
from app.services.alert_service import AlertService

prediction_service = AIPredictionService()
alert_service = AlertService()

@shared_task(name="analyze_patient_data")
def analyze_patient_data(patient_id: int):
    """Analyze patient data and make predictions"""
    db = SessionLocal()
    try:
        # Get patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient or not patient.is_active:
            return {"error": "Patient not found or inactive"}
        
        # Run prediction
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        result = loop.run_until_complete(
            prediction_service.analyze_patient_data(db, patient_id)
        )
        
        # Save prediction
        if "risk_score" in result:
            prediction = Prediction(
                patient_id=patient_id,
                risk_score=result["risk_score"],
                confidence=result.get("confidence", 0),
                features_used=result.get("features", {}),
                predicted_at=datetime.utcnow(),
                predicted_for=datetime.utcnow() + timedelta(minutes=30)
            )
            
            db.add(prediction)
            db.commit()
            db.refresh(prediction)
            
            result["prediction_id"] = prediction.id
            
            # Check if alert should be triggered
            if prediction_service.should_trigger_alert(result):
                loop.run_until_complete(
                    alert_service.create_seizure_prediction_alert(
                        db=db,
                        patient_id=patient_id,
                        risk_score=result["risk_score"],
                        prediction_data=result
                    )
                )
        
        return result
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@shared_task(name="process_biometric_batch")
def process_biometric_batch(biometric_data: List[Dict[str, Any]]):
    """Process batch of biometric data"""
    db = SessionLocal()
    try:
        created_count = 0
        
        for data in biometric_data:
            try:
                biometric = Biometric(**data)
                db.add(biometric)
                created_count += 1
            except Exception as e:
                print(f"Error creating biometric record: {e}")
                continue
        
        db.commit()
        
        # Trigger analysis for each unique patient
        patient_ids = set(data.get("patient_id") for data in biometric_data if data.get("patient_id"))
        for patient_id in patient_ids:
            if patient_id:
                analyze_patient_data.delay(patient_id)
        
        return {
            "success": True,
            "created_count": created_count,
            "total_count": len(biometric_data),
            "patient_ids_analyzed": list(patient_ids)
        }
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@shared_task(name="analyze_all_active_patients")
def analyze_all_active_patients():
    """Analyze all active patients"""
    db = SessionLocal()
    try:
        active_patients = db.query(Patient).filter(Patient.is_active == True).all()
        
        results = []
        for patient in active_patients:
            result = analyze_patient_data.delay(patient.id)
            results.append({
                "patient_id": patient.id,
                "patient_name": patient.full_name,
                "task_id": result.id
            })
        
        return {
            "success": True,
            "analyzed_count": len(active_patients),
            "tasks_created": results
        }
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()