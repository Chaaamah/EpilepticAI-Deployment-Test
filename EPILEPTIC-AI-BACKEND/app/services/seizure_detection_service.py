"""
Seizure Detection Service

Service pour gérer le flux complet de détection de crise:
1. Récupération des données biométriques depuis HealthKit
2. Envoi au modèle AI pour prédiction
3. Si risque détecté: démarrer countdown 30 secondes
4. Si pas de réponse: envoi automatique SMS aux contacts d'urgence
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.services.healthkit_service import HealthKitService
from app.services.ai_prediction import get_prediction_service
from app.services.emergency_service import get_emergency_service
from app.models.patient import Patient
from app.models.biometric import Biometric
from app.models.alert import Alert
from app.core.config import settings

logger = logging.getLogger(__name__)


class SeizureDetectionService:
    """Service de détection et gestion des crises"""

    def __init__(self):
        self.healthkit_service = HealthKitService()
        self.ai_service = get_prediction_service()
        self.emergency_service = get_emergency_service()
        self.countdown_duration = 30  # 30 secondes
        self.active_countdowns = {}  # patient_id -> countdown_task

    async def process_biometric_data(
        self,
        db: Session,
        patient_id: int,
        biometric_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Traite les données biométriques reçues depuis HealthKit/Apple Watch

        Args:
            db: Session DB
            patient_id: ID du patient
            biometric_data: Données biométriques au format JSON

        Returns:
            Résultat du traitement avec statut de risque
        """
        logger.info(f"Processing biometric data for patient {patient_id}")

        # Étape 1: Sauvegarder les données biométriques
        biometric = Biometric(
            patient_id=patient_id,
            heart_rate=biometric_data.get("heart_rate"),
            heart_rate_variability=biometric_data.get("heart_rate_variability"),
            accelerometer_x=biometric_data.get("accelerometer_x"),
            accelerometer_y=biometric_data.get("accelerometer_y"),
            accelerometer_z=biometric_data.get("accelerometer_z"),
            movement_intensity=biometric_data.get("movement_intensity"),
            stress_level=biometric_data.get("stress_level"),
            sleep_duration=biometric_data.get("sleep_duration"),
            sleep_quality=biometric_data.get("sleep_quality"),
            source=biometric_data.get("source", "healthkit"),
            recorded_at=datetime.utcnow()
        )

        db.add(biometric)
        db.commit()
        db.refresh(biometric)

        # Étape 2: Faire une prédiction avec le modèle AI
        try:
            prediction = await self.ai_service.predict_seizure_risk(
                db=db,
                patient_id=patient_id,
                window_minutes=30
            )

            logger.info(
                f"Prediction for patient {patient_id}: "
                f"risk_score={prediction.risk_score:.2f}, "
                f"confidence={prediction.confidence:.2f}"
            )

            # Étape 3: Vérifier si risque élevé
            should_alert = self.ai_service.should_trigger_alert(
                prediction.risk_score,
                prediction.confidence
            )

            logger.info(
                f"🔍 Alert check: risk_score={prediction.risk_score:.6f}, "
                f"confidence={prediction.confidence:.2f}, should_alert={should_alert}"
            )

            if should_alert:
                # Démarrer le countdown 30 secondes
                logger.warning(
                    f"⚠️ HIGH RISK detected for patient {patient_id}! "
                    f"Starting 30-second countdown..."
                )

                # Créer l'alerte
                alert = Alert(
                    patient_id=patient_id,
                    prediction_id=prediction.id,
                    alert_type="SEIZURE_PREDICTION",
                    severity="high",
                    title="Risque de crise détecté",
                    message=f"Risque de crise élevé détecté (score: {prediction.risk_score:.0%})",
                    risk_score=prediction.risk_score,
                    confidence=prediction.confidence,
                    is_active=True,
                    requires_user_confirmation=True,
                    confirmation_deadline=datetime.utcnow() + timedelta(seconds=self.countdown_duration),
                    created_at=datetime.utcnow()
                )

                db.add(alert)
                db.commit()
                db.refresh(alert)

                # Démarrer le countdown asynchrone
                asyncio.create_task(
                    self._start_countdown(db, patient_id, alert.id, prediction.risk_score)
                )

                return {
                    "status": "alert_triggered",
                    "alert_id": alert.id,
                    "prediction_id": prediction.id,
                    "risk_score": prediction.risk_score,
                    "confidence": prediction.confidence,
                    "countdown_seconds": self.countdown_duration,
                    "message": "Risque de crise détecté! Veuillez confirmer que vous allez bien.",
                    "biometric_saved": True
                }
            else:
                return {
                    "status": "ok",
                    "prediction_id": prediction.id,
                    "risk_score": prediction.risk_score,
                    "confidence": prediction.confidence,
                    "message": "Données biométriques normales",
                    "biometric_saved": True
                }

        except ValueError as e:
            logger.warning(f"Insufficient data for prediction: {e}")
            return {
                "status": "insufficient_data",
                "message": str(e),
                "biometric_saved": True
            }
        except Exception as e:
            logger.error(f"Error processing biometric data: {e}", exc_info=True)
            raise

    async def _start_countdown(
        self,
        db: Session,
        patient_id: int,
        alert_id: int,
        risk_score: float
    ):
        """
        Démarre un countdown de 30 secondes
        Si pas de confirmation: envoie SMS automatiquement
        """
        logger.info(f"Starting {self.countdown_duration}s countdown for patient {patient_id}")

        # Sauvegarder la tâche de countdown
        self.active_countdowns[patient_id] = {
            "alert_id": alert_id,
            "started_at": datetime.utcnow(),
            "risk_score": risk_score
        }

        # Attendre 30 secondes
        await asyncio.sleep(self.countdown_duration)

        # Vérifier si l'alerte a été confirmée
        alert = db.query(Alert).filter(Alert.id == alert_id).first()

        if not alert:
            logger.error(f"Alert {alert_id} not found after countdown")
            return

        if alert.user_confirmed:
            logger.info(
                f"✅ Patient {patient_id} confirmed OK - "
                f"Cancelling emergency notifications"
            )
            alert.is_active = False
            alert.resolved_at = datetime.utcnow()
            db.commit()

            # Retirer du tracking
            if patient_id in self.active_countdowns:
                del self.active_countdowns[patient_id]

            return

        # Pas de confirmation -> Déclencher l'urgence
        logger.warning(
            f"⚠️ NO RESPONSE from patient {patient_id} after {self.countdown_duration}s! "
            f"Triggering emergency notifications..."
        )

        try:
            # Envoyer les SMS aux contacts d'urgence
            result = await self.emergency_service.trigger_emergency_alert(
                db=db,
                patient_id=patient_id,
                alert_id=alert_id,
                risk_score=risk_score,
                alert_type="SEIZURE_PREDICTION"
            )

            # Mettre à jour l'alerte
            alert.emergency_notified = True
            alert.emergency_notified_at = datetime.utcnow()
            alert.notifications_sent = result.get("notifications", [])
            db.commit()

            logger.info(
                f"Emergency notifications sent for patient {patient_id}: "
                f"{result.get('sms_sent', 0)} SMS, {result.get('calls_made', 0)} calls"
            )

        except Exception as e:
            logger.error(f"Error sending emergency notifications: {e}", exc_info=True)
            alert.error_message = str(e)
            db.commit()

        finally:
            # Retirer du tracking
            if patient_id in self.active_countdowns:
                del self.active_countdowns[patient_id]

    async def confirm_patient_safety(
        self,
        db: Session,
        patient_id: int,
        alert_id: int
    ) -> Dict[str, Any]:
        """
        Le patient confirme qu'il va bien (annule le countdown)

        Args:
            db: Session DB
            patient_id: ID du patient
            alert_id: ID de l'alerte à confirmer

        Returns:
            Résultat de la confirmation
        """
        alert = db.query(Alert).filter(
            Alert.id == alert_id,
            Alert.patient_id == patient_id
        ).first()

        if not alert:
            raise ValueError(f"Alert {alert_id} not found for patient {patient_id}")

        # Marquer comme confirmé
        alert.user_confirmed = True
        alert.user_confirmed_at = datetime.utcnow()
        alert.is_active = False
        alert.resolved_at = datetime.utcnow()

        db.commit()

        logger.info(f"✅ Patient {patient_id} confirmed safety for alert {alert_id}")

        # Retirer du tracking des countdowns
        if patient_id in self.active_countdowns:
            del self.active_countdowns[patient_id]

        return {
            "status": "confirmed",
            "message": "Merci de confirmer. Les contacts d'urgence ne seront pas notifiés.",
            "alert_id": alert_id,
            "confirmed_at": alert.user_confirmed_at.isoformat()
        }

    async def get_active_countdown(
        self,
        patient_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Récupère le countdown actif pour un patient

        Returns:
            Info du countdown ou None
        """
        if patient_id not in self.active_countdowns:
            return None

        countdown_info = self.active_countdowns[patient_id]
        elapsed = (datetime.utcnow() - countdown_info["started_at"]).total_seconds()
        remaining = max(0, self.countdown_duration - elapsed)

        return {
            "alert_id": countdown_info["alert_id"],
            "risk_score": countdown_info["risk_score"],
            "countdown_seconds": self.countdown_duration,
            "elapsed_seconds": int(elapsed),
            "remaining_seconds": int(remaining),
            "started_at": countdown_info["started_at"].isoformat()
        }

    async def fetch_healthkit_data_and_analyze(
        self,
        db: Session,
        patient_id: int,
        user_token: str
    ) -> Dict[str, Any]:
        """
        Récupère les données depuis HealthKit et lance l'analyse

        Args:
            db: Session DB
            patient_id: ID du patient
            user_token: Token d'autorisation HealthKit

        Returns:
            Résultat de l'analyse
        """
        # Récupérer données des dernières 24h
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(hours=24)

        healthkit_data = await self.healthkit_service.fetch_health_data(
            user_token=user_token,
            data_types=["heart_rate", "heart_rate_variability", "activity", "sleep"],
            start_date=start_date,
            end_date=end_date
        )

        if not healthkit_data.get("success"):
            raise ValueError("Failed to fetch HealthKit data")

        # Convertir en format biométrique et analyser
        # Prendre la dernière mesure disponible
        data = healthkit_data.get("data", {})

        latest_biometric = {
            "heart_rate": data.get("heart_rate", [{}])[-1].get("value") if data.get("heart_rate") else None,
            "heart_rate_variability": data.get("heart_rate_variability", [{}])[-1].get("value") if data.get("heart_rate_variability") else None,
            "source": "healthkit",
        }

        # Analyser avec le modèle AI
        result = await self.process_biometric_data(
            db=db,
            patient_id=patient_id,
            biometric_data=latest_biometric
        )

        return result


# Instance singleton
_seizure_detection_service_instance = None

def get_seizure_detection_service() -> SeizureDetectionService:
    """Récupère l'instance singleton du service"""
    global _seizure_detection_service_instance
    if _seizure_detection_service_instance is None:
        _seizure_detection_service_instance = SeizureDetectionService()
    return _seizure_detection_service_instance
