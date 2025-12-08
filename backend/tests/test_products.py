"""
Test product search endpoint
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db import init_db

client = TestClient(app)


def test_product_search_no_params():
    """Test product search with no parameters"""
    response = client.get("/api/v1/products/search")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] in ["ok", "fallback"]
    assert "matches" in data
    assert isinstance(data["matches"], list)


def test_product_search_by_brand():
    """Test product search by brand"""
    response = client.get("/api/v1/products/search", params={"brand": "amul"})
    assert response.status_code == 200
    
    data = response.json()
    assert "matches" in data


def test_product_search_by_name():
    """Test product search by name"""
    response = client.get("/api/v1/products/search", params={"name": "milk"})
    assert response.status_code == 200
    
    data = response.json()
    assert "matches" in data


def test_product_search_combined():
    """Test product search with brand and name"""
    response = client.get("/api/v1/products/search", params={
        "brand": "amul",
        "name": "milk",
        "quantity": "500ml"
    })
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] in ["ok", "fallback"]
    assert "matches" in data


def test_get_all_products():
    """Test getting all products"""
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    
    data = response.json()
    assert "matches" in data
    assert isinstance(data["matches"], list)


def test_product_match_schema():
    """Test that product matches have correct schema"""
    response = client.get("/api/v1/products/search", params={"brand": "test"})
    
    if response.status_code == 200:
        data = response.json()
        if data["matches"]:
            match = data["matches"][0]
            assert "product_id" in match
            assert "brand" in match
            assert "name" in match
            assert "variants" in match
            assert "available_sizes" in match
