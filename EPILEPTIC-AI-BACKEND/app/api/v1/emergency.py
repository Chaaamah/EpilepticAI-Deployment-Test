from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.patient import Patient
from app.models.alert import Alert
from app.services.emergency_service import EmergencyService
from app.api.deps import get_current_patient

router = APIRouter()
emergency_service = EmergencyService()

@router.post("/trigger")
async def trigger_emergency(
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Trigger emergency alert"""
    try:
        result = await emergency_service.trigger_emergency(
            db=db,
            patient_id=current_patient.id
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Emergency trigger error: {str(e)}"
        )

@router.post("/check-in")
async def emergency_check_in(
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Emergency check-in after seizure"""
    try:
        # Create check-in alert
        alert = Alert(
            patient_id=current_patient.id,
            alert_type="emergency_check_in",
            severity="medium",
            title="Emergency Check-In",
            message="Patient has checked in after a seizure",
            is_active=True
        )
        
        db.add(alert)
        db.commit()
        
        # Notify emergency contacts
        await emergency_service.notify_check_in(
            patient_id=current_patient.id
        )
        
        return {"message": "Check-in recorded and contacts notified"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Check-in error: {str(e)}"
        )