from typing import Dict, Any, List, Optional
from datetime import datetime
import re

def validate_medical_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate medical data"""
    errors = []
    warnings = []
    
    # Required fields
    required_fields = ['full_name', 'date_of_birth', 'epilepsy_type']
    for field in required_fields:
        if not data.get(field):
            errors.append(f"Missing required field: {field}")
    
    # Validate date of birth
    if 'date_of_birth' in data:
        try:
            dob = datetime.fromisoformat(data['date_of_birth'].replace('Z', '+00:00'))
            if dob > datetime.utcnow():
                errors.append("Date of birth cannot be in the future")
        except:
            errors.append("Invalid date of birth format")
    
    # Validate email
    if 'email' in data and data['email']:
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            errors.append("Invalid email format")
    
    # Validate phone number
    if 'phone' in data and data['phone']:
        phone_pattern = r'^\+?[1-9]\d{1,14}$'
        if not re.match(phone_pattern, data['phone']):
            warnings.append("Phone number format might be invalid")
    
    # Validate emergency contacts
    if 'emergency_contacts' in data and isinstance(data['emergency_contacts'], list):
        for i, contact in enumerate(data['emergency_contacts']):
            if not contact.get('name'):
                errors.append(f"Emergency contact {i+1}: Name is required")
            if not contact.get('phone'):
                errors.append(f"Emergency contact {i+1}: Phone number is required")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }

def validate_emergency_contact(contact: Dict[str, Any]) -> Dict[str, Any]:
    """Validate emergency contact data"""
    errors = []
    
    required_fields = ['name', 'phone', 'relationship']
    for field in required_fields:
        if not contact.get(field):
            errors.append(f"Missing required field: {field}")
    
    # Validate phone
    if contact.get('phone'):
        phone_pattern = r'^\+?[1-9]\d{1,14}$'
        if not re.match(phone_pattern, contact['phone']):
            errors.append("Invalid phone number format")
    
    # Validate email if provided
    if contact.get('email'):
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, contact['email']):
            errors.append("Invalid email format")
    
    # Validate priority
    if 'priority' in contact:
        try:
            priority = int(contact['priority'])
            if priority < 1 or priority > 5:
                errors.append("Priority must be between 1 and 5")
        except:
            errors.append("Invalid priority value")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors
    }

def validate_biometric_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate biometric data"""
    errors = []
    warnings = []
    
    # Validate required fields
    if 'patient_id' not in data:
        errors.append("Missing patient_id")
    if 'recorded_at' not in data:
        errors.append("Missing recorded_at")
    
    # Validate heart rate range
    if 'heart_rate' in data and data['heart_rate'] is not None:
        hr = data['heart_rate']
        if hr < 30 or hr > 200:
            warnings.append(f"Heart rate ({hr}) outside normal range (30-200)")
    
    # Validate heart rate variability
    if 'heart_rate_variability' in data and data['heart_rate_variability'] is not None:
        hrv = data['heart_rate_variability']
        if hrv < 0:
            errors.append("Heart rate variability cannot be negative")
    
    # Validate stress level
    if 'stress_level' in data and data['stress_level'] is not None:
        stress = data['stress_level']
        if stress < 0 or stress > 10:
            errors.append("Stress level must be between 0 and 10")
    
    # Validate sleep duration
    if 'sleep_duration' in data and data['sleep_duration'] is not None:
        sleep = data['sleep_duration']
        if sleep < 0 or sleep > 24:
            errors.append("Sleep duration must be between 0 and 24 hours")
    
    # Validate sleep quality
    if 'sleep_quality' in data and data['sleep_quality'] is not None:
        quality = data['sleep_quality']
        if quality < 0 or quality > 100:
            errors.append("Sleep quality must be between 0 and 100")
    
    # Validate timestamp
    if 'recorded_at' in data:
        try:
            recorded_at = datetime.fromisoformat(data['recorded_at'].replace('Z', '+00:00'))
            if recorded_at > datetime.utcnow():
                errors.append("Recorded time cannot be in the future")
        except:
            errors.append("Invalid recorded_at format")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }

def validate_seizure_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate seizure data"""
    errors = []
    warnings = []
    
    # Validate required fields
    required_fields = ['start_time', 'patient_id']
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {field}")
    
    # Validate start time
    if 'start_time' in data:
        try:
            start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            if start_time > datetime.utcnow():
                errors.append("Start time cannot be in the future")
        except:
            errors.append("Invalid start_time format")
    
    # Validate end time
    if 'end_time' in data and data['end_time']:
        try:
            end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
            if 'start_time' in data:
                try:
                    start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
                    if end_time < start_time:
                        errors.append("End time cannot be before start time")
                except:
                    pass
        except:
            errors.append("Invalid end_time format")
    
    # Validate intensity
    if 'intensity' in data and data['intensity'] is not None:
        intensity = data['intensity']
        if intensity < 0 or intensity > 10:
            errors.append("Intensity must be between 0 and 10")
    
    # Validate symptoms
    if 'symptoms' in data and not isinstance(data['symptoms'], list):
        errors.append("Symptoms must be a list")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }

def validate_prediction_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate prediction data"""
    errors = []
    
    # Validate risk score
    if 'risk_score' not in data:
        errors.append("Missing risk_score")
    else:
        risk_score = data['risk_score']
        if not isinstance(risk_score, (int, float)):
            errors.append("Risk score must be a number")
        elif risk_score < 0 or risk_score > 100:
            errors.append("Risk score must be between 0 and 100")
    
    # Validate confidence
    if 'confidence' in data and data['confidence'] is not None:
        confidence = data['confidence']
        if confidence < 0 or confidence > 1:
            errors.append("Confidence must be between 0 and 1")
    
    # Validate patient_id
    if 'patient_id' not in data:
        errors.append("Missing patient_id")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors
    }