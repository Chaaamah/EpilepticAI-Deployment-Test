"""
Script to fix patient treating_neurologist directly in database
"""
import psycopg2
import sys
import io

# Fix encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Database connection parameters
DB_CONFIG = {
    'dbname': 'epileptic_ai',
    'user': 'postgres',
    'password': 'password',
    'host': 'localhost',
    'port': 5432
}

# Mapping of doctor names to emails
NAME_TO_EMAIL = {
    'Boutaina Er ragragy': 'boutaina12@gmail.com',
    'boutaina': 'boutaina12@gmail.com',
    'chama': 'chama32@gmail.com',
    'Chama': 'chama32@gmail.com',
    'safaa': 'safaa@gmail.com',
    'Safaa': 'safaa@gmail.com',
}

def main():
    print("=" * 70)
    print("Fixing Patient treating_neurologist in Database")
    print("=" * 70)

    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✓ Connected to database")

        # Get all patients with name-based treating_neurologist
        cursor.execute("""
            SELECT id, full_name, treating_neurologist
            FROM patients
            WHERE treating_neurologist IS NOT NULL
            AND treating_neurologist NOT LIKE '%@%'
        """)

        patients = cursor.fetchall()

        if not patients:
            print("\n✓ No patients need fixing! All have email-based assignments.")
            cursor.close()
            conn.close()
            return

        print(f"\n📋 Found {len(patients)} patients to fix:\n")

        # Fix each patient
        fixed_count = 0
        for patient_id, full_name, current_doctor in patients:
            doctor_email = NAME_TO_EMAIL.get(current_doctor)

            if doctor_email:
                print(f"Patient: {full_name}")
                print(f"  Current: {current_doctor}")
                print(f"  New:     {doctor_email}")

                cursor.execute("""
                    UPDATE patients
                    SET treating_neurologist = %s
                    WHERE id = %s
                """, (doctor_email, patient_id))

                print(f"  ✓ Updated\n")
                fixed_count += 1
            else:
                print(f"⚠️  Patient: {full_name}")
                print(f"  Unknown doctor: {current_doctor}\n")

        # Commit changes
        conn.commit()
        print("=" * 70)
        print(f"✓ Successfully fixed {fixed_count} patients!")
        print("=" * 70)

        # Show summary
        print("\n📊 Current assignments:")
        cursor.execute("""
            SELECT treating_neurologist, COUNT(*) as count
            FROM patients
            WHERE treating_neurologist IS NOT NULL
            GROUP BY treating_neurologist
            ORDER BY count DESC
        """)

        for doctor_email, count in cursor.fetchall():
            cursor.execute("""
                SELECT full_name FROM doctors WHERE email = %s
            """, (doctor_email,))

            result = cursor.fetchone()
            doctor_name = result[0] if result else "Unknown"
            print(f"  Dr. {doctor_name} ({doctor_email}): {count} patients")

        cursor.close()
        conn.close()

        print("\n✓ Done! Please refresh your admin dashboard.")

    except psycopg2.Error as e:
        print(f"✗ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
