from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.user import User

# OAuth2 password bearer
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    user_type: str = "patient"
) -> str:
    """
    Create JWT access token.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "user_type": user_type,
        "iat": datetime.utcnow()
    }
    
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against hashed password.
    """
    # Truncate to 72 bytes for bcrypt
    password_bytes = plain_password.encode('utf-8')[:72]
    return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """
    Hash password using bcrypt.
    Bcrypt has a 72-byte limit, so we truncate if necessary.
    """
    # Truncate password to 72 bytes to avoid bcrypt error
    password_bytes = password.encode('utf-8')[:72]
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    Get current user from JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        
        email: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        
        if email is None or user_type is None:
            raise credentials_exception
        
        # First check the User table (for admin and new users)
        user = db.query(User).filter(User.email == email).first()

        # Fallback to legacy tables for backward compatibility
        if not user:
            if user_type == "patient":
                user = db.query(Patient).filter(Patient.email == email).first()
            elif user_type == "doctor":
                user = db.query(Doctor).filter(Doctor.email == email).first()
            else:
                raise credentials_exception
        
        if user is None:
            raise credentials_exception
        
        if not getattr(user, 'is_active', True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        return user
        
    except JWTError:
        raise credentials_exception

def verify_token(token: str) -> Optional[str]:
    """
    Verify JWT token and return email if valid.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        return email
    except JWTError:
        return None