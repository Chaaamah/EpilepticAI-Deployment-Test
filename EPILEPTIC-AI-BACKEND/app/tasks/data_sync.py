from celery import shared_task
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.biometric import Biometric
from app.models.alert import Alert
from app.models.prediction import Prediction
from app.models.medication import Medication
from app.models.patient import Patient
from app.services.healthkit_service import HealthKitService
from app.services.alert_service import AlertService
from app.services.notification_service import NotificationService

healthkit_service = HealthKitService()
alert_service = AlertService()
notification_service = NotificationService()

@shared_task(name="sync_healthkit_data")
def sync_healthkit_data(patient_id: int, user_token: str = None):
    """Sync HealthKit data for a patient"""
    db = SessionLocal()
    try:
        # Check if patient exists and is active
        patient = db.query(Patient).filter(
            Patient.id == patient_id,
            Patient.is_active == True
        ).first()
        
        if not patient:
            return {"error": "Patient not found or inactive"}
        
        # Configure HealthKit service if credentials are available
        if all([
            settings.HEALTHKIT_APP_ID,
            settings.HEALTHKIT_TEAM_ID,
            settings.HEALTHKIT_KEY_ID,
            settings.HEALTHKIT_PRIVATE_KEY
        ]):
            healthkit_service.configure(
                app_id=settings.HEALTHKIT_APP_ID,
                team_id=settings.HEALTHKIT_TEAM_ID,
                key_id=settings.HEALTHKIT_KEY_ID,
                private_key=settings.HEALTHKIT_PRIVATE_KEY
            )
        else:
            # Use mock data if HealthKit not configured
            return _mock_healthkit_sync(db, patient_id)
        
        # Define data types to fetch
        data_types = [
            "heart_rate",
            "heart_rate_variability",
            "sleep",
            "activity"
        ]
        
        # Define time range (last 24 hours)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(hours=24)
        
        # Generate JWT token for HealthKit
        jwt_token = healthkit_service.generate_jwt()
        if not jwt_token:
            return {"error": "Failed to generate HealthKit authentication token"}
        
        # Fetch data
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        result = loop.run_until_complete(
            healthkit_service.fetch_health_data(
                user_token=user_token or "mock_token",
                data_types=data_types,
                start_date=start_date,
                end_date=end_date
            )
        )
        
        # Process and store the data
        processed_count = 0
        if result.get("success") and "data" in result:
            # Process heart rate data
            if "heart_rate" in result["data"]:
                for hr_data in result["data"]["heart_rate"]:
                    try:
                        recorded_at = datetime.fromisoformat(
                            hr_data.get("timestamp").replace('Z', '+00:00')
                        )
                        biometric = Biometric(
                            patient_id=patient_id,
                            heart_rate=hr_data.get("value"),
                            recorded_at=recorded_at,
                            source="healthkit"
                        )
                        db.add(biometric)
                        processed_count += 1
                    except Exception as e:
                        print(f"Error processing heart rate data: {e}")
            
            # Process HRV data
            if "heart_rate_variability" in result["data"]:
                for hrv_data in result["data"]["heart_rate_variability"]:
                    try:
                        recorded_at = datetime.fromisoformat(
                            hrv_data.get("timestamp").replace('Z', '+00:00')
                        )
                        biometric = Biometric(
                            patient_id=patient_id,
                            heart_rate_variability=hrv_data.get("value"),
                            recorded_at=recorded_at,
                            source="healthkit"
                        )
                        db.add(biometric)
                        processed_count += 1
                    except Exception as e:
                        print(f"Error processing HRV data: {e}")
            
            db.commit()
            
            # Trigger analysis if we got data
            if processed_count > 0:
                from .ai_analysis import analyze_patient_data
                analyze_patient_data.delay(patient_id)
            
            return {
                "success": True,
                "synced_count": processed_count,
                "data_types": data_types,
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                },
                "patient_id": patient_id
            }
        else:
            return {"error": "Failed to fetch HealthKit data", "details": result.get("error")}
            
    except Exception as e:
        return {"error": str(e), "traceback": str(e.__traceback__)}
    finally:
        db.close()

def _mock_healthkit_sync(db: Session, patient_id: int) -> Dict[str, Any]:
    """Mock HealthKit sync for testing/demo"""
    try:
        # Generate mock biometric data
        processed_count = 0
        now = datetime.utcnow()
        
        # Create mock heart rate data for last 24 hours
        for hours_ago in range(24):
            for minutes in [0, 15, 30, 45]:  # Every 15 minutes
                recorded_at = now - timedelta(hours=hours_ago, minutes=minutes)
                
                # Simulate normal heart rate (65-85 BPM)
                heart_rate = 65 + ((hours_ago * 60 + minutes) % 20)
                
                # Simulate HRV (40-70 ms)
                hrv = 40 + ((hours_ago * 60 + minutes) % 30)
                
                # Simulate movement (more during daytime)
                movement = 3 if 8 <= recorded_at.hour <= 20 else 1
                
                # Create biometric record
                biometric = Biometric(
                    patient_id=patient_id,
                    heart_rate=float(heart_rate),
                    heart_rate_variability=float(hrv),
                    movement_intensity=float(movement),
                    stress_level=float(3 + ((hours_ago * 60 + minutes) % 5)),
                    recorded_at=recorded_at,
                    source="mock_healthkit"
                )
                db.add(biometric)
                processed_count += 1
        
        # Add sleep data for last night
        sleep_start = (now - timedelta(days=1)).replace(hour=22, minute=0, second=0)
        sleep_end = sleep_start + timedelta(hours=8)
        
        sleep_biometric = Biometric(
            patient_id=patient_id,
            sleep_duration=8.0,
            sleep_quality=85.0,
            recorded_at=sleep_start,
            source="mock_healthkit"
        )
        db.add(sleep_biometric)
        processed_count += 1
        
        db.commit()
        
        # Trigger analysis
        from .ai_analysis import analyze_patient_data
        analyze_patient_data.delay(patient_id)
        
        return {
            "success": True,
            "synced_count": processed_count,
            "data_types": ["heart_rate", "hrv", "sleep", "activity"],
            "period": {
                "start": (now - timedelta(hours=24)).isoformat(),
                "end": now.isoformat()
            },
            "patient_id": patient_id,
            "note": "Mock data generated"
        }
        
    except Exception as e:
        return {"error": f"Mock sync failed: {str(e)}"}

@shared_task(name="cleanup_old_data")
def cleanup_old_data():
    """Clean up old data based on retention policy"""
    db = SessionLocal()
    try:
        retention_date = datetime.utcnow() - timedelta(days=settings.DATA_RETENTION_DAYS)
        
        # Clean up old biometric data
        biometric_deleted = db.query(Biometric).filter(
            Biometric.recorded_at < retention_date
        ).delete(synchronize_session=False)
        
        # Clean up resolved alerts older than 30 days
        alert_retention_date = datetime.utcnow() - timedelta(days=30)
        alert_deleted = db.query(Alert).filter(
            Alert.resolved == True,
            Alert.resolved_at < alert_retention_date
        ).delete(synchronize_session=False)
        
        # Clean up old predictions
        prediction_deleted = db.query(Prediction).filter(
            Prediction.predicted_at < retention_date
        ).delete(synchronize_session=False)
        
        db.commit()
        
        return {
            "success": True,
            "biometric_records_deleted": biometric_deleted,
            "alerts_deleted": alert_deleted,
            "predictions_deleted": prediction_deleted,
            "retention_days": settings.DATA_RETENTION_DAYS,
            "cleanup_date": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        db.rollback()
        return {"error": str(e), "traceback": str(e.__traceback__)}
    finally:
        db.close()

@shared_task(name="send_medication_reminders")
def send_medication_reminders():
    """Send medication reminders to patients"""
    db = SessionLocal()
    try:
        current_time = datetime.utcnow()
        current_hour_minute = current_time.strftime("%H:%M")
        
        # Find medications that need reminders now
        medications = db.query(Medication).filter(
            Medication.is_active == True,
            Medication.reminder_enabled == True
        ).all()
        
        reminders_sent = 0
        
        for medication in medications:
            try:
                # Check reminder times (stored as JSON string)
                if medication.reminder_times:
                    import json
                    try:
                        reminder_times = json.loads(medication.reminder_times)
                        if isinstance(reminder_times, list) and current_hour_minute in reminder_times:
                            # Send reminder
                            import asyncio
                            loop = asyncio.new_event_loop()
                            asyncio.set_event_loop(loop)
                            
                            alert = loop.run_until_complete(
                                alert_service.create_medication_reminder_alert(
                                    db=db,
                                    patient_id=medication.patient_id,
                                    medication_name=medication.name,
                                    dosage=medication.dosage
                                )
                            )
                            
                            if alert:
                                reminders_sent += 1
                    except json.JSONDecodeError:
                        print(f"Invalid JSON in reminder_times for medication {medication.id}")
                    except Exception as e:
                        print(f"Error sending reminder for medication {medication.id}: {e}")
                        
            except Exception as e:
                print(f"Error processing medication {medication.id}: {e}")
                continue
        
        db.commit()
        
        return {
            "success": True,
            "reminders_sent": reminders_sent,
            "total_medications": len(medications),
            "executed_at": current_time.isoformat()
        }
        
    except Exception as e:
        return {"error": str(e), "traceback": str(e.__traceback__)}
    finally:
        db.close()

@shared_task(name="sync_all_active_patients")
def sync_all_active_patients():
    """Sync HealthKit data for all active patients"""
    db = SessionLocal()
    try:
        active_patients = db.query(Patient).filter(
            Patient.is_active == True
        ).all()
        
        results = []
        for patient in active_patients:
            result = sync_healthkit_data.delay(patient.id)
            results.append({
                "patient_id": patient.id,
                "patient_name": patient.full_name,
                "task_id": result.id
            })
        
        return {
            "success": True,
            "patients_count": len(active_patients),
            "tasks_created": results
        }
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@shared_task(name="backup_database")
def backup_database():
    """Create database backup"""
    import os
    from datetime import datetime
    
    try:
        # Create backup directory if it doesn't exist
        backup_dir = "backups"
        os.makedirs(backup_dir, exist_ok=True)
        
        # Generate backup filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(backup_dir, f"epileptic_ai_backup_{timestamp}.json")
        
        # This is a mock backup - in production you would use pg_dump or similar
        backup_data = {
            "backup_timestamp": datetime.utcnow().isoformat(),
            "database": "epileptic_ai",
            "backup_type": "partial_mock",
            "note": "In production, implement actual database backup using pg_dump"
        }
        
        import json
        with open(backup_file, 'w') as f:
            json.dump(backup_data, f, indent=2)
        
        return {
            "success": True,
            "backup_file": backup_file,
            "backup_timestamp": backup_data["backup_timestamp"],
            "size_bytes": os.path.getsize(backup_file) if os.path.exists(backup_file) else 0
        }
        
    except Exception as e:
        return {"error": str(e), "traceback": str(e.__traceback__)}