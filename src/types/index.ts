// Product and Variant types (Frontend format)
export interface Variant {
  variantId: string;
  size: string;
  price: number;
  unitPrice?: number;
  stock: number;
}

export interface Product {
  productId: string;
  name: string;
  description?: string;
  variants: Variant[];
  imageUrl?: string;
  brand?: string;
}

// Detection types (matches backend PredictionResponse)
export interface Detection {
  id: string;
  bbox: number[];          // [x1, y1, x2, y2] from YOLO
  class_name: string;      // YOLO class name
  confidence: number;
  brand?: string;          // From Gemini OCR
  product_name?: string;   // From Gemini OCR
  quantity_text?: string;  // From Gemini OCR (e.g., "500ml", "1L")
  raw_text?: string;       // Raw OCR text
  // Computed for display
  label?: string;          // Combined display name
}

export interface OCRResult {
  textLines: string[];
  language: string;
}

// API Response Types
export interface PredictionResponse {
  status: string;
  detections: Detection[];
  summary?: string;
  audio_url?: string;
  processing_time_ms?: number;
  total_items?: number;
}

export interface ProductVariantAPI {
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
  variants: ProductVariantAPI[];
}

export interface ProductSearchResponse {
  status: string;
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
  status: string;
  order_id?: string;
}

// Cart types (enhanced for backend integration)
export interface CartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSize: string;
  quantity: number;
  price: number;
  status: 'pending' | 'confirmed' | 'error';
  // New fields for backend integration
  brand?: string;
  quantityText?: string;
  availableVariants?: ProductVariantAPI[];
  needsPriceFetch?: boolean;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

// Camera types
export type CameraState = 'idle' | 'initializing' | 'streaming' | 'error';
export type FacingMode = 'user' | 'environment';

// Settings types
export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  voiceEnabled: boolean;
  voiceId: string;
  speechRate: number;
  speechPitch: number;
}

// TTS types
export interface TTSOptions {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
}

// Navigation
export type PageRoute = '/' | '/cart' | '/checkout' | '/settings' | '/help';
