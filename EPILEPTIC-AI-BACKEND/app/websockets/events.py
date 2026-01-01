from .manager import manager
from typing import Dict, Any
from datetime import datetime

async def send_alert(patient_id: int, alert_data: Dict[str, Any]):
    """Send alert to patient via WebSocket"""
    message = {
        "type": "alert",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "id": alert_data.get("id"),
            "alert_type": alert_data.get("alert_type"),
            "severity": alert_data.get("severity"),
            "title": alert_data.get("title"),
            "message": alert_data.get("message"),
            "data": alert_data.get("data", {}),
            "triggered_at": alert_data.get("triggered_at")
        }
    }
    
    await manager.send_to_patient(patient_id, message)

async def send_biometric_update(patient_id: int, biometric_data: Dict[str, Any]):
    """Send real-time biometric update"""
    message = {
        "type": "biometric_update",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "heart_rate": biometric_data.get("heart_rate"),
            "heart_rate_variability": biometric_data.get("heart_rate_variability"),
            "movement_intensity": biometric_data.get("movement_intensity"),
            "stress_level": biometric_data.get("stress_level"),
            "recorded_at": biometric_data.get("recorded_at")
        }
    }
    
    await manager.send_to_patient(patient_id, message)

async def send_prediction_update(patient_id: int, prediction_data: Dict[str, Any]):
    """Send prediction update"""
    message = {
        "type": "prediction_update",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "risk_score": prediction_data.get("risk_score"),
            "confidence": prediction_data.get("confidence"),
            "prediction_id": prediction_data.get("prediction_id"),
            "predicted_at": prediction_data.get("predicted_at"),
            "features_used": prediction_data.get("features_used", {}),
            "recommended_actions": prediction_data.get("recommended_actions", [])
        }
    }
    
    await manager.send_to_patient(patient_id, message)

async def send_emergency_alert(patient_id: int, emergency_data: Dict[str, Any]):
    """Send emergency alert"""
    message = {
        "type": "emergency",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "emergency_type": emergency_data.get("emergency_type"),
            "severity": "critical",
            "message": emergency_data.get("message"),
            "location": emergency_data.get("location"),
            "patient_info": emergency_data.get("patient_info", {}),
            "actions_required": [
                "Find safe location",
                "Take emergency medication if prescribed",
                "Alert emergency contacts",
                "Wait for assistance"
            ]
        }
    }
    
    await manager.send_to_patient(patient_id, message)

async def send_medication_reminder(patient_id: int, medication_data: Dict[str, Any]):
    """Send medication reminder"""
    message = {
        "type": "medication_reminder",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "medication_name": medication_data.get("medication_name"),
            "dosage": medication_data.get("dosage"),
            "time": medication_data.get("time"),
            "instructions": medication_data.get("instructions", "")
        }
    }
    
    await manager.send_to_patient(patient_id, message)

async def broadcast_to_patient(patient_id: int, message_type: str, data: Dict[str, Any]):
    """Broadcast custom message to patient"""
    message = {
        "type": message_type,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data
    }
    
    await manager.send_to_patient(patient_id, message)

async def send_doctor_notification(doctor_id: int, patient_id: int, notification_data: Dict[str, Any]):
    """Send notification to doctor about patient"""
    message = {
        "type": "doctor_notification",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "patient_id": patient_id,
            "notification_type": notification_data.get("type"),
            "title": notification_data.get("title"),
            "message": notification_data.get("message"),
            "severity": notification_data.get("severity", "medium"),
            "data": notification_data.get("data", {})
        }
    }
    
    await manager.send_to_doctor(doctor_id, message)

async def send_seizure_detection(patient_id: int, seizure_data: Dict[str, Any]):
    """Send seizure detection notification"""
    message = {
        "type": "seizure_detected",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "seizure_id": seizure_data.get("id"),
            "start_time": seizure_data.get("start_time"),
            "intensity": seizure_data.get("intensity"),
            "location": seizure_data.get("location"),
            "emergency_contacts_notified": seizure_data.get("emergency_contacts_notified", False),
            "actions": [
                "Ensure patient is in safe position",
                "Clear surrounding area",
                "Time the seizure",
                "Do not restrain movement",
                "Stay with patient until fully recovered"
            ]
        }
    }
    
    await manager.send_to_patient(patient_id, message)