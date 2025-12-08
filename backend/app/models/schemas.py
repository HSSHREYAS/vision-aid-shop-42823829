"""
Pydantic schemas for API request/response models
These match the frontend TypeScript types
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ============================================================
# Detection & Prediction Schemas
# ============================================================

class BoundingBox(BaseModel):
    """Bounding box coordinates"""
    x1: float
    y1: float
    x2: float
    y2: float


class Detection(BaseModel):
    """Single product detection result"""
    id: str = Field(..., description="Unique detection ID")
    bbox: List[float] = Field(..., description="Bounding box [x1, y1, x2, y2]")
    class_name: str = Field(..., description="YOLO class name")
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence")
    brand: Optional[str] = Field(None, description="Brand from OCR")
    product_name: Optional[str] = Field(None, description="Product name from OCR")
    quantity_text: Optional[str] = Field(None, description="Quantity text from OCR (e.g., 500ml)")
    raw_text: Optional[str] = Field(None, description="Raw OCR text")


class PredictionRequest(BaseModel):
    """Request for product detection"""
    image: str = Field(..., description="Base64 data URL (data:image/jpeg;base64,...)")
    include_audio: bool = Field(True, description="Generate TTS audio summary")
    language: str = Field("en", description="Language for TTS")
    min_confidence: float = Field(0.25, ge=0, le=1, description="Minimum confidence threshold")


class PredictionResponse(BaseModel):
    """Response from product detection"""
    status: str = Field(..., description="'ok' or 'error'")
    detections: List[Detection] = Field(default_factory=list)
    summary: Optional[str] = Field(None, description="Natural language summary")
    audio_url: Optional[str] = Field(None, description="URL to TTS audio file")
    processing_time_ms: Optional[int] = Field(None, description="Processing time in milliseconds")
    total_items: Optional[int] = Field(None, description="Total detected items")


# ============================================================
# Product Schemas
# ============================================================

class ProductVariant(BaseModel):
    """Product size variant with pricing"""
    size: str = Field(..., description="Size label (e.g., 500ml, 1L)")
    price: float = Field(..., ge=0, description="Price in currency units")
    currency: str = Field("INR", description="Currency code")


class ProductMatch(BaseModel):
    """Product search result"""
    product_id: str = Field(..., description="Unique product ID")
    brand: str = Field(..., description="Brand name")
    name: str = Field(..., description="Product name")
    description: Optional[str] = Field(None, description="Product description")
    image_url: Optional[str] = Field(None, description="Product image URL")
    available_sizes: List[str] = Field(default_factory=list, description="Available sizes")
    available_quantities: List[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5, 10], description="Available quantities")
    variants: List[ProductVariant] = Field(default_factory=list, description="Size variants with prices")


class ProductSearchRequest(BaseModel):
    """Product search request"""
    brand: Optional[str] = Field(None, description="Brand to search for")
    name: Optional[str] = Field(None, description="Product name to search for")
    quantity: Optional[str] = Field(None, description="Quantity text")


class ProductSearchResponse(BaseModel):
    """Product search response"""
    status: str = Field(..., description="'ok' or 'fallback'")
    matches: List[ProductMatch] = Field(default_factory=list)


# ============================================================
# Order Schemas
# ============================================================

class OrderItem(BaseModel):
    """Single item in an order"""
    product_id: str = Field(..., description="Product ID")
    size: str = Field(..., description="Selected size")
    quantity: int = Field(..., ge=1, description="Quantity")
    unit_price: float = Field(..., ge=0, description="Price per unit")


class OrderRequest(BaseModel):
    """Order creation request"""
    items: List[OrderItem] = Field(..., min_length=1, description="Order items")
    total_amount: float = Field(..., ge=0, description="Total order amount")
    currency: str = Field("INR", description="Currency code")


class OrderResponse(BaseModel):
    """Order creation response"""
    status: str = Field(..., description="'confirmed' or 'error'")
    order_id: Optional[str] = Field(None, description="Generated order ID")
    message: Optional[str] = Field(None, description="Additional message")


# ============================================================
# Health Check Schema
# ============================================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="'healthy' or 'unhealthy'")
    model_loaded: bool = Field(..., description="YOLO model loaded status")
    gemini_configured: bool = Field(..., description="Gemini API configured status")
    services: dict = Field(default_factory=dict, description="Service status map")
    timestamp: Optional[str] = Field(None, description="Server timestamp")


# ============================================================
# Error Schema
# ============================================================

class ErrorResponse(BaseModel):
    """Error response"""
    status: str = "error"
    message: str
    detail: Optional[str] = None
