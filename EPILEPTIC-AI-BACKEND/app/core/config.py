from pydantic_settings import BaseSettings
from typing import List, Optional
from pydantic import field_validator
import json

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "EpilepticAI"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str = "change-this-to-a-secure-random-string-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes for security
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:password@localhost:5432/epileptic_ai"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]

    # ML/AI
    ML_MODEL_PATH: str = "app/services/models/seizure_predictor.pkl"
    PREDICTION_THRESHOLD: float = 0.7
    AI_MODEL_URL: Optional[str] = None
    AI_MODEL_API_KEY: Optional[str] = None
    AI_RISK_THRESHOLD: float = 0.7

    # Alerts
    ENABLE_SMS_ALERTS: bool = False
    ENABLE_PUSH_NOTIFICATIONS: bool = True
    ALERT_COOLDOWN_MINUTES: int = 15

    # Twilio for SMS alerts
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    # Push Notifications
    FIREBASE_SERVER_KEY: Optional[str] = None
    APNS_KEY_ID: Optional[str] = None
    APNS_TEAM_ID: Optional[str] = None

    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None

    # Background Tasks
    BIOMETRIC_PROCESSING_INTERVAL: int = 60
    ALERT_CHECK_INTERVAL: int = 30

    # File Upload
    MAX_UPLOAD_SIZE: int = 10485760

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Monitoring settings
    PREDICTION_WINDOW_MINUTES: int = 30
    ALERT_DELAY_MINUTES: int = 15
    MAX_EMERGENCY_CONTACTS: int = 5

    # Data retention
    DATA_RETENTION_DAYS: int = 90
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            # Try to parse as JSON first
            try:
                return json.loads(v)
            except:
                # Fall back to comma-separated list
                return [origin.strip() for origin in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True
        extra = 'ignore'  # Ignore extra fields from .env
        env_prefix = ''  # No prefix for environment variables

settings = Settings()  # Load from .env file