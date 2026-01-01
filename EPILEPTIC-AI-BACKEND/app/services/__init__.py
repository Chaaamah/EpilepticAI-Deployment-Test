"""
Services Module

Expose tous les services pour faciliter les imports.
"""

from .ai_prediction import (
    AIPredictionService,
    get_prediction_service
)
from .alert_service import (
    AlertService,
    get_alert_service
)
from .notification_service import (
    NotificationService,
    get_notification_service
)
from .emergency_service import (
    EmergencyService,
    get_emergency_service
)

# Conserver compatibilité avec ancien code
PredictionService = AIPredictionService

__all__ = [
    # Nouvelles classes
    'AIPredictionService',
    'AlertService',
    'NotificationService',
    'EmergencyService',

    # Fonctions singleton
    'get_prediction_service',
    'get_alert_service',
    'get_notification_service',
    'get_emergency_service',

    # Compatibilité
    'PredictionService',
]
