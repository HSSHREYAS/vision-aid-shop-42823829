"""
API Routes for SmartShop AI Backend
All endpoints for detection, products, and orders
"""

import time
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from loguru import logger

from app.db import get_db
from app.config import get_settings
from app.models.schemas import (
    PredictionRequest, PredictionResponse, Detection,
    ProductSearchResponse, ProductMatch,
    OrderRequest, OrderResponse,
    HealthResponse, ErrorResponse
)
from app.services.image_service import decode_base64_image, crop_detection
from app.services.yolo_service import get_yolo_service
from app.services.ocr_service import get_ocr_service
from app.services.tts_service import get_tts_service
from app.services.product_service import ProductService, get_fallback_product
from app.services.fusion_service import clean_detections, build_summary, merge_ocr_with_detection
from app.models.db_models import Order, OrderItem

settings = get_settings()
router = APIRouter(prefix="/api/v1", tags=["api"])


# ============================================================
# Health Check
# ============================================================

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Check the health status of all backend services
    """
    yolo_service = get_yolo_service()
    ocr_service = get_ocr_service()
    tts_service = get_tts_service()
    
    return HealthResponse(
        status="healthy",
        model_loaded=yolo_service.is_loaded(),
        gemini_configured=ocr_service.is_configured(),
        services={
            "yolo": yolo_service.is_loaded(),
            "ocr": ocr_service.is_configured(),
            "tts": tts_service.is_enabled(),
            "database": True
        },
        timestamp=datetime.utcnow().isoformat()
    )


# ============================================================
# Product Detection
# ============================================================

@router.post("/predict", response_model=PredictionResponse)
async def predict_products(request: PredictionRequest):
    """
    Detect products in an image using YOLOv8 and extract details with Gemini OCR
    
    Flow:
    1. Decode base64 image
    2. Run YOLO detection
    3. For each detection, crop and run OCR
    4. Build summary and optional TTS audio
    """
    start_time = time.time()
    
    try:
        # 1. Decode image
        logger.info("Decoding image...")
        image = decode_base64_image(request.image)
        
        # 2. Run YOLO detection
        logger.info("Running YOLO detection...")
        yolo_service = get_yolo_service()
        detections = yolo_service.detect_products(image, request.min_confidence)
        
        # 3. Run OCR on each detection (if not in mock mode)
        if settings.DETECTION_MODE != "mock":
            logger.info("Running OCR on detections...")
            ocr_service = get_ocr_service()
            
            enriched_detections = []
            for detection in detections:
                try:
                    # Crop the detection region
                    crop = crop_detection(image, detection.bbox, padding=0.1)
                    
                    # Run OCR on crop
                    ocr_result = ocr_service.process_crop(crop)
                    
                    # Merge OCR result with detection
                    enriched = merge_ocr_with_detection(detection, ocr_result)
                    enriched_detections.append(enriched)
                    
                except Exception as e:
                    logger.warning(f"OCR failed for detection {detection.id}: {e}")
                    enriched_detections.append(detection)
            
            detections = enriched_detections
        
        # 4. Clean and filter detections
        detections = clean_detections(detections, request.min_confidence)
        
        # 5. Build summary
        summary = build_summary(detections)
        
        # 6. Generate TTS audio if requested
        audio_url = None
        if request.include_audio and summary:
            logger.info("Generating TTS audio...")
            tts_service = get_tts_service()
            audio_url = tts_service.generate_audio(summary, request.language)
        
        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"Prediction complete: {len(detections)} items in {processing_time}ms")
        
        return PredictionResponse(
            status="ok",
            detections=detections,
            summary=summary,
            audio_url=audio_url,
            processing_time_ms=processing_time,
            total_items=len(detections)
        )
        
    except ValueError as e:
        logger.error(f"Invalid input: {e}")
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ============================================================
# Product Search
# ============================================================

@router.get("/products/search", response_model=ProductSearchResponse)
async def search_products(
    brand: Optional[str] = Query(None, description="Brand name to search"),
    name: Optional[str] = Query(None, description="Product name to search"),
    quantity: Optional[str] = Query(None, description="Quantity text"),
    db: Session = Depends(get_db)
):
    """
    Search for products in the database
    Returns pricing and variant information
    """
    try:
        product_service = ProductService(db)
        matches = product_service.search_products(brand, name, quantity)
        
        if matches:
            return ProductSearchResponse(
                status="ok",
                matches=matches
            )
        else:
            # Return fallback product if no matches found
            fallback = get_fallback_product(brand, name, quantity)
            return ProductSearchResponse(
                status="fallback",
                matches=[fallback]
            )
            
    except Exception as e:
        logger.error(f"Product search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/products", response_model=ProductSearchResponse)
async def get_all_products(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Get all products from the database
    """
    try:
        product_service = ProductService(db)
        matches = product_service.get_all_products(limit)
        
        return ProductSearchResponse(
            status="ok",
            matches=matches
        )
        
    except Exception as e:
        logger.error(f"Get products error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Orders
# ============================================================

@router.post("/orders", response_model=OrderResponse)
async def create_order(
    order_request: OrderRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new order
    """
    try:
        # Validate order
        if not order_request.items:
            raise HTTPException(status_code=400, detail="Order must have at least one item")
        
        if order_request.total_amount <= 0:
            raise HTTPException(status_code=400, detail="Total amount must be positive")
        
        # Generate order ID
        order_id = f"ORD-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Create order in database
        order = Order(
            order_id=order_id,
            total_amount=order_request.total_amount,
            currency=order_request.currency,
            status="confirmed"
        )
        db.add(order)
        db.flush()  # Get the order ID
        
        # Add order items
        for item in order_request.items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                size=item.size,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.unit_price * item.quantity
            )
            db.add(order_item)
        
        db.commit()
        
        logger.info(f"Order created: {order_id}, total: {order_request.total_amount}")
        
        return OrderResponse(
            status="confirmed",
            order_id=order_id,
            message=f"Order {order_id} has been placed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Order creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")
