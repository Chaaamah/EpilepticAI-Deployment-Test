import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.patient import Patient

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_patients.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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

@pytest.fixture
def test_patient_token(setup_database):
    """Create a test patient and return auth token"""
    # Create patient directly in database
    db = TestingSessionLocal()
    try:
        patient = Patient(
            email="test.patient@example.com",
            full_name="Test Patient",
            phone="+33612345678",
            hashed_password=get_password_hash("Test1234!"),
            is_active=True,
            is_verified=True
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        
        # Get token
        login_data = {
            "email": "test.patient@example.com",
            "password": "Test1234!"
        }
        
        response = client.post("/api/v1/auth/login/patient", json=login_data)
        token = response.json()["access_token"]
        return token
    finally:
        db.close()

def test_get_patient_profile(test_patient_token):
    """Test getting patient profile"""
    headers = {"Authorization": f"Bearer {test_patient_token}"}
    response = client.get("/api/v1/patients/me", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test.patient@example.com"
    assert data["full_name"] == "Test Patient"
    assert data["is_active"] == True

def test_update_patient_profile(test_patient_token):
    """Test updating patient profile"""
    update_data = {
        "full_name": "Updated Name",
        "phone": "+33698765432",
        "epilepsy_type": "Updated Type",
        "trigger_factors": ["stress", "lack of sleep"]
    }
    
    headers = {"Authorization": f"Bearer {test_patient_token}"}
    response = client.put("/api/v1/patients/me", json=update_data, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == update_data["full_name"]
    assert data["phone"] == update_data["phone"]
    assert data["epilepsy_type"] == update_data["epilepsy_type"]
    assert data["trigger_factors"] == update_data