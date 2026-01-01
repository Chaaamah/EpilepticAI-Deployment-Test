from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User roles enum"""
    ADMIN = "admin"
    PATIENT = "patient"
    DOCTOR = "doctor"


class User(Base):
    """
    User model for authentication and role management.
    This is the base user table that stores all users regardless of their role.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.PATIENT)

    # Status fields
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)  # For system admins

    # Phone (optional)
    phone = Column(String, nullable=True)

    # Profile picture URL (optional)
    profile_picture = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    metadata_json = Column(String, nullable=True)  # For storing additional role-specific data as JSON

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
