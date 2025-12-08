"""
Configuration settings for SmartShop AI Backend
Uses pydantic-settings for environment variable management
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "SmartShop AI Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # YOLO Model Configuration
    YOLO_MODEL_PATH: str = Field(
        default="./models/best.pt",
        description="Path to the trained YOLOv8 model"
    )
    YOLO_DEVICE: str = Field(
        default="cpu",
        description="Device for YOLO inference (cpu, cuda:0, etc.)"
    )
    YOLO_CONFIDENCE_THRESHOLD: float = Field(
        default=0.25,
        description="Minimum confidence threshold for detections"
    )
    
    # Detection Mode (mock for testing, yolo for production)
    DETECTION_MODE: str = Field(
        default="yolo",
        description="Detection mode: 'yolo' for real detection, 'mock' for testing"
    )
    
    # Gemini Vision OCR Configuration
    GEMINI_API_KEY: Optional[str] = Field(
        default=None,
        description="Google Gemini API key for Vision OCR"
    )
    GEMINI_MODEL: str = Field(
        default="gemini-2.0-flash",
        description="Gemini model name for vision tasks"
    )
    
    # Text-to-Speech Configuration
    TTS_ENABLED: bool = Field(
        default=True,
        description="Enable/disable TTS audio generation"
    )
    TTS_LANGUAGE: str = Field(
        default="en",
        description="Default TTS language"
    )
    
    # CORS Configuration
    FRONTEND_ORIGIN: str = Field(
        default="http://localhost:5173",
        description="Frontend origin for CORS (Vite dev server)"
    )
    CORS_ALLOW_ALL: bool = Field(
        default=True,
        description="Allow all origins (dev mode)"
    )
    
    # Database Configuration
    DATABASE_URL: str = Field(
        default="sqlite:///./app.db",
        description="Database connection URL"
    )
    
    # Storage paths
    AUDIO_STORAGE_PATH: str = Field(
        default="./storage/audio",
        description="Path to store generated audio files"
    )
    PRODUCT_IMAGES_PATH: str = Field(
        default="./storage/products",
        description="Path to store product images"
    )
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"
    
    def ensure_directories(self):
        """Ensure all required directories exist"""
        directories = [
            self.AUDIO_STORAGE_PATH,
            self.PRODUCT_IMAGES_PATH,
            os.path.dirname(self.YOLO_MODEL_PATH) if self.YOLO_MODEL_PATH else None,
        ]
        for directory in directories:
            if directory and not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    settings = Settings()
    settings.ensure_directories()
    return settings
