"""
Script to fix patient treating_neurologist field to use email instead of name
"""

import requests
import sys
import io

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"

# Mapping of doctor names to emails (based on your console logs)
DOCTOR_NAME_TO_EMAIL = {
    "Boutaina Er ragragy": "boutaina12@gmail.com",
    "boutaina": "boutaina12@gmail.com",
    "chama": "chama32@gmail.com",
    "Chama": "chama32@gmail.com",
    "safaa": "safaa@gmail.com",
    "Safaa": "safaa@gmail.com",
}

def login_as_admin():
    """Login and get auth token"""
    # Try different possible admin credentials
    credentials = [
        {"email": "admin@gmail.com", "password": "admin"},
        {"email": "admin@gmail.com", "password": "Admin123"},
        {"email": "admin@example.com", "password": "admin123"},
    ]

    for creds in credentials:
        try:
            response = requests.post(
                f"{API_BASE_URL}/auth/login",
                json=creds
            )

            if response.status_code == 200:
                token = response.json()["access_token"]
                print(f"✓ Logged in as {creds['email']}")
                return token
        except:
            continue

    print("✗ Failed to login with any credentials")
    print("Please update the script with correct admin credentials")
    return None

def get_headers(token):
    """Get authorization headers"""
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def get_all_patients(token):
    """Get all patients"""
    response = requests.get(
        f"{API_BASE_URL}/doctors/patients",
        headers=get_headers(token)
    )

    if response.status_code == 200:
        return response.json()
    else:
        print(f"✗ Failed to get patients: {response.text}")
        return []

def update_patient_doctor(token, patient_id, new_email):
    """Update patient's treating neurologist"""
    response = requests.put(
        f"{API_BASE_URL}/doctors/patients/{patient_id}",
        headers=get_headers(token),
        json={"treating_neurologist": new_email}
    )

    return response.status_code == 200

def main():
    print("=" * 60)
    print("Fixing Patient Treating Neurologist (Name → Email)")
    print("=" * 60)

    # Login
    token = login_as_admin()
    if not token:
        return

    # Get all patients
    patients = get_all_patients(token)
    if not patients:
        print("\nNo patients found!")
        return

    print(f"\n✓ Found {len(patients)} patients")

    # Fix each patient
    fixed_count = 0
    skipped_count = 0

    for patient in patients:
        patient_name = patient.get('full_name', 'Unknown')
        current_doctor = patient.get('treating_neurologist', '')

        # Check if treating_neurologist is a name (not an email)
        if current_doctor and '@' not in current_doctor:
            # Find the corresponding email
            doctor_email = DOCTOR_NAME_TO_EMAIL.get(current_doctor)

            if doctor_email:
                print(f"\n📝 Patient: {patient_name}")
                print(f"   Current: {current_doctor}")
                print(f"   New:     {doctor_email}")

                success = update_patient_doctor(token, patient['id'], doctor_email)

                if success:
                    print(f"   ✓ Updated successfully")
                    fixed_count += 1
                else:
                    print(f"   ✗ Failed to update")
            else:
                print(f"\n⚠️  Patient: {patient_name}")
                print(f"   Doctor name '{current_doctor}' not in mapping")
                print(f"   Please add to DOCTOR_NAME_TO_EMAIL in script")
                skipped_count += 1
        elif current_doctor and '@' in current_doctor:
            print(f"✓ Patient {patient_name}: already has email ({current_doctor})")
        else:
            print(f"- Patient {patient_name}: no doctor assigned")
            skipped_count += 1

    # Summary
    print("\n" + "=" * 60)
    print("Summary:")
    print("=" * 60)
    print(f"✓ Fixed: {fixed_count} patients")
    print(f"- Skipped: {skipped_count} patients")
    print(f"📊 Total: {len(patients)} patients")

    if fixed_count > 0:
        print("\n✓ Please refresh your admin dashboard to see the changes!")

if __name__ == "__main__":
    main()
