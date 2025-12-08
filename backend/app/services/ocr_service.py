"""
OCR Service using Google Gemini Vision
Extracts brand, product name, and quantity from product images
"""

import numpy as np
import cv2
import base64
from typing import Dict, Optional
from loguru import logger

from app.config import get_settings

settings = get_settings()


class OCRService:
    """Service for OCR using Gemini Vision"""
    
    def __init__(self):
        self.client = None
        self.model = None
        self.configured = False
        
        if settings.GEMINI_API_KEY:
            self._initialize_client()
        else:
            logger.warning("GEMINI_API_KEY not configured - OCR will return defaults")
    
    def _initialize_client(self):
        """Initialize the Gemini client"""
        try:
            import google.generativeai as genai
            
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            self.configured = True
            logger.info(f"Gemini OCR initialized with model: {settings.GEMINI_MODEL}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            self.configured = False
    
    def is_configured(self) -> bool:
        """Check if Gemini is configured"""
        return self.configured
    
    def process_crop(self, image: np.ndarray) -> Dict[str, Optional[str]]:
        """
        Process a cropped product image and extract text information
        
        Args:
            image: Cropped product image as numpy array (BGR)
            
        Returns:
            Dictionary with brand, product_name, quantity_text, and raw_text
        """
        default_result = {
            "brand": None,
            "product_name": None,
            "quantity_text": None,
            "raw_text": None
        }
        
        if not self.configured:
            logger.debug("Gemini not configured, returning defaults")
            return default_result
        
        try:
            # Convert BGR to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Encode image to base64
            _, buffer = cv2.imencode('.jpg', image_rgb)
            image_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Create the prompt
            prompt = """You are reading a supermarket product label image.
Extract the following details in EXACTLY this format (one per line):

Brand: <brand_name or Unknown>
Product: <short product name or Unknown>
Quantity: <quantity like 500ml, 1L, 100g, 10pcs or Unknown>
Other: <any other relevant text, optional>

Be concise and accurate. If you cannot determine a field, write "Unknown".
Only extract what you can clearly see in the image."""

            # Create image part for Gemini
            import google.generativeai as genai
            
            image_part = {
                "mime_type": "image/jpeg",
                "data": image_base64
            }
            
            # Generate response
            response = self.model.generate_content([prompt, image_part])
            
            if response and response.text:
                return self._parse_ocr_response(response.text)
            else:
                logger.warning("Empty response from Gemini")
                return default_result
                
        except Exception as e:
            logger.error(f"OCR processing error: {e}")
            return default_result
    
    def _parse_ocr_response(self, text: str) -> Dict[str, Optional[str]]:
        """
        Parse the structured OCR response from Gemini
        
        Args:
            text: Raw text response from Gemini
            
        Returns:
            Parsed dictionary with brand, product_name, quantity_text, raw_text
        """
        result = {
            "brand": None,
            "product_name": None,
            "quantity_text": None,
            "raw_text": text.strip() if text else None
        }
        
        try:
            lines = text.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                if not line or ':' not in line:
                    continue
                
                # Split on first colon
                key, value = line.split(':', 1)
                key = key.strip().lower()
                value = value.strip()
                
                # Skip "Unknown" values
                if value.lower() == "unknown" or not value:
                    continue
                
                if key == "brand":
                    result["brand"] = value
                elif key == "product":
                    result["product_name"] = value
                elif key == "quantity":
                    result["quantity_text"] = value
            
            logger.debug(f"Parsed OCR result: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error parsing OCR response: {e}")
            return result


# Singleton instance
_ocr_service: Optional[OCRService] = None


def get_ocr_service() -> OCRService:
    """Get or create the OCR service singleton"""
    global _ocr_service
    if _ocr_service is None:
        _ocr_service = OCRService()
    return _ocr_service
