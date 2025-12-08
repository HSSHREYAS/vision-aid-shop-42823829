"""
Database Seed Script
Populates the database with sample products from CSV or hardcoded data

Usage:
    python -m scripts.seed_products
    
    Or from backend directory:
    python scripts/seed_products.py
"""

import os
import sys
import csv
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db import init_db, get_db_context
from app.models.db_models import Product, ProductVariant
from loguru import logger


# Default sample products if no CSV is provided
SAMPLE_PRODUCTS = [
    {
        "product_id": "PROD-001",
        "brand": "Amul",
        "name": "Full Cream Milk",
        "description": "Fresh full cream milk from Amul",
        "category": "Dairy",
        "variants": [
            {"size": "500ml", "price": 30.0},
            {"size": "1L", "price": 58.0}
        ]
    },
    {
        "product_id": "PROD-002",
        "brand": "Amul",
        "name": "Toned Milk",
        "description": "Low fat toned milk",
        "category": "Dairy",
        "variants": [
            {"size": "500ml", "price": 26.0},
            {"size": "1L", "price": 50.0}
        ]
    },
    {
        "product_id": "PROD-003",
        "brand": "Parle",
        "name": "Marie Gold",
        "description": "Classic Marie biscuits",
        "category": "Biscuits",
        "variants": [
            {"size": "100g", "price": 20.0},
            {"size": "200g", "price": 38.0},
            {"size": "500g", "price": 85.0}
        ]
    },
    {
        "product_id": "PROD-004",
        "brand": "Parle",
        "name": "Hide & Seek",
        "description": "Chocolate chip cookies",
        "category": "Biscuits",
        "variants": [
            {"size": "100g", "price": 35.0},
            {"size": "200g", "price": 65.0}
        ]
    },
    {
        "product_id": "PROD-005",
        "brand": "Tata",
        "name": "Tea Gold",
        "description": "Premium black tea",
        "category": "Beverages",
        "variants": [
            {"size": "250g", "price": 125.0},
            {"size": "500g", "price": 240.0},
            {"size": "1kg", "price": 450.0}
        ]
    },
    {
        "product_id": "PROD-006",
        "brand": "Britannia",
        "name": "Good Day",
        "description": "Butter cookies",
        "category": "Biscuits",
        "variants": [
            {"size": "100g", "price": 25.0},
            {"size": "200g", "price": 48.0}
        ]
    },
    {
        "product_id": "PROD-007",
        "brand": "Nestle",
        "name": "Maggi Noodles",
        "description": "2-minute instant noodles",
        "category": "Instant Food",
        "variants": [
            {"size": "70g", "price": 14.0},
            {"size": "140g", "price": 28.0},
            {"size": "280g", "price": 52.0}
        ]
    },
    {
        "product_id": "PROD-008",
        "brand": "Haldiram",
        "name": "Aloo Bhujia",
        "description": "Crispy potato snack",
        "category": "Snacks",
        "variants": [
            {"size": "150g", "price": 50.0},
            {"size": "400g", "price": 120.0}
        ]
    },
    {
        "product_id": "PROD-009",
        "brand": "Coca-Cola",
        "name": "Coca-Cola",
        "description": "Refreshing cola drink",
        "category": "Beverages",
        "variants": [
            {"size": "250ml", "price": 20.0},
            {"size": "500ml", "price": 40.0},
            {"size": "1.25L", "price": 75.0},
            {"size": "2L", "price": 95.0}
        ]
    },
    {
        "product_id": "PROD-010",
        "brand": "Lays",
        "name": "Classic Salted",
        "description": "Crispy potato chips",
        "category": "Snacks",
        "variants": [
            {"size": "25g", "price": 10.0},
            {"size": "52g", "price": 20.0},
            {"size": "95g", "price": 40.0}
        ]
    }
]


def load_from_csv(csv_path: str) -> list:
    """
    Load products from a CSV file
    
    Expected CSV format:
    product_id,brand,name,description,category,size,price
    
    Multiple rows with same product_id will create multiple variants
    """
    products = {}
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                product_id = row.get('product_id', '').strip()
                if not product_id:
                    continue
                
                if product_id not in products:
                    products[product_id] = {
                        "product_id": product_id,
                        "brand": row.get('brand', 'Unknown').strip(),
                        "name": row.get('name', 'Unknown Product').strip(),
                        "description": row.get('description', '').strip(),
                        "category": row.get('category', '').strip(),
                        "variants": []
                    }
                
                # Add variant
                size = row.get('size', 'Standard').strip()
                price = float(row.get('price', 99.0))
                products[product_id]["variants"].append({
                    "size": size,
                    "price": price
                })
        
        logger.info(f"Loaded {len(products)} products from CSV")
        return list(products.values())
        
    except Exception as e:
        logger.error(f"Error loading CSV: {e}")
        return []


def seed_database(products: list = None):
    """Seed the database with products"""
    
    # Initialize database tables
    init_db()
    
    # Use provided products or default samples
    if products is None:
        products = SAMPLE_PRODUCTS
    
    with get_db_context() as db:
        # Check if products already exist
        existing_count = db.query(Product).count()
        if existing_count > 0:
            logger.info(f"Database already has {existing_count} products. Skipping seed.")
            return
        
        # Add products
        for product_data in products:
            product = Product(
                product_id=product_data["product_id"],
                brand=product_data["brand"],
                name=product_data["name"],
                description=product_data.get("description", ""),
                category=product_data.get("category", ""),
                is_active=True
            )
            db.add(product)
            db.flush()  # Get the product ID
            
            # Add variants
            for variant_data in product_data.get("variants", []):
                variant = ProductVariant(
                    product_id=product.id,
                    size=variant_data["size"],
                    price=variant_data["price"],
                    currency="INR"
                )
                db.add(variant)
        
        logger.info(f"Seeded {len(products)} products to database")


def main():
    """Main function to run the seed script"""
    logger.info("Starting database seed...")
    
    # Check for CSV file
    csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "products.csv")
    
    if os.path.exists(csv_path):
        logger.info(f"Found CSV file: {csv_path}")
        products = load_from_csv(csv_path)
        if products:
            seed_database(products)
        else:
            logger.warning("CSV load failed, using sample products")
            seed_database(SAMPLE_PRODUCTS)
    else:
        logger.info("No CSV file found, using sample products")
        seed_database(SAMPLE_PRODUCTS)
    
    logger.info("Database seed complete!")


if __name__ == "__main__":
    main()
