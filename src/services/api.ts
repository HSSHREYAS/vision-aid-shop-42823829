/**
 * API Service Layer for SmartShop AI
 * Handles all communication with the FastAPI backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================================
// Request/Response Types
// ============================================================

export interface PredictionRequest {
    image: string;           // base64 data URL (e.g., "data:image/jpeg;base64,...")
    include_audio?: boolean;
    language?: string;
    min_confidence?: number;
}

export interface Detection {
    id: string;
    bbox: number[];          // [x1, y1, x2, y2]
    class_name: string;
    confidence: number;
    brand?: string;
    product_name?: string;
    quantity_text?: string;
    raw_text?: string;
}

export interface PredictionResponse {
    status: string;          // "ok" or "error"
    detections: Detection[];
    summary?: string;
    audio_url?: string;
    processing_time_ms?: number;
    total_items?: number;
}

export interface ProductVariant {
    size: string;
    price: number;
    currency: string;
}

export interface ProductMatch {
    product_id: string;
    brand: string;
    name: string;
    description?: string;
    image_url?: string;
    available_sizes: string[];
    available_quantities: number[];
    variants: ProductVariant[];
}

export interface ProductSearchResponse {
    status: string;          // "ok" or "fallback"
    matches: ProductMatch[];
}

export interface OrderItem {
    product_id: string;
    size: string;
    quantity: number;
    unit_price: number;
}

export interface OrderRequest {
    items: OrderItem[];
    total_amount: number;
    currency: string;
}

export interface OrderResponse {
    status: string;          // "confirmed" or "error"
    order_id?: string;
}

export interface HealthResponse {
    status: string;
    model_loaded: boolean;
    gemini_configured: boolean;
    services: Record<string, boolean>;
}

// ============================================================
// API Functions
// ============================================================

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${API_URL}/api/v1/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Send image for product detection using YOLOv8 + Gemini OCR
 */
export async function predictProducts(request: PredictionRequest): Promise<PredictionResponse> {
    const response = await fetch(`${API_URL}/api/v1/predict`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            image: request.image,
            include_audio: request.include_audio ?? true,
            language: request.language ?? 'en',
            min_confidence: request.min_confidence ?? 0.3,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Prediction failed: ${response.status} - ${errorText}`);
    }

    return response.json();
}

/**
 * Search for product details and pricing
 */
export async function searchProducts(
    brand: string,
    name: string,
    quantity?: string
): Promise<ProductSearchResponse> {
    const params = new URLSearchParams();

    // Normalize and add parameters
    if (brand) params.append('brand', brand.toLowerCase().trim());
    if (name) params.append('name', name.toLowerCase().trim());
    if (quantity) params.append('quantity', quantity.toLowerCase().trim());

    const response = await fetch(`${API_URL}/api/v1/products/search?${params.toString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Product search failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Create a new order
 */
export async function createOrder(order: OrderRequest): Promise<OrderResponse> {
    const response = await fetch(`${API_URL}/api/v1/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(order),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Order creation failed: ${response.status} - ${errorText}`);
    }

    return response.json();
}

/**
 * Get full URL for audio files from backend
 */
export function getAudioUrl(path: string): string {
    if (!path) return '';
    // Handle both relative and absolute paths
    if (path.startsWith('http')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Get the API base URL
 */
export function getApiUrl(): string {
    return API_URL;
}
