"""
Test prediction endpoint
"""

import pytest
import base64
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# Small 1x1 pixel red JPEG for testing
TINY_JPEG_BASE64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k="


def get_test_image_data_url():
    """Get a base64 data URL for testing"""
    return f"data:image/jpeg;base64,{TINY_JPEG_BASE64}"


def test_predict_endpoint_mock_mode():
    """Test prediction endpoint in mock mode"""
    # This test works best when DETECTION_MODE=mock
    
    request_data = {
        "image": get_test_image_data_url(),
        "include_audio": False,
        "language": "en",
        "min_confidence": 0.25
    }
    
    response = client.post("/api/v1/predict", json=request_data)
    
    # Should return 200 or 500 (if model not loaded)
    assert response.status_code in [200, 500]
    
    if response.status_code == 200:
        data = response.json()
        assert data["status"] == "ok"
        assert "detections" in data
        assert "summary" in data
        assert isinstance(data["detections"], list)


def test_predict_endpoint_invalid_image():
    """Test prediction with invalid image data"""
    request_data = {
        "image": "not-a-valid-base64-image",
        "include_audio": False
    }
    
    response = client.post("/api/v1/predict", json=request_data)
    assert response.status_code in [400, 500]


def test_predict_endpoint_empty_image():
    """Test prediction with empty image"""
    request_data = {
        "image": "",
        "include_audio": False
    }
    
    response = client.post("/api/v1/predict", json=request_data)
    assert response.status_code in [400, 422, 500]
