"""
Emergency Service

Gérer les situations d'urgence en contactant automatiquement les contacts d'urgence
du patient via Twilio (SMS et appels téléphoniques).
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from app.core.config import settings
from app.models.patient import Patient
from app.models.alert import Alert

logger = logging.getLogger(__name__)


class EmergencyService:
    """Service pour gérer les urgences via Twilio"""

    def __init__(self):
        self.twilio_client = None
        self.from_phone = getattr(settings, 'TWILIO_PHONE_NUMBER', None)

        # Initialiser le client Twilio si les credentials sont disponibles
        twilio_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
        twilio_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)

        if twilio_sid and twilio_token:
            try:
                self.twilio_client = Client(twilio_sid, twilio_token)
                logger.info("Twilio client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
                self.twilio_client = None
        else:
            logger.warning(
                "Twilio not configured (TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing). "
                "Emergency notifications will be logged only."
            )

    async def trigger_emergency_alert(
        self,
        db: Session,
        patient_id: int,
        alert_id: int,
        risk_score: float,
        alert_type: str = "SEIZURE_PREDICTION"
    ) -> Dict[str, Any]:
        """
        Déclenche l'alerte d'urgence complète

        Args:
            db: Session de base de données
            patient_id: ID du patient en danger
            alert_id: ID de l'alerte associée
            risk_score: Score de risque (0.0-1.0)
            alert_type: Type d'alerte

        Returns:
            Dictionnaire avec statistiques d'envoi
        """
        # Récupérer le patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise ValueError(f"Patient {patient_id} not found")

        # Récupérer les contacts d'urgence
        contacts = self._parse_emergency_contacts(patient.emergency_contacts)
        if not contacts:
            logger.warning(f"No emergency contacts for patient {patient_id}")
            return {
                "success": False,
                "error": "No emergency contacts configured",
                "sms_sent": 0,
                "sms_failed": 0,
                "calls_made": 0,
                "calls_answered": 0
            }

        # Trier par priorité (1 = plus prioritaire)
        contacts.sort(key=lambda x: x.get("priority", 99))

        # Générer le message d'urgence
        message = self._generate_emergency_message(
            patient, risk_score, alert_type
        )

        # Résultats
        results = {
            "success": True,
            "sms_sent": 0,
            "sms_failed": 0,
            "calls_made": 0,
            "calls_answered": 0,
            "total_contacts_notified": 0,
            "notifications": []
        }

        # Envoi SMS à tous les contacts (en parallèle)
        for contact in contacts:
            notification_method = contact.get("notification_method", "sms")

            if "sms" in notification_method.lower():
                sms_result = await self._send_emergency_sms(contact, message)
                results["notifications"].append(sms_result)

                if sms_result["status"] in ["sent", "delivered", "queued"]:
                    results["sms_sent"] += 1
                    results["total_contacts_notified"] += 1
                else:
                    results["sms_failed"] += 1

        # Appels vocaux en cascade (si risque très critique)
        if risk_score >= 0.80:
            for contact in contacts:
                notification_method = contact.get("notification_method", "sms")

                if "call" in notification_method.lower():
                    call_result = await self._make_emergency_call(
                        contact, patient, alert_id
                    )
                    results["notifications"].append(call_result)
                    results["calls_made"] += 1

                    # Si confirmé, arrêter la cascade
                    if call_result.get("confirmed"):
                        results["calls_answered"] += 1
                        logger.info(
                            f"Emergency call answered by {contact['name']} "
                            f"for patient {patient_id}"
                        )
                        break

        # Mettre à jour l'Alert avec les notifications envoyées
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.notifications_sent = results["notifications"]
            db.commit()

        logger.info(
            f"Emergency alert processed for patient {patient_id}: "
            f"{results['sms_sent']} SMS sent, {results['calls_made']} calls made"
        )

        return results

    async def trigger_emergency(
        self,
        db: Session,
        patient_id: int,
        alert_type: str = "EMERGENCY"
    ) -> Dict[str, Any]:
        """
        Déclenche une urgence manuelle ou automatique simple.
        Crée l'alerte en DB puis notifie les contacts.
        """
        # Créer l'alerte en DB
        alert = Alert(
            patient_id=patient_id,
            alert_type=alert_type,
            severity="high",
            title="Emergency Triggered",
            message=f"Emergency alert triggered ({alert_type})",
            is_active=True,
            risk_score=1.0,
            confidence=1.0,
            created_at=datetime.utcnow()
        )
        
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        # Déclencher les notifications
        return await self.trigger_emergency_alert(
            db=db,
            patient_id=patient_id,
            alert_id=alert.id,
            risk_score=1.0,
            alert_type=alert_type
        )

    async def notify_check_in(
        self,
        db: Session,
        patient_id: int
    ) -> Dict[str, Any]:
        """
        Notifie les contacts que le patient va bien après une alerte.
        """
        # Récupérer le patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise ValueError(f"Patient {patient_id} not found")

        # Récupérer les contacts
        contacts = self._parse_emergency_contacts(patient.emergency_contacts)
        if not contacts:
            return {"success": False, "message": "No contacts to notify"}

        message = f"✅ EpilepticAI: {patient.full_name} confirms they are safe. Alert cancelled."

        total_sent = 0
        for contact in contacts:
            res = await self._send_emergency_sms(contact, message)
            if res["status"] in ["sent", "delivered", "queued", "mock_sent"]:
                total_sent += 1

        return {"success": True, "sms_sent": total_sent}

    async def _send_emergency_sms(
        self,
        contact: Dict[str, Any],
        message: str
    ) -> Dict[str, Any]:
        """Envoie un SMS d'urgence via Twilio"""
        phone = contact.get("phone")
        if not phone:
            return {
                "type": "sms",
                "recipient": "N/A",
                "recipient_name": contact.get("name", "Unknown"),
                "status": "failed",
                "error": "No phone number provided",
                "sent_at": datetime.utcnow().isoformat()
            }

        # Si Twilio n'est pas configuré, mode mock
        if not self.twilio_client or not self.from_phone:
            logger.info(f"[MOCK SMS] to {phone} ({contact.get('name')}): {message[:50]}...")
            return {
                "type": "sms",
                "recipient": phone,
                "recipient_name": contact.get("name", "Unknown"),
                "status": "mock_sent",
                "twilio_sid": f"mock_sms_{datetime.utcnow().timestamp()}",
                "sent_at": datetime.utcnow().isoformat(),
                "error": None
            }

        # Envoi réel via Twilio
        try:
            message_obj = self.twilio_client.messages.create(
                from_=self.from_phone,
                to=phone,
                body=message
            )

            logger.info(
                f"SMS sent to {contact.get('name')} ({phone}), "
                f"SID: {message_obj.sid}, Status: {message_obj.status}"
            )

            return {
                "type": "sms",
                "recipient": phone,
                "recipient_name": contact.get("name", "Unknown"),
                "status": message_obj.status,  # queued, sent, delivered, failed
                "twilio_sid": message_obj.sid,
                "sent_at": datetime.utcnow().isoformat(),
                "error": None
            }

        except TwilioRestException as e:
            logger.error(f"Twilio SMS error for {phone}: {e.msg} (code: {e.code})")
            return {
                "type": "sms",
                "recipient": phone,
                "recipient_name": contact.get("name", "Unknown"),
                "status": "failed",
                "twilio_sid": None,
                "sent_at": datetime.utcnow().isoformat(),
                "error": f"Twilio error {e.code}: {e.msg}"
            }

        except Exception as e:
            logger.error(f"Unexpected error sending SMS to {phone}: {str(e)}")
            return {
                "type": "sms",
                "recipient": phone,
                "recipient_name": contact.get("name", "Unknown"),
                "status": "failed",
                "twilio_sid": None,
                "sent_at": datetime.utcnow().isoformat(),
                "error": str(e)
            }

    async def _make_emergency_call(
        self,
        contact: Dict[str, Any],
        patient: Patient,
        alert_id: int
    ) -> Dict[str, Any]:
        """Passe un appel vocal d'urgence via Twilio"""
        phone = contact.get("phone")
        if not phone:
            return {
                "type": "call",
                "recipient": "N/A",
                "recipient_name": contact.get("name", "Unknown"),
                "status": "failed",
                "error": "No phone number provided",
                "sent_at": datetime.utcnow().isoformat()
            }

        # Si Twilio n'est pas configuré, mode mock
        if not self.twilio_client or not self.from_phone:
            logger.info(
                f"[MOCK CALL] to {phone} ({contact.get('name')}) "
                f"for patient {patient.full_name}"
            )
            return {
                "type": "call",
                "recipient": phone,
                "recipient_name": contact.get("name", "Unknown"),
                "status": "mock_completed",
                "twilio_sid": f"mock_call_{datetime.utcnow().timestamp()}",
                "sent_at": datetime.utcnow().isoformat(),
                "confirmed": False,
                "error": None
            }

        # URL TwiML qui générera le message vocal
        backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000')
        twiml_url = (
            f"{backend_url}/api/v1/emergency/twiml"
            f"?patient_id={patient.id}&alert_id={alert_id}"
        )

        # Envoi réel via Twilio
        try:
            call = self.twilio_client.calls.create(
                from_=self.from_phone,
                to=phone,
                url=twiml_url,
                status_callback=f"{backend_url}/api/v1/emergency/call-status",
                status_callback_event=['completed']
            )

            logger.info(
                f"Call initiated to {contact.get('name')} ({phone}), "
                f"SID: {call.sid}, Status: {call.status}"
            )

            return {
                "type": "call",
                "recipient": phone,
                "recipient_name": contact.get("name", "Unknown"),
                "status": call.status,  # queued, ringing, in-progress, completed
                "twilio_sid": call.sid,
                "sent_at": datetime.utcnow().isoformat(),
                "confirmed": False,  # sera mis à jour par le callback
                "error": None
            }

        except TwilioRestException as e:
            logger.error(f"Twilio call error for {phone}: {e.msg} (code: {e.code})")
            return {
                "type": "call",
                "recipient": phone,
                "recipient_name": contact.get("name", "Unknown"),
                "status": "failed",
                "twilio_sid": None,
                "sent_at": datetime.utcnow().isoformat(),
                "confirmed": False,
                "error": f"Twilio error {e.code}: {e.msg}"
            }

        except Exception as e:
            logger.error(f"Unexpected error calling {phone}: {str(e)}")
            return {
                "type": "call",
                "recipient": phone,
                "recipient_name": contact.get("name", "Unknown"),
                "status": "failed",
                "twilio_sid": None,
                "sent_at": datetime.utcnow().isoformat(),
                "confirmed": False,
                "error": str(e)
            }

    def _generate_emergency_message(
        self,
        patient: Patient,
        risk_score: float,
        alert_type: str
    ) -> str:
        """Generates English emergency message"""

        alert_messages = {
            "SEIZURE_PREDICTION": "SEIZURE RISK DETECTED",
            "FALL_DETECTED": "Fall detected",
            "NO_RESPONSE": "Patient not responding",
            "EMERGENCY": "Medical Emergency"
        }

        alert_description = alert_messages.get(alert_type, "Medical Alert")

        message = f"""🚨 EPILEPSY EMERGENCY

Patient: {patient.full_name}
Alert: {alert_description}
Time: {datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}

IMMEDIATE ACTION REQUIRED:
- Contact the patient at {patient.phone or "unknown number"}
- Go to their location if no response
- Call Emergency Services (911/112) if necessary

EpilepticAI"""

        return message

    def _parse_emergency_contacts(
        self,
        contacts_json: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Parse et valide les contacts d'urgence"""
        if not contacts_json:
            return []

        valid_contacts = []
        for contact in contacts_json:
            # Vérifier que le contact a au moins un numéro de téléphone
            if contact.get("phone"):
                valid_contacts.append(contact)
            else:
                logger.warning(
                    f"Emergency contact {contact.get('name', 'Unknown')} "
                    f"has no phone number, skipping"
                )

        return valid_contacts

    def generate_twiml(
        self,
        patient_name: str,
        risk_score: float,
        patient_phone: Optional[str] = None
    ) -> str:
        """
        Génère le XML TwiML pour le message vocal (sans pourcentage)

        Args:
            patient_name: Nom du patient
            risk_score: Score de risque (0.0-1.0) - non utilisé dans le message
            patient_phone: Numéro du patient (optionnel)

        Returns:
            XML TwiML
        """
        # Formater le numéro de téléphone pour la voix
        phone_spoken = ""
        if patient_phone:
            # Convertir +33612345678 en "zéro six, un deux, trois quatre, cinq six, sept huit"
            digits = ''.join(filter(str.isdigit, patient_phone))
            if digits.startswith('33'):
                digits = '0' + digits[2:]  # +33612... → 0612...
            phone_spoken = ' '.join(digits)

        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="en-US" voice="alice">
        Epilepsy Emergency. EpilepticAI.
        Alert for patient {patient_name}.
        Seizure risk detected.
        {'Please contact the patient immediately at ' + phone_spoken + '.' if phone_spoken else 'Please contact the patient immediately.'}
        Press 1 to confirm receipt of this alert.
    </Say>
    <Gather numDigits="1" action="/api/v1/emergency/confirm" method="POST" timeout="10">
        <Say language="en-US">Press 1 now.</Say>
    </Gather>
    <Say language="en-US">
        No confirmation received. Calling next contact.
    </Say>
</Response>"""

        return twiml


# Instance singleton pour réutilisation
_emergency_service_instance = None

def get_emergency_service() -> EmergencyService:
    """Récupère l'instance singleton du service d'urgence"""
    global _emergency_service_instance
    if _emergency_service_instance is None:
        _emergency_service_instance = EmergencyService()
    return _emergency_service_instance
