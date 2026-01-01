from datetime import datetime, date
import re
import random
import string
from typing import Optional

def format_datetime(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Format datetime object to string"""
    if not dt:
        return ""
    return dt.strftime(format_str)

def calculate_age(birth_date: date) -> Optional[int]:
    """Calculate age from birth date"""
    if not birth_date:
        return None
    
    today = date.today()
    age = today.year - birth_date.year
    
    # Adjust if birthday hasn't occurred yet this year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    
    return age

def validate_phone_number(phone: str) -> bool:
    """Validate phone number format"""
    if not phone:
        return False
    
    # Basic validation for international numbers
    pattern = r'^\+?[1-9]\d{1,14}$'
    return bool(re.match(pattern, phone))

def generate_patient_code(patient_id: int, name: str) -> str:
    """Generate unique patient code"""
    initials = ''.join([word[0].upper() for word in name.split()[:2]])
    if len(initials) < 2:
        initials = name[:2].upper()
    
    timestamp = datetime.now().strftime("%y%m")
    random_part = ''.join(random.choices(string.digits, k=4))
    
    return f"EP{initials}{timestamp}{patient_id:04d}{random_part}"

def calculate_bmi(weight_kg: float, height_m: float) -> Optional[float]:
    """Calculate BMI"""
    if not weight_kg or not height_m or height_m <= 0:
        return None
    
    return round(weight_kg / (height_m ** 2), 1)

def validate_email(email: str) -> bool:
    """Validate email format"""
    if not email:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def calculate_seizure_frequency(seizures: list, days: int = 30) -> float:
    """Calculate seizure frequency per month"""
    if not seizures:
        return 0.0
    
    # Count seizures in the last 'days' days
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    recent_seizures = [s for s in seizures if s.start_time >= cutoff_date]
    
    # Calculate frequency per month
    frequency = (len(recent_seizures) / days) * 30
    
    return round(frequency, 1)

def format_duration(minutes: float) -> str:
    """Format duration in minutes to readable string"""
    if not minutes:
        return "N/A"
    
    hours = int(minutes // 60)
    mins = int(minutes % 60)
    
    if hours > 0:
        return f"{hours}h {mins}m"
    else:
        return f"{mins}m"

def risk_level_to_color(risk_score: float) -> str:
    """Convert risk score to color code"""
    if risk_score >= 80:
        return "#FF0000"  # Red
    elif risk_score >= 60:
        return "#FFA500"  # Orange
    elif risk_score >= 40:
        return "#FFFF00"  # Yellow
    elif risk_score >= 20:
        return "#90EE90"  # Light Green
    else:
        return "#00FF00"  # Green

def generate_secure_token(length: int = 32) -> str:
    """Generate secure random token"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def normalize_phone_number(phone: str) -> str:
    """Normalize phone number format"""
    if not phone:
        return ""
    
    # Remove all non-digit characters except leading +
    normalized = re.sub(r'[^\d+]', '', phone)
    
    # Add country code if missing
    if not normalized.startswith('+'):
        normalized = '+33' + normalized.lstrip('0')
    
    return normalized