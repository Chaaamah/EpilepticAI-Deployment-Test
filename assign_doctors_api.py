"""
Script to assign doctors to existing patients via API
"""

import requests
import json
import sys
import io

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "admin123"

def login_as_admin():
    """Login and get auth token"""
    response = requests.post(
        f"{API_BASE_URL}/auth/login",
        json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
    )

    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"✓ Logged in as admin")
        return token
    else:
        print(f"✗ Failed to login: {response.text}")
        return None

def get_headers(token):
    """Get authorization headers"""
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def get_all_doctors(token):
    """Get all doctors"""
    response = requests.get(
        f"{API_BASE_URL}/doctors/",
        headers=get_headers(token)
    )

    if response.status_code == 200:
        doctors = response.json()
        print(f"\n✓ Found {len(doctors)} doctors:")
        for i, doctor in enumerate(doctors, 1):
            print(f"  {i}. {doctor['full_name']} ({doctor['email']})")
        return doctors
    else:
        print(f"✗ Failed to get doctors: {response.text}")
        return []

def get_all_patients(token):
    """Get all patients"""
    response = requests.get(
        f"{API_BASE_URL}/doctors/patients",
        headers=get_headers(token)
    )

    if response.status_code == 200:
        patients = response.json()
        print(f"\n✓ Found {len(patients)} patients total")
        return patients
    else:
        print(f"✗ Failed to get patients: {response.text}")
        return []

def assign_doctor_to_patient(token, patient_id, doctor_email):
    """Assign a doctor to a patient"""
    response = requests.put(
        f"{API_BASE_URL}/doctors/patients/{patient_id}",
        headers=get_headers(token),
        json={
            "treating_neurologist": doctor_email
        }
    )

    return response.status_code == 200

def main():
    print("=" * 60)
    print("Assigning Doctors to Patients via API")
    print("=" * 60)

    # Login
    token = login_as_admin()
    if not token:
        return

    # Get all doctors
    doctors = get_all_doctors(token)
    if not doctors:
        print("\nNo doctors found!")
        return

    # Get all patients
    patients = get_all_patients(token)
    if not patients:
        print("\nNo patients found!")
        return

    # Filter patients without assigned doctor
    unassigned_patients = [
        p for p in patients
        if not p.get('treating_neurologist') or p.get('treating_neurologist') == ''
    ]

    if not unassigned_patients:
        print("\n✓ All patients already have assigned doctors!")

        # Show current assignments
        print("\nCurrent assignments:")
        for doctor in doctors:
            assigned = [p for p in patients if p.get('treating_neurologist') == doctor['email']]
            print(f"  Dr. {doctor['full_name']}: {len(assigned)} patients")
            for patient in assigned:
                print(f"    - {patient['full_name']}")
        return

    print(f"\nFound {len(unassigned_patients)} patients without assigned doctors:")
    for patient in unassigned_patients:
        print(f"  - {patient['full_name']} ({patient['email']})")

    # Assign doctors to patients (round-robin)
    print("\nAssigning doctors to patients...")
    for i, patient in enumerate(unassigned_patients):
        doctor = doctors[i % len(doctors)]
        success = assign_doctor_to_patient(token, patient['id'], doctor['email'])

        if success:
            print(f"  ✓ Assigned Dr. {doctor['full_name']} to {patient['full_name']}")
        else:
            print(f"  ✗ Failed to assign doctor to {patient['full_name']}")

    # Show summary
    print("\n" + "=" * 60)
    print("Summary - Patients per Doctor:")
    print("=" * 60)

    # Refresh patients list
    patients = get_all_patients(token)

    for doctor in doctors:
        assigned = [p for p in patients if p.get('treating_neurologist') == doctor['email']]
        print(f"\nDr. {doctor['full_name']}: {len(assigned)} patients")
        for patient in assigned:
            print(f"  - {patient['full_name']}")

    print("\n✓ Done!")

if __name__ == "__main__":
    main()
