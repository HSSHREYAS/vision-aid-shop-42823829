// Product and Variant types
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
}

// Detection types
export interface Detection {
  id: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  suggestedProductId?: string;
}

export interface OCRResult {
  textLines: string[];
  language: string;
}

// Cart types
export interface CartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSize: string;
  quantity: number;
  price: number;
  status: 'pending' | 'confirmed' | 'error';
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
export type PageRoute = '/' | '/cart' | '/settings' | '/help';
