#!/usr/bin/env python3
"""
Script de test pour Epileptic-AI-Backend API
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_health():
    """Test de santé de l'API"""
    print("\n🔍 Test 1: Vérification de la santé de l'API")
    try:
        response = requests.get("http://127.0.0.1:8000/docs", timeout=5)
        print(f"✅ API accessible: Status {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_register_patient():
    """Test d'enregistrement d'un patient"""
    print("\n🔍 Test 2: Enregistrement d'un patient")
    
    patient_data = {
        "email": "patient@test.com",
        "full_name": "Test Patient",
        "phone": "+33612345678",
        "password": "TestPassword123!",
        "confirm_password": "TestPassword123!",
        "epilepsy_type": "Temporal Lobe Epilepsy",
        "trigger_factors": ["stress", "lack of sleep"]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register/patient",
            json=patient_data,
            timeout=5
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Patient créé: {data.get('id')}")
            return data
        else:
            print(f"⚠️ Erreur: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def test_get_patients(token=None):
    """Test de récupération des patients"""
    print("\n🔍 Test 3: Récupération des patients")
    
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        response = requests.get(
            f"{BASE_URL}/patients/",
            headers=headers,
            timeout=5
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {len(data)} patient(s) trouvé(s)")
            return data
        else:
            print(f"⚠️ Réponse: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def test_get_doctors():
    """Test de récupération des médecins"""
    print("\n🔍 Test 4: Récupération des médecins")
    
    try:
        response = requests.get(
            f"{BASE_URL}/doctors/",
            timeout=5
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {len(data)} médecin(s) trouvé(s)")
            return data
        else:
            print(f"⚠️ Réponse: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def main():
    print("=" * 60)
    print("🧪 TESTS DE L'API EPILEPTIC-AI-BACKEND")
    print("=" * 60)
    
    # Test 1: Santé
    if not test_health():
        print("\n❌ Le serveur n'est pas accessible!")
        return
    
    # Test 2: Enregistrement patient
    patient = test_register_patient()
    
    # Test 3: Récupération des patients
    test_get_patients()
    
    # Test 4: Récupération des médecins
    test_get_doctors()
    
    print("\n" + "=" * 60)
    print("✅ Tests terminés!")
    print("=" * 60)

if __name__ == "__main__":
    main()
