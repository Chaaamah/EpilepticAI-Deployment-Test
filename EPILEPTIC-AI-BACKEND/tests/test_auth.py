import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_database():
    """Setup test database"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_register_patient_success(setup_database):
    """Test successful patient registration"""
    patient_data = {
        "email": "test.patient@example.com",
        "full_name": "Test Patient",
        "password": "Test1234!",
        "confirm_password": "Test1234!",
        "phone": "+33612345678",
        "epilepsy_type": "Tonic-Clonic",
        "emergency_contacts": [
            {
                "name": "Emergency Contact",
                "relationship": "Family",
                "phone": "+33687654321",
                "priority": 1
            }
        ]
    }
    
    response = client.post("/api/v1/auth/register/patient", json=patient_data)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == patient_data["email"]
    assert data["full_name"] == patient_data["full_name"]
    assert "id" in data
    assert data["is_active"] == True

def test_register_patient_duplicate_email(setup_database):
    """Test patient registration with duplicate email"""
    patient_data = {
        "email": "duplicate@example.com",
        "full_name": "First Patient",
        "password": "Test1234!",
        "confirm_password": "Test1234!",
        "phone": "+33611111111"
    }
    
    # First registration
    response1 = client.post("/api/v1/auth/register/patient", json=patient_data)
    assert response1.status_code == 200
    
    # Second registration with same email
    patient_data["full_name"] = "Second Patient"
    response2 = client.post("/api/v1/auth/register/patient", json=patient_data)
    assert response2.status_code == 400
    data = response2.json()
    assert "detail" in data
    assert "already registered" in data["detail"]

def test_register_patient_invalid_data():
    """Test patient registration with invalid data"""
    # Missing required fields
    invalid_data = {
        "email": "invalid@example.com",
        # Missing full_name
        "password": "short",
        "confirm_password": "short"  # Password too short
    }
    
    response = client.post("/api/v1/auth/register/patient", json=invalid_data)
    assert response.status_code == 422  # Validation error

def test_login_patient_success(setup_database):
    """Test successful patient login"""
    # First register a patient
    patient_data = {
        "email": "login.test@example.com",
        "full_name": "Login Test",
        "password": "Test1234!",
        "confirm_password": "Test1234!",
        "phone": "+33612345678"
    }
    
    register_response = client.post("/api/v1/auth/register/patient", json=patient_data)
    assert register_response.status_code == 200
    
    # Now login
    login_data = {
        "email": "login.test@example.com",
        "password": "Test1234!"
    }
    
    response = client.post("/api/v1/auth/login/patient", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user_type"] == "patient"

def test_login_patient_invalid_credentials():
    """Test patient login with invalid credentials"""
    login_data = {
        "email": "nonexistent@example.com",
        "password": "WrongPassword123!"
    }
    
    response = client.post("/api/v1/auth/login/patient", json=login_data)
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data

def test_login_patient_wrong_password(setup_database):
    """Test patient login with wrong password"""
    # Register patient
    patient_data = {
        "email": "wrong.pass@example.com",
        "full_name": "Wrong Password",
        "password": "Correct123!",
        "confirm_password": "Correct123!",
        "phone": "+33612345678"
    }
    
    client.post("/api/v1/auth/register/patient", json=patient_data)
    
    # Try login with wrong password
    login_data = {
        "email": "wrong.pass@example.com",
        "password": "WrongPassword123!"
    }
    
    response = client.post("/api/v1/auth/login/patient", json=login_data)
    assert response.status_code == 401

def test_register_doctor_success(setup_database):
    """Test successful doctor registration"""
    doctor_data = {
        "email": "doctor.test@example.com",
        "full_name": "Dr. Test",
        "password": "Doctor123!",
        "confirm_password": "Doctor123!",
        "phone": "+33698765432",
        "specialization": "Neurology",
        "hospital": "Test Hospital",
        "license_number": "MED123456"
    }
    
    response = client.post("/api/v1/auth/register/doctor", json=doctor_data)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == doctor_data["email"]
    assert data["full_name"] == doctor_data["full_name"]
    assert data["specialization"] == doctor_data["specialization"]
    assert "id" in data

def test_login_doctor_success(setup_database):
    """Test successful doctor login"""
    # Register doctor
    doctor_data = {
        "email": "login.doctor@example.com",
        "full_name": "Dr. Login",
        "password": "Doctor123!",
        "confirm_password": "Doctor123!",
        "phone": "+33611111111"
    }
    
    client.post("/api/v1/auth/register/doctor", json=doctor_data)
    
    # Login
    login_data = {
        "email": "login.doctor@example.com",
        "password": "Doctor123!"
    }
    
    response = client.post("/api/v1/auth/login/doctor", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user_type"] == "doctor"

def test_protected_endpoint_without_token():
    """Test accessing protected endpoint without token"""
    response = client.get("/api/v1/patients/me")
    assert response.status_code == 401  # Unauthorized

def test_protected_endpoint_with_invalid_token():
    """Test accessing protected endpoint with invalid token"""
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/api/v1/patients/me", headers=headers)
    assert response.status_code == 401

def test_get_current_user_with_valid_token(setup_database):
    """Test getting current user with valid token"""
    # Register and login
    patient_data = {
        "email": "current.user@example.com",
        "full_name": "Current User",
        "password": "Test1234!",
        "confirm_password": "Test1234!",
        "phone": "+33612345678"
    }
    
    client.post("/api/v1/auth/register/patient", json=patient_data)
    
    login_data = {
        "email": "current.user@example.com",
        "password": "Test1234!"
    }
    
    login_response = client.post("/api/v1/auth/login/patient", json=login_data)
    token = login_response.json()["access_token"]
    
    # Access protected endpoint
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == patient_data["email"]
    assert data["full_name"] == patient_data["full_name"]