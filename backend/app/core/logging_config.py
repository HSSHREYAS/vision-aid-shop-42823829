"""
Logging configuration for the backend
"""

import sys
from loguru import logger


def setup_logging(debug: bool = False):
    """Configure loguru logger"""
    logger.remove()
    
    level = "DEBUG" if debug else "INFO"
    
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=level,
        colorize=True
    )
    
    # Also log to file
    logger.add(
        "logs/app.log",
        rotation="10 MB",
        retention="7 days",
        level=level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"
    )
