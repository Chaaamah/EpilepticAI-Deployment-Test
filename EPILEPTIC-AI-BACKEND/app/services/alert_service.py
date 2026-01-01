"""
Alert Service

Orchestrer la création et la distribution des alertes selon leur sévérité.
Fait le lien entre les prédictions IA et les systèmes de notification.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.alert import Alert
from app.models.patient import Patient
from app.models.prediction import Prediction
from app.services.emergency_service import get_emergency_service
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class AlertService:
    """Service d'orchestration des alertes"""

    def __init__(self):
        self.emergency_service = get_emergency_service()
        self.notification_service = NotificationService()

    async def create_alert_from_prediction(
        self,
        db: Session,
        prediction: Prediction,
        patient: Patient
    ) -> Optional[Alert]:
        """
        Crée et dispatche une alerte depuis une prédiction

        Args:
            db: Session de base de données
            prediction: Objet Prediction
            patient: Objet Patient

        Returns:
            Alert créée ou None si aucune alerte n'est nécessaire
        """
        # Déterminer la sévérité
        severity = self._determine_severity(
            prediction.risk_score,
            prediction.confidence
        )

        # Vérifier si on doit créer une alerte
        if severity == "low":
            logger.info(
                f"Risk score {prediction.risk_score:.2f} is LOW, no alert created"
            )
            return None

        # Vérifier le cooldown (anti-spam)
        if await self._check_cooldown(db, patient.id, "prediction"):
            logger.info(
                f"Alert cooldown active for patient {patient.id}, skipping alert"
            )
            return None

        # Créer l'alerte
        alert = Alert(
            patient_id=patient.id,
            alert_type="prediction",
            severity=severity,
            title=self._get_title(severity),
            message=self._get_message(severity, prediction.risk_score),
            data={
                "prediction_id": prediction.id,
                "risk_score": prediction.risk_score,
                "confidence": prediction.confidence,
                "recommended_actions": self._get_recommendations(severity)
            }
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        logger.info(
            f"Alert created: ID={alert.id}, Type={alert.alert_type}, "
            f"Severity={severity}, Patient={patient.id}"
        )

        # Mettre à jour la prédiction
        prediction.alert_generated = True
        prediction.alert_id = alert.id
        db.commit()

        # Dispatcher l'alerte selon sa sévérité
        await self._dispatch_alert(db, alert, patient)

        return alert

    async def create_alert(
        self,
        db: Session,
        patient_id: int,
        alert_type: str,
        severity: str,
        title: str,
        message: str,
        data: Dict[str, Any] = None
    ) -> Alert:
        """
        Crée une alerte manuelle (générique)

        Args:
            db: Session de base de données
            patient_id: ID du patient
            alert_type: Type d'alerte
            severity: Sévérité (low/medium/high/critical)
            title: Titre de l'alerte
            message: Message de l'alerte
            data: Données additionnelles

        Returns:
            Alert créée
        """
        alert = Alert(
            patient_id=patient_id,
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            data=data,
            is_active=True,
            triggered_at=datetime.utcnow()
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        logger.info(
            f"Manual alert created: ID={alert.id}, Type={alert_type}, "
            f"Severity={severity}"
        )

        # Dispatcher
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if patient:
            await self._dispatch_alert(db, alert, patient)

        return alert

    def _determine_severity(
        self,
        risk_score: float,
        confidence: float
    ) -> str:
        """
        Détermine la sévérité de l'alerte

        Args:
            risk_score: Score de risque (0.0-1.0)
            confidence: Niveau de confiance (0.0-1.0)

        Returns:
            "low" | "medium" | "high" | "critical"
        """
        # Prendre en compte à la fois risk_score ET confidence
        if risk_score >= 0.80 and confidence >= 0.60:
            return "critical"
        elif risk_score >= 0.60 and confidence >= 0.60:
            return "high"
        elif risk_score >= 0.40:
            return "medium"
        else:
            return "low"

    async def _check_cooldown(
        self,
        db: Session,
        patient_id: int,
        alert_type: str,
        cooldown_minutes: int = 15
    ) -> bool:
        """
        Vérifie si une alerte récente existe (cooldown anti-spam)

        Args:
            db: Session de base de données
            patient_id: ID du patient
            alert_type: Type d'alerte à vérifier
            cooldown_minutes: Durée du cooldown en minutes

        Returns:
            True si une alerte récente existe (cooldown actif)
        """
        cutoff = datetime.utcnow() - timedelta(minutes=cooldown_minutes)

        recent_alert = db.query(Alert).filter(
            Alert.patient_id == patient_id,
            Alert.alert_type == alert_type,
            Alert.triggered_at > cutoff
        ).first()

        return recent_alert is not None

    async def _dispatch_alert(
        self,
        db: Session,
        alert: Alert,
        patient: Patient
    ):
        """
        Dispatche l'alerte selon la sévérité

        CRITICAL (>80%):
          - Push notification au patient
          - SMS + Appels aux contacts d'urgence (via Emergency Service)
          - Alerte au docteur assigné
          - WebSocket temps réel

        HIGH (60-80%):
          - Push notification au patient
          - SMS aux contacts d'urgence
          - WebSocket temps réel

        MEDIUM (40-60%):
          - Push notification au patient
          - WebSocket temps réel

        LOW (<40%):
          - Log uniquement (pas de dispatch)
        """
        logger.info(f"Dispatching alert {alert.id} with severity={alert.severity}")

        # Extraire risk_score depuis data si disponible
        risk_score = alert.data.get("risk_score", 0.0) if alert.data else 0.0

        if alert.severity == "critical":
            logger.warning(
                f"CRITICAL alert for patient {patient.id}: {alert.title}"
            )

            # 1. Emergency Service → SMS + Calls
            try:
                emergency_result = await self.emergency_service.trigger_emergency_alert(
                    db=db,
                    patient_id=patient.id,
                    alert_id=alert.id,
                    risk_score=risk_score,
                    alert_type="SEIZURE_PREDICTION"
                )
                logger.info(
                    f"Emergency alert sent: {emergency_result['sms_sent']} SMS, "
                    f"{emergency_result['calls_made']} calls"
                )
            except Exception as e:
                logger.error(f"Failed to trigger emergency alert: {e}")

            # 2. Push notification au patient
            try:
                await self.notification_service.send_push_notification(
                    user_id=patient.id,
                    title=alert.title,
                    body=alert.message,
                    data={"alert_id": alert.id, "severity": alert.severity},
                    priority="high"
                )
            except Exception as e:
                logger.error(f"Failed to send push notification: {e}")

            # 3. WebSocket (TODO: intégrer WebSocket Manager)
            # await self.ws_manager.send_alert_to_patient(patient.id, alert)

        elif alert.severity == "high":
            logger.warning(
                f"HIGH alert for patient {patient.id}: {alert.title}"
            )

            # 1. SMS uniquement (pas d'appels)
            try:
                emergency_result = await self.emergency_service.trigger_emergency_alert(
                    db=db,
                    patient_id=patient.id,
                    alert_id=alert.id,
                    risk_score=risk_score,
                    alert_type="SEIZURE_PREDICTION"
                )
                logger.info(f"SMS sent: {emergency_result['sms_sent']}")
            except Exception as e:
                logger.error(f"Failed to send SMS alert: {e}")

            # 2. Push notification
            try:
                await self.notification_service.send_push_notification(
                    user_id=patient.id,
                    title=alert.title,
                    body=alert.message,
                    data={"alert_id": alert.id, "severity": alert.severity},
                    priority="normal"
                )
            except Exception as e:
                logger.error(f"Failed to send push notification: {e}")

        elif alert.severity == "medium":
            logger.info(
                f"MEDIUM alert for patient {patient.id}: {alert.title}"
            )

            # Push notification uniquement
            try:
                await self.notification_service.send_push_notification(
                    user_id=patient.id,
                    title=alert.title,
                    body=alert.message,
                    data={"alert_id": alert.id, "severity": alert.severity},
                    priority="normal"
                )
            except Exception as e:
                logger.error(f"Failed to send push notification: {e}")

        else:
            # LOW - pas de notification
            logger.debug(f"LOW alert {alert.id}, no notifications sent")

    def _get_title(self, severity: str) -> str:
        """Génère le titre de l'alerte selon la sévérité"""
        titles = {
            "critical": "⚠️ Risque Critique de Crise",
            "high": "⚠️ Risque Élevé de Crise",
            "medium": "ℹ️ Risque Modéré de Crise",
            "low": "ℹ️ Surveillance Normale"
        }
        return titles.get(severity, "Alerte")

    def _get_message(self, severity: str, risk_score: float) -> str:
        """Génère le message de l'alerte"""
        risk_pct = int(risk_score * 100)

        messages = {
            "critical": (
                f"Un risque critique de crise a été détecté ({risk_pct}%). "
                f"Prenez vos précautions immédiatement et suivez les recommandations."
            ),
            "high": (
                f"Un risque élevé de crise a été détecté ({risk_pct}%). "
                f"Soyez vigilant et préparez-vous."
            ),
            "medium": (
                f"Un risque modéré de crise a été détecté ({risk_pct}%). "
                f"Restez attentif à vos symptômes."
            ),
            "low": (
                f"Niveau de risque faible ({risk_pct}%). "
                f"Continuez votre surveillance habituelle."
            )
        }
        return messages.get(severity, f"Risque détecté: {risk_pct}%")

    def _get_recommendations(self, severity: str) -> List[str]:
        """Génère les actions recommandées selon la sévérité"""
        if severity == "critical":
            return [
                "Prendre votre médicament d'urgence IMMÉDIATEMENT",
                "Vous asseoir ou vous allonger dans un endroit sûr",
                "Éviter les escaliers et zones dangereuses",
                "Prévenir quelqu'un autour de vous",
                "Vos contacts d'urgence ont été alertés"
            ]
        elif severity == "high":
            return [
                "Prendre votre médicament préventif",
                "Éviter les activités à risque (conduite, sports dangereux)",
                "Se reposer dans un endroit calme",
                "Surveiller vos symptômes de près",
                "Prévenir un proche de votre état"
            ]
        elif severity == "medium":
            return [
                "Continuer votre surveillance habituelle",
                "Éviter les facteurs déclencheurs connus",
                "Assurer une bonne hydratation",
                "Éviter le stress et le manque de sommeil"
            ]
        else:
            return [
                "Continuer vos activités normales",
                "Maintenir une bonne hygiène de vie"
            ]

    async def create_fall_detection_alert(
        self,
        db: Session,
        patient_id: int,
        location: Optional[str] = None
    ) -> Alert:
        """Crée une alerte de détection de chute"""
        message = "Possible chute détectée"
        if location:
            message += f" à {location}"

        return await self.create_alert(
            db=db,
            patient_id=patient_id,
            alert_type="fall_detection",
            severity="critical",
            title="🚨 Chute Détectée",
            message=message,
            data={
                "detected_at": datetime.utcnow().isoformat(),
                "location": location,
                "emergency": True
            }
        )

    async def create_medication_reminder_alert(
        self,
        db: Session,
        patient_id: int,
        medication_name: str,
        dosage: str
    ) -> Alert:
        """Crée une alerte de rappel de médicament"""
        return await self.create_alert(
            db=db,
            patient_id=patient_id,
            alert_type="medication_reminder",
            severity="low",
            title="💊 Rappel de Médicament",
            message=f"Il est temps de prendre votre {medication_name} ({dosage})",
            data={
                "medication_name": medication_name,
                "dosage": dosage,
                "reminder_time": datetime.utcnow().isoformat()
            }
        )

    async def acknowledge_alert(
        self,
        db: Session,
        alert_id: int,
        acknowledged_by: str
    ) -> Alert:
        """Marque une alerte comme acquittée"""
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise ValueError(f"Alert {alert_id} not found")

        alert.acknowledged = True
        alert.acknowledged_by = acknowledged_by
        alert.acknowledged_at = datetime.utcnow()

        db.commit()
        db.refresh(alert)

        logger.info(
            f"Alert {alert_id} acknowledged by {acknowledged_by}"
        )

        return alert

    async def resolve_alert(
        self,
        db: Session,
        alert_id: int,
        resolved_by: str,
        resolution_notes: Optional[str] = None
    ) -> Alert:
        """Marque une alerte comme résolue"""
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise ValueError(f"Alert {alert_id} not found")

        alert.resolved = True
        alert.resolved_by = resolved_by
        alert.resolved_at = datetime.utcnow()
        alert.resolution_notes = resolution_notes
        alert.is_active = False

        db.commit()
        db.refresh(alert)

        logger.info(
            f"Alert {alert_id} resolved by {resolved_by}"
        )

        return alert


# Instance singleton pour réutilisation
_alert_service_instance = None

def get_alert_service() -> AlertService:
    """Récupère l'instance singleton du service d'alertes"""
    global _alert_service_instance
    if _alert_service_instance is None:
        _alert_service_instance = AlertService()
    return _alert_service_instance
