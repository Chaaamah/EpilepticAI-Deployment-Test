from typing import Generator, Union
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.user import User, UserRole

def get_current_patient(
    current_user = Depends(get_current_user)
) -> Patient:
    if not isinstance(current_user, Patient):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a patient account"
        )
    return current_user

def get_current_doctor(
    current_user = Depends(get_current_user)
) -> Doctor:
    if not isinstance(current_user, Doctor):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a doctor account"
        )
    return current_user

def get_current_admin(
    current_user = Depends(get_current_user)
) -> User:
    """
    Verify that the current user is an admin.
    """
    if isinstance(current_user, User):
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin privileges required"
    )

def get_current_doctor_user(
    current_user = Depends(get_current_user)
) -> Union[User, Doctor]:
    """
    Verify that the current user is a doctor.
    Returns User object if from users table, or Doctor object if from legacy table.
    """
    # Check if User table entry with doctor role
    if isinstance(current_user, User):
        if current_user.role != UserRole.DOCTOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctor privileges required"
            )
        return current_user

    # Check if legacy Doctor table entry
    if isinstance(current_user, Doctor):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Doctor privileges required"
    )

def get_current_admin_or_doctor(
    current_user = Depends(get_current_user)
) -> Union[User, Doctor]:
    """
    Verify that the current user is either an admin or a doctor.
    """
    if isinstance(current_user, User):
        if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin or Doctor privileges required"
            )
        return current_user

    if isinstance(current_user, Doctor):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin or Doctor privileges required"
    )

def get_current_patient_user(
    current_user = Depends(get_current_user)
) -> Union[User, Patient]:
    """
    Verify that the current user is a patient.
    Returns User object if from users table, or Patient object if from legacy table.
    """
    if isinstance(current_user, User):
        if current_user.role != UserRole.PATIENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Patient privileges required"
            )
        return current_user

    if isinstance(current_user, Patient):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Patient privileges required"
    )