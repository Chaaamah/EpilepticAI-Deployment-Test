"""
AI Prediction Service

Charge et utilise un modèle IA LOCAL (Keras/TensorFlow) pour analyser
les données biométriques et prédire les risques de crise épileptique.

FLUX TEMPS RÉEL (toutes les 5 minutes):
1. Montre connectée envoie nouvelles données biométriques
2. Données stockées automatiquement dans DB
3. Ce service est déclenché automatiquement
4. Analyse FENÊTRE GLISSANTE des 30 dernières minutes (6 points)
5. Détecte tendances et évolutions (hausse/baisse HR, HRV, etc.)
6. Prédit le risque avec le modèle Keras
7. Envoie le résultat à Alert Service si risque détecté
"""

import numpy as np
import logging
import joblib
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.biometric import Biometric
from app.models.prediction import Prediction
from app.models.patient import Patient

logger = logging.getLogger(__name__)


class AIPredictionService:
    """Service pour faire des prédictions avec un modèle IA local"""

    def __init__(self):
        self.model = None
        self.scaler = None
        self.model_version = "unknown"
        self._load_model()

    def _load_model(self):
        """Charge le modèle Keras et le scaler depuis le disque"""
        try:
            # Chemin du dossier models
            models_dir = Path(__file__).parent.parent.parent / "models"

            # Charger le scaler
            scaler_path = models_dir / "scaler.pkl"
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                logger.info(f"✅ Scaler chargé depuis {scaler_path}")
            else:
                logger.warning(f"⚠️ Scaler non trouvé à {scaler_path}")
                self.scaler = None

            # Charger le modèle Keras
            model_path = models_dir / "seizure.keras"
            if model_path.exists():
                try:
                    import tensorflow as tf
                    self.model = tf.keras.models.load_model(str(model_path))
                    self.model_version = "seizure_keras_v1.0"
                    logger.info(f"✅ Modèle Keras chargé depuis {model_path}")
                    logger.info(f"   Architecture: {self.model.summary()}")
                except ImportError:
                    logger.error(
                        "❌ TensorFlow n'est pas installé. "
                        "Installez avec: pip install tensorflow"
                    )
                    self.model = None
            else:
                logger.warning(f"⚠️ Modèle non trouvé à {model_path}")
                self.model = None

        except Exception as e:
            logger.error(f"❌ Erreur lors du chargement du modèle: {e}")
            self.model = None
            self.scaler = None

    async def predict_seizure_risk(
        self,
        db: Session,
        patient_id: int,
        window_minutes: int = 30
    ) -> Prediction:
        """
        Prédiction TEMPS RÉEL avec fenêtre glissante.

        Analyse les 30 dernières minutes de données (6 points avec collecte toutes les 5 min)
        pour détecter les tendances et évolutions avant de prédire.

        Args:
            db: Session de base de données
            patient_id: ID du patient
            window_minutes: Taille de la fenêtre en minutes (défaut: 30)

        Returns:
            Prediction object avec risk_score, confidence, etc.

        Raises:
            ValueError: Si données insuffisantes
            Exception: Si erreur lors de la prédiction
        """
        # Étape 1 : Récupérer les données de la fenêtre glissante (30 dernières minutes)
        biometrics = await self._get_sliding_window_biometrics(
            db, patient_id, window_minutes
        )

        # Avec collecte toutes les 5 min : 30 min = 6 points
        # Minimum requis : 3 points (15 min de données)
        if len(biometrics) < 3:
            raise ValueError(
                f"Insufficient biometric data for prediction. "
                f"Found {len(biometrics)} records, minimum 3 required (15 min)."
            )

        # Étape 2 : Extraire features avec calculs de tendance
        features = await self._extract_features_with_trends(biometrics)

        # Étape 3 : Récupérer contexte patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise ValueError(f"Patient {patient_id} not found")

        # Étape 4 : Faire la prédiction avec le modèle local
        # Passer les biometrics brutes pour les modèles séquentiels
        prediction_result = await self._predict_with_local_model(features, biometrics)

        # Étape 5 : Créer l'objet Prediction
        prediction = Prediction(
            patient_id=patient_id,
            risk_score=prediction_result["risk_score"],
            confidence=prediction_result["confidence"],
            prediction_window=30,  # 30 minutes par défaut
            features_used=features,
            model_version=self.model_version,
            predicted_at=datetime.utcnow(),
            predicted_for=datetime.utcnow() + timedelta(minutes=30)
        )

        # Étape 6 : Sauvegarder en base
        db.add(prediction)
        db.commit()
        db.refresh(prediction)

        logger.info(
            f"Prediction created for patient {patient_id}: "
            f"risk_score={prediction.risk_score:.2f}, "
            f"confidence={prediction.confidence:.2f}"
        )

        return prediction

    async def _get_sliding_window_biometrics(
        self,
        db: Session,
        patient_id: int,
        window_minutes: int
    ) -> List[Biometric]:
        """
        Récupère les données de la fenêtre glissante.

        Args:
            db: Session DB
            patient_id: ID patient
            window_minutes: Taille fenêtre en minutes (ex: 30)

        Returns:
            Liste de Biometric des N dernières minutes, triés du plus ancien au plus récent
        """
        cutoff_time = datetime.utcnow() - timedelta(minutes=window_minutes)

        biometrics = db.query(Biometric).filter(
            Biometric.patient_id == patient_id,
            Biometric.recorded_at >= cutoff_time
        ).order_by(Biometric.recorded_at.asc()).all()  # ASC pour avoir ordre chronologique

        logger.debug(
            f"Retrieved {len(biometrics)} biometrics for patient {patient_id} "
            f"from sliding window of {window_minutes} minutes"
        )

        return biometrics

    async def _extract_features_with_trends(
        self,
        biometrics: List[Biometric]
    ) -> Dict[str, Any]:
        """
        Extrait features AVEC ANALYSE DE TENDANCES depuis fenêtre glissante.

        Calcule:
        - Statistiques (mean, std, min, max)
        - Tendances (slope = montée/descente)
        - Accélération (changement de vitesse)
        - Variabilité

        Args:
            biometrics: Liste de données biométriques (ordre chronologique)

        Returns:
            Dictionnaire enrichi avec tendances
        """
        # Extraction des séries temporelles
        hr_values = [b.heart_rate for b in biometrics if b.heart_rate is not None]
        hrv_values = [b.heart_rate_variability for b in biometrics if b.heart_rate_variability is not None]
        movement_values = [b.movement_intensity for b in biometrics if b.movement_intensity is not None]
        stress_values = [b.stress_level for b in biometrics if b.stress_level is not None]

        features = {
            "heart_rate": {
                "mean": float(np.mean(hr_values)) if hr_values else 0.0,
                "std": float(np.std(hr_values)) if hr_values else 0.0,
                "min": float(np.min(hr_values)) if hr_values else 0.0,
                "max": float(np.max(hr_values)) if hr_values else 0.0,
                "current": float(hr_values[-1]) if hr_values else 0.0,
                "slope": self._calculate_slope(hr_values) if len(hr_values) > 1 else 0.0,
                "acceleration": self._calculate_acceleration(hr_values) if len(hr_values) > 2 else 0.0,
                "data_points": len(hr_values)
            },
            "heart_rate_variability": {
                "mean": float(np.mean(hrv_values)) if hrv_values else 0.0,
                "std": float(np.std(hrv_values)) if hrv_values else 0.0,
                "current": float(hrv_values[-1]) if hrv_values else 0.0,
                "slope": self._calculate_slope(hrv_values) if len(hrv_values) > 1 else 0.0,
                "rmssd": float(np.sqrt(np.mean(np.square(np.diff(hrv_values))))) if len(hrv_values) > 1 else 0.0
            },
            "movement": {
                "intensity_mean": float(np.mean(movement_values)) if movement_values else 0.0,
                "intensity_std": float(np.std(movement_values)) if movement_values else 0.0,
                "current": float(movement_values[-1]) if movement_values else 0.0,
                "slope": self._calculate_slope(movement_values) if len(movement_values) > 1 else 0.0
            },
            "stress": {
                "level_mean": float(np.mean(stress_values)) if stress_values else 0.0,
                "level_std": float(np.std(stress_values)) if stress_values else 0.0,
                "max": float(np.max(stress_values)) if stress_values else 0.0,
                "current": float(stress_values[-1]) if stress_values else 0.0,
                "slope": self._calculate_slope(stress_values) if len(stress_values) > 1 else 0.0
            },
            "metadata": {
                "total_biometric_records": len(biometrics),
                "window_minutes": 30,
                "data_completeness": self._calculate_completeness(biometrics),
                "first_recorded": biometrics[0].recorded_at.isoformat() if biometrics else None,
                "last_recorded": biometrics[-1].recorded_at.isoformat() if biometrics else None,
                "device_source": biometrics[0].source if biometrics else "unknown"
            }
        }

        return features

    def _calculate_slope(self, values: List[float]) -> float:
        """
        Calcule la tendance linéaire (pente) d'une série de valeurs.

        Pente positive = hausse
        Pente négative = baisse
        Pente proche de 0 = stable

        Returns:
            Pente en unité/point (ex: +4.5 bpm par point de 5 min)
        """
        if len(values) < 2:
            return 0.0

        x = np.arange(len(values))
        y = np.array(values)

        # Régression linéaire simple
        slope = np.polyfit(x, y, 1)[0]

        return float(slope)

    def _calculate_acceleration(self, values: List[float]) -> float:
        """
        Calcule l'accélération (changement de la vitesse de changement).

        Accélération positive = le rythme accélère
        Accélération négative = le rythme ralentit

        Returns:
            Accélération en unité/point²
        """
        if len(values) < 3:
            return 0.0

        # Calculer les différences (vitesses)
        velocities = np.diff(values)

        # Calculer l'accélération (différence des vitesses)
        accelerations = np.diff(velocities)

        # Retourner l'accélération moyenne
        return float(np.mean(accelerations))

    async def _extract_features(
        self,
        biometrics: List[Biometric]
    ) -> Dict[str, Any]:
        """
        Extrait les features statistiques depuis les biométriques

        Transforme :
        List[Biometric] → Dict[str, Dict[str, float]]

        Returns:
            Dictionnaire avec statistiques calculées pour chaque métrique
        """
        # Extraction des séries temporelles
        hr_values = [b.heart_rate for b in biometrics if b.heart_rate is not None]
        hrv_values = [b.heart_rate_variability for b in biometrics if b.heart_rate_variability is not None]
        movement_values = [b.movement_intensity for b in biometrics if b.movement_intensity is not None]
        stress_values = [b.stress_level for b in biometrics if b.stress_level is not None]
        sleep_quality_values = [b.sleep_quality for b in biometrics if b.sleep_quality is not None]
        sleep_duration_values = [b.sleep_duration for b in biometrics if b.sleep_duration is not None]

        # Calcul des statistiques
        features = {
            "heart_rate": {
                "mean": float(np.mean(hr_values)) if hr_values else 0.0,
                "std": float(np.std(hr_values)) if hr_values else 0.0,
                "min": float(np.min(hr_values)) if hr_values else 0.0,
                "max": float(np.max(hr_values)) if hr_values else 0.0,
                "data_points": len(hr_values)
            },
            "heart_rate_variability": {
                "mean": float(np.mean(hrv_values)) if hrv_values else 0.0,
                "std": float(np.std(hrv_values)) if hrv_values else 0.0,
                "rmssd": float(np.sqrt(np.mean(np.square(np.diff(hrv_values))))) if len(hrv_values) > 1 else 0.0
            },
            "movement": {
                "intensity_mean": float(np.mean(movement_values)) if movement_values else 0.0,
                "intensity_std": float(np.std(movement_values)) if movement_values else 0.0,
                "accelerometer_magnitude_mean": self._calculate_accel_magnitude(biometrics)
            },
            "stress": {
                "level_mean": float(np.mean(stress_values)) if stress_values else 0.0,
                "level_std": float(np.std(stress_values)) if stress_values else 0.0,
                "max": float(np.max(stress_values)) if stress_values else 0.0
            },
            "sleep": {
                "quality_mean": float(np.mean(sleep_quality_values)) if sleep_quality_values else 0.0,
                "total_duration_hours": float(np.sum(sleep_duration_values)) if sleep_duration_values else 0.0,
                "last_sleep_quality": float(sleep_quality_values[-1]) if sleep_quality_values else 0.0
            },
            "metadata": {
                "total_biometric_records": len(biometrics),
                "data_completeness": self._calculate_completeness(biometrics),
                "device_source": biometrics[0].source if biometrics else "unknown"
            }
        }

        return features

    def _calculate_accel_magnitude(self, biometrics: List[Biometric]) -> float:
        """Calcule la magnitude moyenne de l'accéléromètre"""
        magnitudes = []
        for b in biometrics:
            if (b.accelerometer_x is not None and
                b.accelerometer_y is not None and
                b.accelerometer_z is not None):
                mag = np.sqrt(
                    b.accelerometer_x**2 +
                    b.accelerometer_y**2 +
                    b.accelerometer_z**2
                )
                magnitudes.append(mag)

        return float(np.mean(magnitudes)) if magnitudes else 0.0

    def _calculate_completeness(self, biometrics: List[Biometric]) -> float:
        """Calcule le taux de complétude des données (0.0 à 1.0)"""
        if not biometrics:
            return 0.0

        total_fields = 0
        filled_fields = 0

        for b in biometrics:
            total_fields += 9  # 9 champs de données
            if b.heart_rate is not None: filled_fields += 1
            if b.heart_rate_variability is not None: filled_fields += 1
            if b.accelerometer_x is not None: filled_fields += 1
            if b.accelerometer_y is not None: filled_fields += 1
            if b.accelerometer_z is not None: filled_fields += 1
            if b.movement_intensity is not None: filled_fields += 1
            if b.stress_level is not None: filled_fields += 1
            if b.sleep_duration is not None: filled_fields += 1
            if b.sleep_quality is not None: filled_fields += 1

        return filled_fields / total_fields if total_fields > 0 else 0.0

    async def _predict_with_local_model(
        self,
        features: Dict[str, Any],
        biometrics: List[Biometric] = None
    ) -> Dict[str, Any]:
        """
        Fait la prédiction avec le modèle Keras local

        Args:
            features: Dictionnaire de features extraites
            biometrics: Liste optionnelle de biometrics brutes pour modèles séquentiels

        Returns:
            Dict avec risk_score et confidence
        """
        # Si le modèle n'est pas chargé, utiliser le mock
        if self.model is None:
            logger.warning("Modèle non chargé, utilisation du mode MOCK")
            return self._mock_prediction(features)

        try:
            # Créer la séquence temporelle pour les modèles LSTM/CNN
            if biometrics is not None:
                feature_sequence = self._biometrics_to_sequence(biometrics)
            else:
                # Fallback: vecteur simple pour modèles non-séquentiels
                feature_sequence = self._features_to_vector(features)

            # Normaliser avec le scaler si disponible
            # Note: Pour les séquences, le scaler doit normaliser chaque timestep
            if self.scaler is not None and len(feature_sequence.shape) == 1:
                feature_sequence = self.scaler.transform(feature_sequence.reshape(1, -1))
            elif len(feature_sequence.shape) == 1:
                feature_sequence = feature_sequence.reshape(1, -1)
            elif len(feature_sequence.shape) == 2:
                # Ajouter dimension batch pour séquences (batch_size, timesteps, features)
                feature_sequence = np.expand_dims(feature_sequence, axis=0)

            # Faire la prédiction
            prediction = self.model.predict(feature_sequence, verbose=0)

            # Extraire le risk_score (probabilité de crise)
            # Keras retourne un array [[prob_no_seizure, prob_seizure]]
            if len(prediction.shape) > 1 and prediction.shape[1] > 1:
                risk_score = float(prediction[0][1])  # Probabilité de crise
                confidence = float(np.max(prediction[0]))  # Confiance = max des probas
            else:
                risk_score = float(prediction[0][0])
                confidence = 0.8  # Confiance par défaut

            logger.info(
                f"Prédiction modèle local: risk_score={risk_score:.2%}, "
                f"confidence={confidence:.2%}"
            )

            return {
                "risk_score": risk_score,
                "confidence": confidence
            }

        except Exception as e:
            logger.error(f"Erreur lors de la prédiction avec le modèle local: {e}")
            logger.warning("Utilisation du mode MOCK en fallback")
            return self._mock_prediction(features)

    def _biometrics_to_sequence(self, biometrics: List[Biometric]) -> np.ndarray:
        """
        Convertit les biometrics en séquence temporelle pour modèles LSTM/CNN

        Le modèle attend shape (30, 4) avec 4 features:
        - heart_rate
        - heart_rate_variability
        - stress_level (proxy pour SPO2)
        - movement_intensity (proxy pour body temperature)

        Note: Le modèle original attend [hr, hrv, spo2, temp] mais on utilise
        [hr, hrv, stress, movement] car ce sont les features disponibles dans Biometric.

        Si moins de 30 points, fait du padding en répétant la dernière valeur.

        Args:
            biometrics: Liste de Biometric (ordre chronologique)

        Returns:
            Array numpy de shape (30, 4)
        """
        # Préparer la séquence (30 timesteps, 4 features)
        sequence = np.zeros((30, 4))

        # Remplir avec les données disponibles
        for i, bio in enumerate(biometrics):
            if i >= 30:
                break  # Ne pas dépasser 30 timesteps

            # Feature 0: Heart Rate
            sequence[i, 0] = bio.heart_rate if bio.heart_rate is not None else 70.0

            # Feature 1: Heart Rate Variability
            sequence[i, 1] = bio.heart_rate_variability if bio.heart_rate_variability is not None else 50.0

            # Feature 2: Stress Level (utilisé comme proxy pour SPO2)
            # Normaliser stress_level (0-1) vers range compatible (ex: 95-100 pour SPO2)
            if bio.stress_level is not None:
                # Mapper stress 0-1 vers SPO2 inversé 95-100 (plus de stress = moins de SPO2)
                sequence[i, 2] = 100.0 - (bio.stress_level * 5.0)
            else:
                sequence[i, 2] = 97.0  # Valeur normale SPO2

            # Feature 3: Movement Intensity (utilisé comme proxy pour température)
            # Normaliser movement (0-1) vers range température (36-38°C)
            if bio.movement_intensity is not None:
                sequence[i, 3] = 36.5 + (bio.movement_intensity * 1.5)
            else:
                sequence[i, 3] = 36.5  # Température normale

        # Si on a moins de 30 points, faire du forward filling pour les timesteps manquants
        # (répéter la dernière valeur connue)
        if len(biometrics) > 0 and len(biometrics) < 30:
            last_valid_idx = min(len(biometrics) - 1, 29)
            for i in range(last_valid_idx + 1, 30):
                sequence[i] = sequence[last_valid_idx]

        return sequence

    def _features_to_vector(self, features: Dict[str, Any]) -> np.ndarray:
        """
        Convertit le dictionnaire de features en vecteur numpy

        Pour les modèles statistiques : retourne shape (4,)
        Pour les modèles séquentiels (LSTM/CNN) : retourne shape (30, 4)

        Returns:
            Vecteur numpy - shape dépend du type de modèle
        """
        # Extraire les features dans le bon ordre (selon le scaler)
        # Les features disponibles dans nos biometrics
        hr = features["heart_rate"]["mean"]
        hrv = features["heart_rate_variability"]["mean"]

        # Features manquantes : utiliser des proxys temporaires
        # TODO: Ajouter spo2 et temp dans le modèle Biometric
        spo2_proxy = 97.0  # Valeur normale moyenne (95-100%)
        temp_proxy = 36.5  # Température corporelle normale (36-37°C)

        # IMPORTANT: Ordre exact : hr, hrv, spo2, temp_proxy
        vector = np.array([hr, hrv, spo2_proxy, temp_proxy])

        return vector

    def _mock_prediction(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Génère une prédiction mock (pour développement/tests)

        Utilise une logique simple basée sur les features
        """
        # Calcul simple basé sur HR et stress
        hr_mean = features.get("heart_rate", {}).get("mean", 70)
        stress_mean = features.get("stress", {}).get("level_mean", 5)

        # Normalisation simple pour simuler un score de risque
        risk_factor = (hr_mean / 100.0) + (stress_mean / 10.0)
        risk_score = min(max(risk_factor / 2.0, 0.0), 1.0)

        logger.warning(
            f"Using MOCK prediction (risk_score={risk_score:.2f}). "
            f"Ensure models/seizure.keras is present and TensorFlow is installed."
        )

        return {
            "risk_score": risk_score,
            "confidence": 0.5
        }

    def should_trigger_alert(
        self,
        risk_score: float,
        confidence: float
    ) -> bool:
        """
        Détermine si une alerte doit être déclenchée

        Args:
            risk_score: Score de risque (0.0-1.0)
            confidence: Niveau de confiance (0.0-1.0)

        Returns:
            True si une alerte doit être créée
        """
        # TEMPORAIRE POUR TESTS: Seuil abaissé à 0.001 pour faciliter les tests
        # TODO: Remettre à 0.70 en production
        threshold = getattr(settings, 'PREDICTION_THRESHOLD', 0.001)
        result = risk_score >= threshold and confidence >= 0.60

        logger.info(
            f"🎯 should_trigger_alert: risk={risk_score:.6f} >= {threshold}, "
            f"conf={confidence:.2f} >= 0.60 → {result}"
        )

        return result


# Instance singleton pour réutilisation
_prediction_service_instance = None

def get_prediction_service() -> AIPredictionService:
    """Récupère l'instance singleton du service de prédiction"""
    global _prediction_service_instance
    if _prediction_service_instance is None:
        _prediction_service_instance = AIPredictionService()
    return _prediction_service_instance
