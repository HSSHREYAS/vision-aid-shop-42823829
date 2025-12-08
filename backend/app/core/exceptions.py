"""
Custom exception classes for the backend
"""

from fastapi import HTTPException


class ImageProcessingError(HTTPException):
    """Error during image processing"""
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=f"Image processing error: {detail}")


class DetectionError(HTTPException):
    """Error during object detection"""
    def __init__(self, detail: str):
        super().__init__(status_code=500, detail=f"Detection error: {detail}")


class OCRError(HTTPException):
    """Error during OCR processing"""
    def __init__(self, detail: str):
        super().__init__(status_code=500, detail=f"OCR error: {detail}")


class ProductNotFoundError(HTTPException):
    """Product not found in database"""
    def __init__(self, product_id: str):
        super().__init__(status_code=404, detail=f"Product not found: {product_id}")


class OrderError(HTTPException):
    """Error during order processing"""
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=f"Order error: {detail}")
