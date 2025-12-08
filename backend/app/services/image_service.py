"""
Image processing service
Handles base64 decoding and image cropping for detection regions
"""

import base64
import cv2
import numpy as np
from typing import List, Tuple, Optional
import re
from loguru import logger


def decode_base64_image(data_url: str) -> np.ndarray:
    """
    Decode a base64 data URL to a numpy array (BGR format for OpenCV)
    
    Args:
        data_url: Base64 data URL (e.g., "data:image/jpeg;base64,...")
        
    Returns:
        numpy array in BGR format
        
    Raises:
        ValueError: If image cannot be decoded
    """
    try:
        # Strip the data URL prefix if present
        if data_url.startswith('data:'):
            # Match pattern like "data:image/jpeg;base64," or "data:image/png;base64,"
            match = re.match(r'data:image/[^;]+;base64,', data_url)
            if match:
                data_url = data_url[match.end():]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(data_url)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode image using OpenCV
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError("Failed to decode image - invalid image data")
        
        logger.debug(f"Decoded image: shape={image.shape}, dtype={image.dtype}")
        return image
        
    except Exception as e:
        logger.error(f"Error decoding base64 image: {e}")
        raise ValueError(f"Failed to decode image: {str(e)}")


def encode_image_to_base64(image: np.ndarray, format: str = "jpeg", quality: int = 85) -> str:
    """
    Encode a numpy array image to base64 data URL
    
    Args:
        image: numpy array in BGR format
        format: Output format (jpeg or png)
        quality: JPEG quality (1-100)
        
    Returns:
        Base64 data URL string
    """
    try:
        if format.lower() == "jpeg":
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
            ext = ".jpg"
            mime = "image/jpeg"
        else:
            encode_param = [int(cv2.IMWRITE_PNG_COMPRESSION), 9]
            ext = ".png"
            mime = "image/png"
        
        success, buffer = cv2.imencode(ext, image, encode_param)
        if not success:
            raise ValueError("Failed to encode image")
        
        base64_str = base64.b64encode(buffer).decode('utf-8')
        return f"data:{mime};base64,{base64_str}"
        
    except Exception as e:
        logger.error(f"Error encoding image to base64: {e}")
        raise ValueError(f"Failed to encode image: {str(e)}")


def crop_detection(
    image: np.ndarray,
    bbox: List[float],
    padding: float = 0.05
) -> np.ndarray:
    """
    Crop a region from the image based on bounding box coordinates
    
    Args:
        image: Full image as numpy array (BGR)
        bbox: Bounding box [x1, y1, x2, y2] in pixel coordinates
        padding: Percentage padding to add around the crop (0.05 = 5%)
        
    Returns:
        Cropped image region as numpy array
    """
    try:
        height, width = image.shape[:2]
        
        # Extract bbox coordinates
        x1, y1, x2, y2 = bbox
        
        # Calculate box dimensions
        box_width = x2 - x1
        box_height = y2 - y1
        
        # Add padding
        pad_x = int(box_width * padding)
        pad_y = int(box_height * padding)
        
        # Calculate padded coordinates with bounds checking
        x1_padded = max(0, int(x1 - pad_x))
        y1_padded = max(0, int(y1 - pad_y))
        x2_padded = min(width, int(x2 + pad_x))
        y2_padded = min(height, int(y2 + pad_y))
        
        # Crop the image
        cropped = image[y1_padded:y2_padded, x1_padded:x2_padded]
        
        if cropped.size == 0:
            logger.warning(f"Empty crop for bbox {bbox}")
            raise ValueError("Empty crop region")
        
        logger.debug(f"Cropped region: {cropped.shape} from bbox {bbox}")
        return cropped
        
    except Exception as e:
        logger.error(f"Error cropping detection: {e}")
        raise ValueError(f"Failed to crop detection: {str(e)}")


def resize_image(
    image: np.ndarray,
    max_size: int = 1280
) -> Tuple[np.ndarray, float]:
    """
    Resize image if it's larger than max_size while maintaining aspect ratio
    
    Args:
        image: Image as numpy array
        max_size: Maximum dimension size
        
    Returns:
        Tuple of (resized_image, scale_factor)
    """
    height, width = image.shape[:2]
    
    if max(height, width) <= max_size:
        return image, 1.0
    
    if width > height:
        scale = max_size / width
    else:
        scale = max_size / height
    
    new_width = int(width * scale)
    new_height = int(height * scale)
    
    resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
    logger.debug(f"Resized image from {width}x{height} to {new_width}x{new_height}")
    
    return resized, scale


def convert_bgr_to_rgb(image: np.ndarray) -> np.ndarray:
    """Convert BGR image to RGB"""
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def convert_rgb_to_bgr(image: np.ndarray) -> np.ndarray:
    """Convert RGB image to BGR"""
    return cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
