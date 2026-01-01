"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-12-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if enum exists, if not create it
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE userrole AS ENUM ('patient', 'doctor', 'admin');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', postgresql.ENUM('patient', 'doctor', 'admin', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.Column('last_login', sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_username', 'users', ['username'], unique=True)
    op.create_index('ix_users_id', 'users', ['id'])
    
    # Create patients table
    op.create_table(
        'patients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('gender', sa.String(20)),
        sa.Column('phone', sa.String(20)),
        sa.Column('address', sa.Text()),
        sa.Column('medical_history', sa.Text()),
        sa.Column('allergies', sa.Text()),
        sa.Column('blood_type', sa.String(5)),
        sa.Column('epilepsy_type', sa.String(100)),
        sa.Column('diagnosis_date', sa.Date()),
        sa.Column('seizure_frequency', sa.String(100)),
        sa.Column('healthkit_device_id', sa.String(255), unique=True),
        sa.Column('current_risk_score', sa.Float(), default=0.0),
        sa.Column('last_risk_update', sa.Date()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('ix_patients_id', 'patients', ['id'])
    
    # Create doctors table
    op.create_table(
        'doctors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20)),
        sa.Column('license_number', sa.String(50), unique=True),
        sa.Column('specialization', sa.String(100)),
        sa.Column('hospital_affiliation', sa.String(200)),
        sa.Column('years_of_experience', sa.Integer()),
        sa.Column('bio', sa.Text()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('ix_doctors_id', 'doctors', ['id'])
    
    # Create patient_doctor association table
    op.create_table(
        'patient_doctor',
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE')
    )
    
    # Create biometric_data table
    op.create_table(
        'biometric_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('heart_rate', sa.Float()),
        sa.Column('hrv', sa.Float()),
        sa.Column('spo2', sa.Float()),
        sa.Column('body_temperature', sa.Float()),
        sa.Column('steps', sa.Integer()),
        sa.Column('active_energy', sa.Float()),
        sa.Column('exercise_minutes', sa.Integer()),
        sa.Column('sleep_duration', sa.Float()),
        sa.Column('sleep_quality', sa.String(20)),
        sa.Column('stress_level', sa.Float()),
        sa.Column('fall_detected', sa.Boolean(), default=False),
        sa.Column('risk_score', sa.Float()),
        sa.Column('is_processed', sa.Boolean(), default=False),
        sa.Column('processed_at', sa.DateTime(timezone=True)),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE')
    )
    op.create_index('ix_biometric_data_id', 'biometric_data', ['id'])
    op.create_index('ix_biometric_data_patient_id', 'biometric_data', ['patient_id'])
    
    # Create seizures table
    op.create_table(
        'seizures',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('seizure_type', sa.String(100)),
        sa.Column('duration', sa.Integer()),
        sa.Column('intensity', sa.String(20)),
        sa.Column('trigger', sa.Text()),
        sa.Column('symptoms', sa.Text()),
        sa.Column('context', sa.Text()),
        sa.Column('latitude', sa.Float()),
        sa.Column('longitude', sa.Float()),
        sa.Column('location_name', sa.String(255)),
        sa.Column('detected_by', sa.String(50)),
        sa.Column('is_automatic', sa.Boolean(), default=False),
        sa.Column('recovery_time', sa.Integer()),
        sa.Column('hospitalization_required', sa.Boolean(), default=False),
        sa.Column('notes', sa.Text()),
        sa.Column('doctor_notes', sa.Text()),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE')
    )
    op.create_index('ix_seizures_id', 'seizures', ['id'])
    op.create_index('ix_seizures_patient_id', 'seizures', ['patient_id'])
    
    # Create medications table
    op.create_table(
        'medications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('dosage', sa.String(100)),
        sa.Column('frequency', sa.String(100)),
        sa.Column('schedule_times', postgresql.JSON),
        sa.Column('prescribed_by', sa.String(200)),
        sa.Column('prescription_date', sa.DateTime(timezone=True)),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('start_date', sa.DateTime(timezone=True)),
        sa.Column('end_date', sa.DateTime(timezone=True)),
        sa.Column('instructions', sa.Text()),
        sa.Column('side_effects', sa.Text()),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE')
    )
    op.create_index('ix_medications_id', 'medications', ['id'])
    op.create_index('ix_medications_patient_id', 'medications', ['patient_id'])
    
    # Create medication_adherence table
    op.create_table(
        'medication_adherence',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('medication_id', sa.Integer(), nullable=False),
        sa.Column('scheduled_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('taken_at', sa.DateTime(timezone=True)),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['medication_id'], ['medications.id'], ondelete='CASCADE')
    )
    
    # Create emergency_contacts table
    op.create_table(
        'emergency_contacts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('relationship', sa.String(100)),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('email', sa.String(255)),
        sa.Column('priority', sa.Integer(), default=1),
        sa.Column('notify_on_seizure', sa.Boolean(), default=True),
        sa.Column('notify_on_high_risk', sa.Boolean(), default=True),
        sa.Column('notify_on_fall', sa.Boolean(), default=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE')
    )
    op.create_index('ix_emergency_contacts_id', 'emergency_contacts', ['id'])
    op.create_index('ix_emergency_contacts_patient_id', 'emergency_contacts', ['patient_id'])
    
    # Create alerts table
    op.create_table(
        'alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('alert_type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('risk_score', sa.Float()),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text()),
        sa.Column('alert_metadata', postgresql.JSON),  # ✅ CHANGÉ: metadata -> alert_metadata
        sa.Column('status', sa.String(20), default='active'),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True)),
        sa.Column('resolved_at', sa.DateTime(timezone=True)),
        sa.Column('patient_response', sa.String(50)),
        sa.Column('response_at', sa.DateTime(timezone=True)),
        sa.Column('notifications_sent', postgresql.JSON),
        sa.Column('notification_sent_at', sa.DateTime(timezone=True)),
        sa.Column('latitude', sa.Float()),
        sa.Column('longitude', sa.Float()),
        sa.Column('location_name', sa.String(255)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE')
    )
    op.create_index('ix_alerts_id', 'alerts', ['id'])
    op.create_index('ix_alerts_patient_id', 'alerts', ['patient_id'])
    op.create_index('ix_alerts_created_at', 'alerts', ['created_at'])


def downgrade() -> None:
    op.drop_table('alerts')
    op.drop_table('emergency_contacts')
    op.drop_table('medication_adherence')
    op.drop_table('medications')
    op.drop_table('seizures')
    op.drop_table('biometric_data')
    op.drop_table('patient_doctor')
    op.drop_table('doctors')
    op.drop_table('patients')
    op.drop_table('users')
    op.execute('DROP TYPE IF EXISTS userrole')