"""
SmartShop AI Backend - FastAPI Application
Main entry point for the backend server
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from loguru import logger
import time

# Add app to path for imports when running with uvicorn
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings
from app.db import init_db
from app.api.routes import router


# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="DEBUG"
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Ensure directories exist
    settings.ensure_directories()
    
    # Initialize database
    logger.info("Initializing database...")
    init_db()
    
    # Preload YOLO model
    if settings.DETECTION_MODE == "yolo":
        logger.info("Loading YOLO model...")
        from app.services.yolo_service import get_yolo_service
        try:
            yolo_service = get_yolo_service()
            if yolo_service.is_loaded():
                logger.info("YOLO model loaded successfully")
            else:
                logger.warning("YOLO model not loaded - check YOLO_MODEL_PATH")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
    else:
        logger.info("Running in MOCK detection mode")
    
    # Check Gemini configuration
    from app.services.ocr_service import get_ocr_service
    ocr_service = get_ocr_service()
    if ocr_service.is_configured():
        logger.info("Gemini OCR configured")
    else:
        logger.warning("Gemini OCR not configured - OCR will return defaults")
    
    logger.info(f"Server ready at http://{settings.HOST}:{settings.PORT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered shopping assistant backend with YOLOv8 and Gemini Vision",
    lifespan=lifespan
)


# ============================================================
# CORS Middleware
# ============================================================

origins = ["*"] if settings.CORS_ALLOW_ALL else [settings.FRONTEND_ORIGIN]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Request Timing Middleware
# ============================================================

@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    """Add X-Process-Time header to responses"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))
    return response


# ============================================================
# Exception Handlers
# ============================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An unexpected error occurred",
            "detail": str(exc) if settings.DEBUG else None
        }
    )


# ============================================================
# Mount Static Files
# ============================================================

# Create audio directory if it doesn't exist
os.makedirs(settings.AUDIO_STORAGE_PATH, exist_ok=True)

# Mount audio files for TTS playback
app.mount("/audio", StaticFiles(directory=settings.AUDIO_STORAGE_PATH), name="audio")


# ============================================================
# Include API Routes
# ============================================================

app.include_router(router)


# ============================================================
# Root Endpoint
# ============================================================

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


# ============================================================
# Run with Uvicorn (for development)
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
