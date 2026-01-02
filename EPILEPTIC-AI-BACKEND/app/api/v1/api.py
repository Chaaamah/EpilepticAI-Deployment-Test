from fastapi import APIRouter

from app.api.v1 import (
    auth, patients, doctors, biometrics, seizures, medications,
    alerts, predictions, emergency, users, seizure_detection, contacts, clinical_notes
)

api_router = APIRouter(redirect_slashes=False)

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["doctors"])
api_router.include_router(biometrics.router, prefix="/biometrics", tags=["biometrics"])
api_router.include_router(seizures.router, prefix="/seizures", tags=["seizures"])
api_router.include_router(medications.router, prefix="/medications", tags=["medications"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
api_router.include_router(emergency.router, prefix="/emergency", tags=["emergency"])
api_router.include_router(seizure_detection.router, prefix="/seizure-detection", tags=["seizure-detection"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["emergency-contacts"])
api_router.include_router(clinical_notes.router, prefix="/clinical-notes", tags=["clinical-notes"])