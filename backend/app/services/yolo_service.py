"""
YOLOv8 Object Detection Service
Handles product detection using trained YOLOv8 model
"""

import numpy as np
from typing import List, Optional
import uuid
from loguru import logger

from app.config import get_settings
from app.models.schemas import Detection

settings = get_settings()


class YOLOService:
    """Service for YOLO-based product detection"""
    
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self.class_names = {}
        
        if settings.DETECTION_MODE == "yolo":
            self._load_model()
        else:
            logger.info("Running in mock detection mode")
    
    def _load_model(self):
        """Load the YOLOv8 model"""
        try:
            from ultralytics import YOLO
            
            model_path = settings.YOLO_MODEL_PATH
            logger.info(f"Loading YOLO model from: {model_path}")
            
            self.model = YOLO(model_path)
            self.model_loaded = True
            
            # Get class names from model
            if hasattr(self.model, 'names'):
                self.class_names = self.model.names
                logger.info(f"Model loaded with classes: {self.class_names}")
            
            logger.info("YOLO model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.model_loaded = False
            raise RuntimeError(f"Failed to load YOLO model: {e}")
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model_loaded or settings.DETECTION_MODE == "mock"
    
    def detect_products(
        self,
        image: np.ndarray,
        min_confidence: float = 0.25
    ) -> List[Detection]:
        """
        Run product detection on an image
        
        Args:
            image: Image as numpy array (BGR format)
            min_confidence: Minimum confidence threshold
            
        Returns:
            List of Detection objects
        """
        if settings.DETECTION_MODE == "mock":
            return self._get_mock_detections(image)
        
        if not self.model_loaded:
            raise RuntimeError("YOLO model not loaded")
        
        try:
            # Run inference
            results = self.model(
                image,
                conf=min_confidence,
                device=settings.YOLO_DEVICE,
                verbose=False
            )
            
            detections = []
            
            for result in results:
                if result.boxes is None:
                    continue
                
                for i, box in enumerate(result.boxes):
                    # Get bounding box coordinates
                    xyxy = box.xyxy[0].cpu().numpy()
                    x1, y1, x2, y2 = float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])
                    
                    # Get confidence and class
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    class_name = self.class_names.get(class_id, f"class_{class_id}")
                    
                    # Create detection object
                    detection = Detection(
                        id=str(uuid.uuid4()),
                        bbox=[x1, y1, x2, y2],
                        class_name=class_name,
                        confidence=round(confidence, 3),
                        brand=None,
                        product_name=None,
                        quantity_text=None,
                        raw_text=None
                    )
                    detections.append(detection)
            
            logger.info(f"Detected {len(detections)} products")
            return detections
            
        except Exception as e:
            logger.error(f"Error during detection: {e}")
            raise RuntimeError(f"Detection failed: {e}")
    
    def _get_mock_detections(self, image: np.ndarray) -> List[Detection]:
        """
        Return mock detections for testing
        """
        height, width = image.shape[:2]
        
        mock_detections = [
            Detection(
                id=str(uuid.uuid4()),
                bbox=[width * 0.1, height * 0.1, width * 0.4, height * 0.5],
                class_name="milk_pack",
                confidence=0.92,
                brand="Amul",
                product_name="Full Cream Milk",
                quantity_text="500ml",
                raw_text="Amul Full Cream Milk 500ml"
            ),
            Detection(
                id=str(uuid.uuid4()),
                bbox=[width * 0.5, height * 0.2, width * 0.9, height * 0.6],
                class_name="biscuit_pack",
                confidence=0.87,
                brand="Parle",
                product_name="Marie Gold",
                quantity_text="100g",
                raw_text="Parle Marie Gold Biscuits 100g"
            )
        ]
        
        logger.info(f"Returning {len(mock_detections)} mock detections")
        return mock_detections
    
    def get_class_names(self) -> dict:
        """Get the class names mapping"""
        return self.class_names


# Singleton instance
_yolo_service: Optional[YOLOService] = None


def get_yolo_service() -> YOLOService:
    """Get or create the YOLO service singleton"""
    global _yolo_service
    if _yolo_service is None:
        _yolo_service = YOLOService()
    return _yolo_service
