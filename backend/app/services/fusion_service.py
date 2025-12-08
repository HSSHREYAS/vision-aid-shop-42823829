"""
Fusion Service
Combines YOLO detections with OCR results and builds summaries
"""

from typing import List
from loguru import logger

from app.models.schemas import Detection


def clean_detections(
    detections: List[Detection],
    min_confidence: float = 0.25
) -> List[Detection]:
    """
    Filter and sort detections by confidence
    
    Args:
        detections: List of Detection objects
        min_confidence: Minimum confidence threshold
        
    Returns:
        Filtered and sorted list of detections
    """
    # Filter by confidence
    filtered = [d for d in detections if d.confidence >= min_confidence]
    
    # Sort by confidence (descending)
    sorted_detections = sorted(filtered, key=lambda x: x.confidence, reverse=True)
    
    logger.debug(f"Cleaned {len(detections)} -> {len(sorted_detections)} detections")
    return sorted_detections


def build_summary(detections: List[Detection]) -> str:
    """
    Build a natural language summary of detected products
    
    Args:
        detections: List of Detection objects
        
    Returns:
        Human-readable summary string
    """
    if not detections:
        return "No products detected."
    
    count = len(detections)
    summary_parts = [f"Detected {count} item{'s' if count > 1 else ''}."]
    
    for i, detection in enumerate(detections, 1):
        # Build item description
        parts = []
        
        if detection.brand:
            parts.append(detection.brand)
        
        if detection.product_name:
            parts.append(detection.product_name)
        elif detection.class_name:
            # Format class name nicely (replace underscores, title case)
            nice_name = detection.class_name.replace('_', ' ').title()
            parts.append(nice_name)
        
        if detection.quantity_text:
            parts.append(detection.quantity_text)
        
        item_desc = " ".join(parts) if parts else "Unknown product"
        confidence_pct = int(detection.confidence * 100)
        
        summary_parts.append(f"Item {i}: {item_desc}. Confidence {confidence_pct} percent.")
    
    summary = " ".join(summary_parts)
    logger.debug(f"Built summary: {summary}")
    return summary


def format_detection_label(detection: Detection) -> str:
    """
    Create a display label for a detection
    
    Args:
        detection: Detection object
        
    Returns:
        Formatted label string
    """
    parts = []
    
    if detection.brand:
        parts.append(detection.brand)
    
    if detection.product_name:
        parts.append(detection.product_name)
    elif detection.class_name:
        parts.append(detection.class_name.replace('_', ' ').title())
    
    if detection.quantity_text:
        parts.append(f"({detection.quantity_text})")
    
    return " ".join(parts) if parts else "Unknown Product"


def merge_ocr_with_detection(
    detection: Detection,
    ocr_result: dict
) -> Detection:
    """
    Merge OCR results into a detection object
    
    Args:
        detection: Original detection
        ocr_result: OCR result dictionary with brand, product_name, quantity_text, raw_text
        
    Returns:
        Updated detection with OCR data
    """
    return Detection(
        id=detection.id,
        bbox=detection.bbox,
        class_name=detection.class_name,
        confidence=detection.confidence,
        brand=ocr_result.get("brand"),
        product_name=ocr_result.get("product_name"),
        quantity_text=ocr_result.get("quantity_text"),
        raw_text=ocr_result.get("raw_text")
    )
