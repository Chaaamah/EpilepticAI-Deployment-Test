from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.api import api_router
from app.core.startup import auto_assign_orphan_patients

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager"""
    # Startup
    print(f"{datetime.now().isoformat()} - Starting {settings.APP_NAME} v{settings.VERSION}...")

    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        print(f"{datetime.now().isoformat()} - Database tables created successfully")
    except Exception as e:
        print(f"{datetime.now().isoformat()} - Error creating database tables: {e}")

    # Auto-assign orphan patients to first available doctor
    try:
        auto_assign_orphan_patients()
        print(f"{datetime.now().isoformat()} - Orphan patients auto-assignment completed")
    except Exception as e:
        print(f"{datetime.now().isoformat()} - Error during orphan patients auto-assignment: {e}")

    yield

    # Shutdown
    print(f"{datetime.now().isoformat()} - Shutting down {settings.APP_NAME}...")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="EpilepticAI Backend API - Real-time seizure prediction and monitoring",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    redirect_slashes=False
)

# Add CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME} Backend API",
        "version": settings.VERSION,
        "service": "seizure-prediction-monitoring",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "epileptic-ai-backend",
        "version": settings.VERSION
    }

@app.get("/version")
async def version():
    """Version endpoint"""
    return {
        "version": settings.VERSION,
        "app_name": settings.APP_NAME,
        "debug_mode": settings.DEBUG
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )