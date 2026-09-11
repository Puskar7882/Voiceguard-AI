import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.session import init_db
from app.api.routes_auth import router as auth_router
from app.api.routes_analyze import router as analyze_router
from app.api.routes_stream import router as stream_router
from app.api.routes_logs import router as logs_router
from app.api.routes_payments import router as payments_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("VoiceGuard")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database and demo seeds
    logger.info("Initializing VoiceGuard AI Database & Security Engine...")
    init_db()
    from app.models.inference import classifier
    classifier.warmup()
    yield
    # Shutdown
    logger.info("VoiceGuard AI Backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-Time AI Voice Cloning & Impersonation Detection Platform for SIH 2026 Problem Statement 26104.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(analyze_router, prefix=settings.API_V1_STR)
app.include_router(analyze_router, prefix="") # Root /analyze alias for direct client integrations
app.include_router(stream_router)
app.include_router(logs_router, prefix=settings.API_V1_STR)
app.include_router(payments_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model_engine": "RawNet2 / AASIST Hybrid",
        "privacy_mode": "Data-Minimization (Derived Features Only)"
    }

@app.get("/", tags=["Root"])
def root_info():
    return {
        "name": "VoiceGuard AI API",
        "description": "Real-time AI voice cloning and impersonation detection gateway.",
        "docs_url": "/docs",
        "endpoints": {
            "analyze_rest": "POST /analyze or POST /api/analyze",
            "stream_ws": "ws://localhost:8000/ws/stream",
            "auth": "POST /api/auth/login",
            "payments": "POST /api/payments/create-order",
            "logs": "GET /api/logs",
            "analytics": "GET /api/logs/analytics"
        }
    }
