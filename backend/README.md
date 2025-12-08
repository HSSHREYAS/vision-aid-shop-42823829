# SmartShop AI Backend

FastAPI backend for the SmartShop AI shopping assistant. Provides product detection using YOLOv8, OCR using Google Gemini Vision, and product database for pricing.

## Features

- 🎯 **YOLOv8 Object Detection** - Detect products using your trained model
- 👁️ **Gemini Vision OCR** - Extract brand, product name, and quantity from product labels
- 🗃️ **Product Database** - SQLite database with product pricing and variants
- 🔊 **Text-to-Speech** - Generate audio summaries using gTTS
- 🛒 **Order Management** - Create and track orders

## Quick Start

### 1. Setup Environment

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy environment template
copy .env.example .env    # Windows
cp .env.example .env      # Linux/Mac

# Edit .env and add your API key
# GEMINI_API_KEY=your_api_key_here
```

### 3. Place Your Files

```
backend/
├── models/
│   └── best.pt          # <-- Place your YOLOv8 model here
├── data/
│   └── products.csv     # <-- (Optional) Place your product CSV here
```

### 4. Seed Database

```bash
# From backend directory
python -m scripts.seed_products
```

### 5. Run Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --port 8000

# Or run directly
python -m app.main
```

Server will be available at: http://localhost:8000

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/api/v1/health` | GET | Health check |
| `/api/v1/predict` | POST | Product detection |
| `/api/v1/products/search` | GET | Search products |
| `/api/v1/products` | GET | List all products |
| `/api/v1/orders` | POST | Create order |

### API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Example Requests

### Health Check
```bash
curl http://localhost:8000/api/v1/health
```

### Product Detection
```bash
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "include_audio": true,
    "language": "en"
  }'
```

### Product Search
```bash
curl "http://localhost:8000/api/v1/products/search?brand=amul&name=milk"
```

### Create Order
```bash
curl -X POST http://localhost:8000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product_id": "PROD-001", "size": "500ml", "quantity": 2, "unit_price": 30}],
    "total_amount": 60,
    "currency": "INR"
  }'
```

## Product CSV Format

If using a CSV file for products, use this format:

```csv
product_id,brand,name,description,category,size,price
PROD-001,Amul,Full Cream Milk,Fresh milk,Dairy,500ml,30
PROD-001,Amul,Full Cream Milk,Fresh milk,Dairy,1L,58
PROD-002,Parle,Marie Gold,Classic biscuits,Biscuits,100g,20
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `YOLO_MODEL_PATH` | Path to YOLOv8 model | `./models/best.pt` |
| `YOLO_DEVICE` | Inference device | `cpu` |
| `DETECTION_MODE` | `yolo` or `mock` | `yolo` |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.0-flash` |
| `TTS_ENABLED` | Enable TTS | `true` |
| `DATABASE_URL` | Database URL | `sqlite:///./app.db` |
| `FRONTEND_ORIGIN` | Frontend URL | `http://localhost:5173` |

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run with mock mode
DETECTION_MODE=mock pytest tests/ -v
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app
│   ├── config.py         # Settings
│   ├── db.py             # Database setup
│   ├── api/
│   │   └── routes.py     # API endpoints
│   ├── models/
│   │   ├── schemas.py    # Pydantic schemas
│   │   └── db_models.py  # SQLAlchemy models
│   ├── services/
│   │   ├── image_service.py
│   │   ├── yolo_service.py
│   │   ├── ocr_service.py
│   │   ├── fusion_service.py
│   │   ├── tts_service.py
│   │   └── product_service.py
│   └── core/
│       ├── logging_config.py
│       ├── middleware.py
│       └── exceptions.py
├── models/               # YOLO models
├── data/                 # CSV files
├── storage/
│   └── audio/           # Generated audio
├── tests/
├── scripts/
│   └── seed_products.py
├── requirements.txt
├── .env.example
└── README.md
```
