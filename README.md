<div align="center">

# 🛒 SmartShop AI

### AI-Powered Shopping Assistant for Visually Impaired Users

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00FFFF)](https://ultralytics.com)
[![Gemini](https://img.shields.io/badge/Gemini-Vision-4285F4?logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*Empowering independence through AI-assisted shopping*

[Demo](#-demo) • [Features](#-features) • [Quick Start](#-quick-start) • [How It Works](#-how-it-works) • [API](#-api-reference)

</div>

---

## 🎯 Problem We're Solving

Shopping independently shouldn't be a challenge for anyone. For visually impaired individuals, identifying products, reading labels, and comparing prices can be overwhelming barriers to everyday independence.

**SmartShop AI** bridges this gap by combining cutting-edge AI with accessibility-first design, creating a shopping experience that speaks to you.

---

## ✨ Features

### 🎥 Real-Time Product Detection
Point your phone's camera at any product and instantly hear what it is. Our YOLOv8-trained model recognizes products while Gemini Vision reads the label details.

### 🗣️ Voice-First Interface
- **Natural voice feedback** announces detected products
- **Voice commands** for hands-free operation
- **Text-to-Speech summaries** of your cart and orders

### ♿ Accessibility Built-In
- Screen reader optimized
- High contrast mode
- Keyboard navigation with shortcuts
- Adjustable speech rate and pitch

### 🛍️ Complete Shopping Flow
1. **Scan** → Detect products with your camera
2. **Add** → Add items to your cart with one tap or voice command
3. **Review** → Hear your cart summary anytime
4. **Checkout** → Complete your order with voice confirmation

---

## 🎬 Demo

<div align="center">

| Scan Product | Add to Cart | Checkout |
|:---:|:---:|:---:|
| Point camera at product | Voice: "Add to cart" | "Buy Now" confirms order |
| AI detects & announces | Item added with price | Voice reads final summary |

</div>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.10+ (for backend)
- **Google Gemini API Key** ([Get one free](https://aistudio.google.com/apikey))

### 1. Clone the Repository

```bash
git clone https://github.com/ChaithanyaNayakaTL/vision-aid-shop-42823829.git
cd vision-aid-shop-42823829
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Seed the database
python -m scripts.seed_products

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 3. Setup Frontend

```bash
# In a new terminal, from project root
npm install
npm run dev
```

### 4. Open the App

Visit **http://localhost:5173** and start scanning! 📸

---

## 🧠 How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Camera    │────▶│   YOLOv8    │────▶│   Gemini    │
│   Capture   │     │  Detection  │     │  Vision OCR │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                   │
                            ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Product   │◀────│    Text     │
                    │  Database   │     │  Extraction │
                    └─────────────┘     └─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │   Voice     │
                    │  Feedback   │
                    └─────────────┘
```

1. **Camera captures** a frame when you click "Scan"
2. **YOLOv8** detects product bounding boxes
3. **Gemini Vision** reads brand, product name, and quantity
4. **Database lookup** fetches pricing and available sizes
5. **Voice synthesis** announces everything to the user

---

## 📁 Project Structure

```
vision-aid-shop/
├── 📁 src/                    # React Frontend
│   ├── components/
│   │   ├── camera/           # Camera & detection UI
│   │   ├── cart/             # Shopping cart
│   │   └── ui/               # shadcn/ui components
│   ├── contexts/             # State management
│   ├── pages/                # Route pages
│   └── services/             # API client
│
├── 📁 backend/                # FastAPI Backend
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   ├── models/           # Pydantic & SQLAlchemy
│   │   └── services/         # YOLO, OCR, TTS, etc.
│   ├── models/               # YOLOv8 weights (best.pt)
│   └── storage/              # Generated audio files
│
└── 📄 docker-compose.yml     # Run everything together
```

---

## 🔌 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | System health check |
| `/api/v1/predict` | POST | Product detection with image |
| `/api/v1/products/search` | GET | Search products by brand/name |
| `/api/v1/products` | GET | List all products |
| `/api/v1/orders` | POST | Create a new order |

### Example: Detect Products

```bash
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Start/Stop Camera |
| `Space` | Capture & Scan |
| `A` | Add to Cart |
| `U` | Undo last action |
| `Ctrl+M` | Toggle continuous detection |
| `Ctrl+K` | Switch camera |
| `?` | Open help |

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- React Router v6
- Web Speech API (TTS)

**Backend:**
- FastAPI + Python
- YOLOv8 (Ultralytics)
- Google Gemini Vision
- gTTS (audio generation)
- SQLite + SQLAlchemy

---

## 🤝 Contributing

We welcome contributions! Whether it's:

- 🐛 Bug fixes
- ✨ New features
- 📖 Documentation improvements
- 🌍 Translations
- ♿ Accessibility enhancements

Please open an issue first to discuss what you'd like to change.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Ultralytics](https://ultralytics.com) for YOLOv8
- [Google](https://ai.google.dev) for Gemini Vision API
- [shadcn/ui](https://ui.shadcn.com) for beautiful components
- The visually impaired community for inspiration and feedback

---

<div align="center">

**Built with ❤️ for accessibility**

*Making shopping independent for everyone*

</div>
