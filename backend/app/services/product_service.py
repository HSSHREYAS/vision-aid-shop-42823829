"""
Product Service
Handles product database queries and search
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from loguru import logger

from app.models.db_models import Product, ProductVariant
from app.models.schemas import ProductMatch, ProductVariant as ProductVariantSchema


class ProductService:
    """Service for product database operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def search_products(
        self,
        brand: Optional[str] = None,
        name: Optional[str] = None,
        quantity: Optional[str] = None
    ) -> List[ProductMatch]:
        """
        Search for products matching the given criteria
        
        Args:
            brand: Brand name to search for
            name: Product name to search for
            quantity: Quantity text (used to match size variants)
            
        Returns:
            List of ProductMatch objects
        """
        try:
            # Start with base query
            query = self.db.query(Product).filter(Product.is_active == True)
            
            # Build search conditions
            conditions = []
            
            if brand:
                brand_clean = brand.strip().lower()
                conditions.append(func.lower(Product.brand).contains(brand_clean))
            
            if name:
                name_clean = name.strip().lower()
                conditions.append(func.lower(Product.name).contains(name_clean))
            
            # Apply conditions with OR logic for flexibility
            if conditions:
                query = query.filter(or_(*conditions))
            
            # Execute query
            products = query.limit(10).all()
            
            # Convert to ProductMatch objects
            matches = []
            for product in products:
                match = self._product_to_match(product, quantity)
                matches.append(match)
            
            logger.info(f"Found {len(matches)} products for brand='{brand}', name='{name}'")
            return matches
            
        except Exception as e:
            logger.error(f"Product search error: {e}")
            return []
    
    def _product_to_match(
        self,
        product: Product,
        preferred_quantity: Optional[str] = None
    ) -> ProductMatch:
        """Convert a Product ORM object to ProductMatch schema"""
        
        # Get all variants
        variants = []
        available_sizes = []
        
        for variant in product.variants:
            variants.append(ProductVariantSchema(
                size=variant.size,
                price=variant.price,
                currency=variant.currency
            ))
            available_sizes.append(variant.size)
        
        # If no variants, create a default
        if not variants:
            variants.append(ProductVariantSchema(
                size="Standard",
                price=99.0,
                currency="INR"
            ))
            available_sizes.append("Standard")
        
        return ProductMatch(
            product_id=product.product_id,
            brand=product.brand,
            name=product.name,
            description=product.description,
            image_url=product.image_url,
            available_sizes=available_sizes,
            available_quantities=[1, 2, 3, 4, 5, 10],
            variants=variants
        )
    
    def get_product_by_id(self, product_id: str) -> Optional[ProductMatch]:
        """Get a single product by ID"""
        try:
            product = self.db.query(Product).filter(
                Product.product_id == product_id,
                Product.is_active == True
            ).first()
            
            if product:
                return self._product_to_match(product)
            return None
            
        except Exception as e:
            logger.error(f"Error getting product {product_id}: {e}")
            return None
    
    def get_all_products(self, limit: int = 100) -> List[ProductMatch]:
        """Get all products"""
        try:
            products = self.db.query(Product).filter(
                Product.is_active == True
            ).limit(limit).all()
            
            return [self._product_to_match(p) for p in products]
            
        except Exception as e:
            logger.error(f"Error getting all products: {e}")
            return []


def get_fallback_product(
    brand: Optional[str] = None,
    name: Optional[str] = None,
    quantity: Optional[str] = None
) -> ProductMatch:
    """
    Return a fallback product when no match is found in database
    """
    return ProductMatch(
        product_id="fallback-001",
        brand=brand or "Unknown",
        name=name or "Unknown Product",
        description="Product details not found in database",
        image_url=None,
        available_sizes=[quantity or "Standard"],
        available_quantities=[1, 2, 3, 4, 5],
        variants=[
            ProductVariantSchema(
                size=quantity or "Standard",
                price=99.0,
                currency="INR"
            )
        ]
    )
