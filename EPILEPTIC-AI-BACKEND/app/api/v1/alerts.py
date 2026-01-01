from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertUpdate, AlertInDB
from app.api.deps import get_current_patient

router = APIRouter()

@router.get("/", response_model=List[AlertInDB])
async def get_alerts(
    active_only: bool = True,
    days: int = 7,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get alerts"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(Alert).filter(
        Alert.patient_id == current_patient.id,
        Alert.triggered_at >= start_date
    )
    
    if active_only:
        query = query.filter(Alert.is_active == True)
    
    alerts = query.order_by(Alert.triggered_at.desc()).all()
    
    return alerts

@router.get("/unread", response_model=List[AlertInDB])
async def get_unread_alerts(
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get unread alerts"""
    alerts = db.query(Alert).filter(
        Alert.patient_id == current_patient.id,
        Alert.is_active == True,
        Alert.acknowledged == False
    ).order_by(Alert.triggered_at.desc()).all()
    
    return alerts

@router.put("/{alert_id}/acknowledge", response_model=AlertInDB)
async def acknowledge_alert(
    alert_id: int,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Acknowledge an alert"""
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.patient_id == current_patient.id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert.acknowledged = True
    alert.acknowledged_at = datetime.utcnow()
    alert.acknowledged_by = f"patient:{current_patient.id}"
    
    db.commit()
    db.refresh(alert)
    
    return alert

@router.put("/{alert_id}/resolve", response_model=AlertInDB)
async def resolve_alert(
    alert_id: int,
    alert_update: AlertUpdate,
    current_patient=Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Resolve an alert"""
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.patient_id == current_patient.id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by = f"patient:{current_patient.id}"
    
    if alert_update.resolution_notes:
        alert.resolution_notes = alert_update.resolution_notes
    
    db.commit()
    db.refresh(alert)
    
    return alert