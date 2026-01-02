from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List
from pydantic import BaseModel

print("🔥 LOADED PATIENTS.PY V2 - IF YOU DONT SEE THIS, RESTART DID NOT WORK")

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientUpdate, PatientInDB, EmergencyContact
from app.schemas.user import UserResponse
from app.api.deps import get_current_patient_user

router = APIRouter()