"""
Script de test complet du système EpilepticAI
"""
import requests
import json
from datetime import datetime, timedelta
import time
import sys
import io

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:8000/api/v1"

print("="*60)
print("TEST DU SYSTEME EPILEPTIC AI")
print("="*60)

# 1. Login Admin
print("\n[*] Étape 1: Connexion Admin...")
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "admin@test.com", "password": "Admin123!"}
)
admin_token = login_response.json()["access_token"]
print(f"[OK] Admin connecté - Token: {admin_token[:50]}...")

headers = {"Authorization": f"Bearer {admin_token}"}

# 2. Créer un docteur
print("\n[*] Étape 2: Création d'un docteur...")
doctor_data = {
    "email": "doctor@test.com",
    "password": "Doctor123!",
    "confirm_password": "Doctor123!",
    "full_name": "Dr. Jean Dupont",
    "role": "doctor",
    "phone": "+33612345678"
}

doctor_response = requests.post(
    f"{BASE_URL}/users/",
    json=doctor_data,
    headers=headers
)
print(f"Response status: {doctor_response.status_code}")
print(f"Response body: {doctor_response.text}")
doctor_json = doctor_response.json()
if "id" in doctor_json:
    doctor_id = doctor_json["id"]
    print(f"[OK] Docteur créé - ID: {doctor_id}")
else:
    print(f"[ERR] Erreur création docteur: {doctor_json}")
    sys.exit(1)

# 3. Login Docteur
print("\n[*] Étape 3: Connexion Docteur...")
doctor_login = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "doctor@test.com", "password": "Doctor123!"}
)
doctor_token = doctor_login.json()["access_token"]
doctor_headers = {"Authorization": f"Bearer {doctor_token}"}
print(f"[OK] Docteur connecté")

# 4. Créer un patient via le docteur
print("\n[*] Étape 4: Création d'un patient...")
patient_data = {
    "email": "patient@test.com",
    "password": "Patient123!",
    "full_name": "Marie Martin",
    "date_of_birth": "1990-05-15",
    "gender": "female",
    "phone": "+33623456789",
    "epilepsy_type": "Épilepsie généralisée",
    "emergency_contacts": [
        {
            "name": "Jean Martin",
            "relationship": "Conjoint",
            "phone": "+33634567890",
            "priority": 1
        }
    ]
}

patient_response = requests.post(
    f"{BASE_URL}/doctors/patients",
    json=patient_data,
    headers=doctor_headers
)
patient_id = patient_response.json()["id"]
print(f"[OK] Patient créé - ID: {patient_id}")

# 5. Login Patient
print("\n[*] Étape 5: Connexion Patient...")
patient_login = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "patient@test.com", "password": "Patient123!"}
)
patient_token = patient_login.json()["access_token"]
patient_headers = {"Authorization": f"Bearer {patient_token}"}
print(f"[OK] Patient connecté")

# 6. Envoyer des données biométriques (fenêtre glissante de 30 min = 6 points)
print("\n[*] Étape 6: Envoi de données biométriques...")
print("   (Simulation fenêtre glissante: 6 points sur 30 minutes)")

# Simuler 6 points de données sur 30 minutes (toutes les 5 min)
biometric_data_points = []
base_time = datetime.utcnow() - timedelta(minutes=30)

for i in range(6):
    recorded_at = base_time + timedelta(minutes=i * 5)

    # Simuler une augmentation FORTE du risque (pré-crise)
    hr_base = 85 + (i * 10)  # Augmentation rapide du rythme cardiaque
    stress = 0.6 + (i * 0.08)  # Stress élevé qui monte rapidement

    biometric = {
        "heart_rate": hr_base + (i * 5),  # 85, 100, 115, 130, 145, 160 (anormal!)
        "heart_rate_variability": 60 - (i * 8),  # HRV qui chute fortement (stress élevé)
        "stress_level": min(stress, 1.0),  # Stress qui monte vers 1.0
        "movement_intensity": 0.3 + (i * 0.15),  # Mouvements anormaux
        "spo2": 97.0 - (i * 0.5),  # Saturation oxygène qui baisse
        "body_temperature": 37.2 + (i * 0.15),  # Température qui monte
        "sleep_duration": 4.0 - (i * 0.4),  # Sommeil très réduit
        "recorded_at": recorded_at.isoformat() + "Z",
        "source": "Apple Watch"
    }

    biometric_data_points.append(biometric)

    response = requests.post(
        f"{BASE_URL}/biometrics/",
        json=biometric,
        headers=patient_headers
    )

    if response.status_code == 200:
        print(f"   [OK] Point {i+1}/6 - HR: {biometric['heart_rate']} bpm, Stress: {biometric['stress_level']:.1f}")
    else:
        print(f"   [ERR] Erreur point {i+1}: {response.text}")

time.sleep(1)

# 7. Déclencher une analyse/prédiction
print("\n[*] Étape 7: Déclenchement de l'analyse IA...")
prediction_response = requests.post(
    f"{BASE_URL}/predictions/analyze",
    headers=patient_headers
)

if prediction_response.status_code == 200:
    prediction = prediction_response.json()
    print(f"[OK] Prédiction effectuée!")
    print(f"   [STATS] Risque: {prediction.get('risk_score', 0):.1f}%")
    print(f"   [STATS] Confiance: {prediction.get('confidence', 0):.1f}%")
    print(f"   [STATS] Recommandation: {prediction.get('recommendation', 'N/A')}")
else:
    print(f"[ERR] Erreur lors de la prédiction: {prediction_response.text}")

# 8. Vérifier les alertes
print("\n[*] Étape 8: Vérification des alertes...")
alerts_response = requests.get(
    f"{BASE_URL}/alerts/",
    headers=patient_headers
)

if alerts_response.status_code == 200:
    alerts = alerts_response.json()
    if alerts:
        print(f"[WARN]  {len(alerts)} alerte(s) générée(s):")
        for alert in alerts:
            print(f"   - Type: {alert.get('alert_type')}")
            print(f"     Sévérité: {alert.get('severity')}")
            print(f"     Message: {alert.get('message')}")
    else:
        print("[OK] Aucune alerte générée")
else:
    print(f"[ERR] Erreur lors de la récupération des alertes")

# 9. Récupérer les dernières métriques
print("\n[*] Étape 9: Récupération des dernières métriques...")
latest_biometric = requests.get(
    f"{BASE_URL}/biometrics/latest",
    headers=patient_headers
)

if latest_biometric.status_code == 200:
    latest = latest_biometric.json()
    print(f"[OK] Dernières données biométriques:")
    print(f"   HR: {latest.get('heart_rate')} bpm")
    print(f"   HRV: {latest.get('heart_rate_variability')} ms")
    print(f"   Stress: {latest.get('stress_level')}")

print("\n" + "="*60)
print("[OK] TEST TERMINÉ")
print("="*60)
print(f"\n[STATS] Résumé:")
print(f"   - Admin créé: admin@test.com")
print(f"   - Docteur créé: doctor@test.com (ID: {doctor_id})")
print(f"   - Patient créé: patient@test.com (ID: {patient_id})")
print(f"   - 6 points biométriques envoyés (fenêtre glissante 30 min)")
print(f"   - Prédiction IA exécutée")
print(f"\n[WEB] Accès:")
print(f"   - API Docs: http://localhost:8000/docs")
print(f"   - pgAdmin: http://localhost:5050")
