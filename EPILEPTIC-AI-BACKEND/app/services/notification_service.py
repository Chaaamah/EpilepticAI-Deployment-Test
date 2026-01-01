"""
Notification Service

Gérer l'envoi de notifications push (Firebase/APNS) et SMS non-urgents.
Différent du Emergency Service qui gère les urgences critiques.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationService:
    """Service pour notifications push et SMS non-urgents"""

    def __init__(self):
        self.firebase_app = None
        self._init_firebase()

    def _init_firebase(self):
        """Initialise Firebase Admin SDK si configuré"""
        firebase_credentials = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)

        if firebase_credentials:
            try:
                import firebase_admin
                from firebase_admin import credentials

                # Éviter la double initialisation
                if not firebase_admin._apps:
                    cred = credentials.Certificate(firebase_credentials)
                    self.firebase_app = firebase_admin.initialize_app(cred)
                    logger.info("Firebase Admin SDK initialized successfully")
                else:
                    self.firebase_app = firebase_admin.get_app()
                    logger.info("Firebase Admin SDK already initialized")

            except ImportError:
                logger.warning(
                    "firebase-admin package not installed. "
                    "Install with: pip install firebase-admin"
                )
                self.firebase_app = None
            except Exception as e:
                logger.error(f"Failed to initialize Firebase: {e}")
                self.firebase_app = None
        else:
            logger.warning(
                "Firebase not configured (FIREBASE_CREDENTIALS_PATH missing). "
                "Push notifications will be logged only."
            )

    async def send_push_notification(
        self,
        user_id: int,
        title: str,
        body: str,
        data: Dict[str, Any] = None,
        priority: str = "normal"
    ) -> Dict[str, Any]:
        """
        Envoie une notification push via Firebase Cloud Messaging

        Args:
            user_id: ID de l'utilisateur (patient/doctor)
            title: Titre de la notification
            body: Corps du message
            data: Données additionnelles (optionnel)
            priority: "normal" ou "high"

        Returns:
            Résultat de l'envoi
        """
        # Récupérer les tokens FCM/APNS de l'utilisateur
        # TODO: Implémenter stockage des device tokens en DB
        tokens = await self._get_device_tokens(user_id)

        if not tokens:
            logger.warning(f"No device tokens found for user {user_id}")
            return {
                "success": False,
                "error": "No device tokens registered",
                "user_id": user_id
            }

        # Si Firebase n'est pas configuré, mode mock
        if not self.firebase_app:
            logger.info(
                f"[MOCK PUSH] to user {user_id}: {title} - {body[:50]}..."
            )
            return {
                "success": True,
                "mode": "mock",
                "user_id": user_id,
                "tokens_count": len(tokens),
                "message": f"{title}: {body}"
            }

        # Envoi réel via Firebase
        try:
            from firebase_admin import messaging

            # Convertir data en strings (Firebase n'accepte que des strings)
            str_data = {}
            if data:
                str_data = {k: str(v) for k, v in data.items()}

            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data=str_data,
                tokens=tokens,
                android=messaging.AndroidConfig(
                    priority='high' if priority == "high" else 'normal',
                    notification=messaging.AndroidNotification(
                        sound='default',
                        channel_id='epileptic_ai_alerts'
                    )
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound='default',
                            badge=1,
                            content_available=True
                        )
                    )
                )
            )

            response = messaging.send_multicast(message)

            logger.info(
                f"Push notification sent to user {user_id}: "
                f"{response.success_count}/{len(tokens)} successful"
            )

            return {
                "success": True,
                "user_id": user_id,
                "tokens_count": len(tokens),
                "success_count": response.success_count,
                "failure_count": response.failure_count,
                "responses": [
                    {
                        "success": r.success,
                        "message_id": r.message_id if r.success else None,
                        "error": str(r.exception) if not r.success else None
                    }
                    for r in response.responses
                ]
            }

        except Exception as e:
            logger.error(f"Failed to send push notification: {e}")
            return {
                "success": False,
                "error": str(e),
                "user_id": user_id
            }

    async def _get_device_tokens(self, user_id: int) -> List[str]:
        """
        Récupère les device tokens (FCM/APNS) de l'utilisateur

        TODO: Implémenter le stockage des tokens en base de données
        Pour l'instant, retourne une liste vide (mode mock)

        Args:
            user_id: ID de l'utilisateur

        Returns:
            Liste des tokens FCM/APNS
        """
        # Dans une vraie implémentation :
        # tokens = db.query(DeviceToken).filter(
        #     DeviceToken.user_id == user_id,
        #     DeviceToken.is_active == True
        # ).all()
        # return [token.token for token in tokens]

        # Mode mock pour développement
        return [f"mock_token_{user_id}_device1"]

    async def register_device_token(
        self,
        user_id: int,
        token: str,
        platform: str  # "ios" | "android"
    ) -> bool:
        """
        Enregistre un token d'appareil pour notifications push

        TODO: Implémenter le stockage en DB

        Args:
            user_id: ID de l'utilisateur
            token: Token FCM (Android) ou APNS (iOS)
            platform: "ios" ou "android"

        Returns:
            True si succès
        """
        logger.info(f"Registering device token for user {user_id}, platform={platform}")

        # TODO: Sauvegarder en base
        # device_token = DeviceToken(
        #     user_id=user_id,
        #     token=token,
        #     platform=platform,
        #     is_active=True,
        #     registered_at=datetime.utcnow()
        # )
        # db.add(device_token)
        # db.commit()

        logger.info(f"[MOCK] Device token registered for user {user_id}")
        return True

    async def send_medication_reminder(
        self,
        patient_id: int,
        medication_name: str,
        dosage: str,
        time: str
    ) -> Dict[str, Any]:
        """
        Envoie un rappel de médicament via push notification

        Args:
            patient_id: ID du patient
            medication_name: Nom du médicament
            dosage: Dosage
            time: Heure de prise

        Returns:
            Résultat de l'envoi
        """
        return await self.send_push_notification(
            user_id=patient_id,
            title="💊 Rappel de Médicament",
            body=f"Il est temps de prendre {medication_name} ({dosage}) à {time}",
            data={
                "type": "medication_reminder",
                "medication_name": medication_name,
                "dosage": dosage,
                "time": time
            },
            priority="normal"
        )

    async def send_appointment_reminder(
        self,
        patient_id: int,
        appointment_date: str,
        doctor_name: str
    ) -> Dict[str, Any]:
        """Envoie un rappel de rendez-vous"""
        return await self.send_push_notification(
            user_id=patient_id,
            title="📅 Rappel de Rendez-vous",
            body=f"Rendez-vous avec {doctor_name} le {appointment_date}",
            data={
                "type": "appointment_reminder",
                "appointment_date": appointment_date,
                "doctor_name": doctor_name
            },
            priority="normal"
        )

    async def send_wellness_check(
        self,
        patient_id: int,
        message: str
    ) -> Dict[str, Any]:
        """Envoie une notification de suivi bien-être"""
        return await self.send_push_notification(
            user_id=patient_id,
            title="💚 Comment allez-vous ?",
            body=message,
            data={
                "type": "wellness_check"
            },
            priority="normal"
        )

    async def send_to_patient(
        self,
        patient: Any,
        alert: Any,
        method: str = "push"
    ) -> bool:
        """
        Envoie une notification à un patient (compatibilité ancienne API)

        Args:
            patient: Objet Patient
            alert: Objet Alert
            method: Méthode ("push", "sms", "email")

        Returns:
            True si succès
        """
        try:
            if method == "push":
                result = await self.send_push_notification(
                    user_id=patient.id,
                    title=alert.title,
                    body=alert.message,
                    data={"alert_id": alert.id, "severity": alert.severity},
                    priority="high" if alert.severity == "critical" else "normal"
                )
                return result.get("success", False)

            elif method == "sms":
                # SMS non-urgents (différent du Emergency Service)
                logger.info(
                    f"[SMS] to patient {patient.id} ({patient.phone}): {alert.message[:50]}..."
                )
                return True

            elif method == "email":
                logger.info(
                    f"[EMAIL] to patient {patient.id} ({patient.email}): {alert.title}"
                )
                return True

            return False

        except Exception as e:
            logger.error(f"Error sending notification to patient: {e}")
            return False

    async def send_to_emergency_contact(
        self,
        contact: Dict[str, Any],
        alert: Any,
        patient: Any
    ) -> bool:
        """
        DEPRECATED: Utilisez EmergencyService.trigger_emergency_alert à la place

        Cette méthode est conservée pour compatibilité mais devrait être évitée
        pour les urgences critiques.
        """
        logger.warning(
            "send_to_emergency_contact is deprecated. "
            "Use EmergencyService.trigger_emergency_alert for emergencies."
        )

        contact_name = contact.get("name", "Unknown")
        logger.info(
            f"[NOTIFICATION] to emergency contact {contact_name}: {alert.title}"
        )

        return True


# Instance singleton pour réutilisation
_notification_service_instance = None

def get_notification_service() -> NotificationService:
    """Récupère l'instance singleton du service de notifications"""
    global _notification_service_instance
    if _notification_service_instance is None:
        _notification_service_instance = NotificationService()
    return _notification_service_instance
