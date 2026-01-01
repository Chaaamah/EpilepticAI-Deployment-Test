#!/usr/bin/env python3
"""
Script de test pour vérifier la création de patients via l'API
"""
import requests
import json
from datetime import date, datetime

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
DOCTOR_EMAIL = "boutaina@gmail.com"
DOCTOR_PASSWORD = "votre_mot_de_passe"  # Changez-le

def test_login():
    """Test de connexion docteur"""
    print("\n" + "="*60)
    print("TEST 1: Connexion docteur")
    print("="*60)

    url = f"{API_BASE_URL}/auth/login"
    data = {
        "email": DOCTOR_EMAIL,
        "password": DOCTOR_PASSWORD
    }

    print(f"POST {url}")
    print(f"Data: {json.dumps(data, indent=2)}")

    response = requests.post(url, json=data)

    print(f"\nStatus: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"\n✅ Login réussi! Token: {token[:50]}...")
        return token
    else:
        print(f"\n❌ Login échoué!")
        return None

def test_create_patient(token):
    """Test de création de patient"""
    print("\n" + "="*60)
    print("TEST 2: Création d'un patient")
    print("="*60)

    url = f"{API_BASE_URL}/doctors/patients"

    # Données du patient de test
    patient_data = {
        "email": f"test.patient.{int(datetime.now().timestamp())}@example.com",
        "full_name": "Test Patient API",
        "password": "TestPassword123!",
        "phone": "+212 600 111 222",
        "date_of_birth": "1995-06-15",
        "gender": "M",
        "epilepsy_type": "Temporal Lobe Epilepsy",
        "medical_history": "Patient de test créé via script Python",
        "trigger_factors": ["stress", "sleep deprivation"],
        "treating_neurologist": "Dr. Test",
        "hospital": "Test Hospital"
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print(f"POST {url}")
    print(f"Headers: Authorization: Bearer {token[:30]}...")
    print(f"Data: {json.dumps(patient_data, indent=2)}")

    response = requests.post(url, json=patient_data, headers=headers)

    print(f"\nStatus: {response.status_code}")

    try:
        response_data = response.json()
        print(f"Response: {json.dumps(response_data, indent=2)}")

        if response.status_code == 200 or response.status_code == 201:
            print(f"\n✅ Patient créé avec succès!")
            print(f"   ID: {response_data.get('id')}")
            print(f"   Email: {response_data.get('email')}")
            print(f"   Nom: {response_data.get('full_name')}")
            return response_data
        else:
            print(f"\n❌ Création échouée!")
            if "detail" in response_data:
                print(f"   Erreur: {response_data['detail']}")
            return None
    except Exception as e:
        print(f"❌ Erreur lors du parsing de la réponse: {e}")
        print(f"   Raw response: {response.text}")
        return None

def test_get_patients(token):
    """Test de récupération de la liste des patients"""
    print("\n" + "="*60)
    print("TEST 3: Récupération de la liste des patients")
    print("="*60)

    url = f"{API_BASE_URL}/doctors/patients/with-metrics"

    headers = {
        "Authorization": f"Bearer {token}",
    }

    print(f"GET {url}")

    response = requests.get(url, headers=headers)

    print(f"\nStatus: {response.status_code}")

    try:
        patients = response.json()
        print(f"Nombre de patients: {len(patients)}")

        if len(patients) > 0:
            print(f"\nPremier patient:")
            print(json.dumps(patients[0], indent=2, default=str))
            print(f"\n✅ Liste récupérée avec succès!")
        else:
            print(f"\n⚠️  Aucun patient trouvé")

        return patients
    except Exception as e:
        print(f"❌ Erreur: {e}")
        print(f"   Raw response: {response.text}")
        return None

def main():
    """Fonction principale"""
    print("\n" + "="*60)
    print("TESTS API - Création et récupération de patients")
    print("="*60)

    # Test 1: Login
    token = test_login()
    if not token:
        print("\n❌ Impossible de continuer sans token")
        return

    # Test 2: Créer un patient
    patient = test_create_patient(token)

    # Test 3: Récupérer la liste
    patients = test_get_patients(token)

    print("\n" + "="*60)
    print("RÉSUMÉ DES TESTS")
    print("="*60)
    print(f"✅ Login: {'OK' if token else 'FAILED'}")
    print(f"✅ Création patient: {'OK' if patient else 'FAILED'}")
    print(f"✅ Liste patients: {'OK' if patients is not None else 'FAILED'}")

if __name__ == "__main__":
    main()
