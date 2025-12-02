import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { CartItem, AccessibilitySettings, Detection, Product } from '@/types';

interface AppState {
  cart: CartItem[];
  detections: Detection[];
  currentProduct: Product | null;
  isProductModalOpen: boolean;
  isCameraActive: boolean;
  isContinuousMode: boolean;
  settings: AccessibilitySettings;
  liveRegionText: string;
  isLoading: boolean;
}

type AppAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_ITEM'; payload: { cartItemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_DETECTIONS'; payload: Detection[] }
  | { type: 'SET_CURRENT_PRODUCT'; payload: Product | null }
  | { type: 'TOGGLE_PRODUCT_MODAL'; payload: boolean }
  | { type: 'SET_CAMERA_ACTIVE'; payload: boolean }
  | { type: 'TOGGLE_CONTINUOUS_MODE' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AccessibilitySettings> }
  | { type: 'SET_LIVE_REGION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

const initialSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  voiceEnabled: true,
  voiceId: '',
  speechRate: 1.0,
  speechPitch: 1.0,
};

const initialState: AppState = {
  cart: [],
  detections: [],
  currentProduct: null,
  isProductModalOpen: false,
  isCameraActive: false,
  isContinuousMode: false,
  settings: initialSettings,
  liveRegionText: '',
  isLoading: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TO_CART':
      return { ...state, cart: [...state.cart, action.payload] };
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(item => item.cartItemId !== action.payload) };
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.cartItemId === action.payload.cartItemId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_DETECTIONS':
      return { ...state, detections: action.payload };
    case 'SET_CURRENT_PRODUCT':
      return { ...state, currentProduct: action.payload };
    case 'TOGGLE_PRODUCT_MODAL':
      return { ...state, isProductModalOpen: action.payload };
    case 'SET_CAMERA_ACTIVE':
      return { ...state, isCameraActive: action.payload };
    case 'TOGGLE_CONTINUOUS_MODE':
      return { ...state, isContinuousMode: !state.isContinuousMode };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_LIVE_REGION':
      return { ...state, liveRegionText: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  announce: (text: string) => void;
  speak: (text: string) => void;
  cartTotal: number;
  cartCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const announce = useCallback((text: string) => {
    dispatch({ type: 'SET_LIVE_REGION', payload: text });
  }, []);

  const speak = useCallback((text: string) => {
    if (!state.settings.voiceEnabled) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = state.settings.speechRate;
    utterance.pitch = state.settings.speechPitch;
    
    if (state.settings.voiceId) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.voiceURI === state.settings.voiceId);
      if (voice) utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
    announce(text);
  }, [state.settings, announce]);

  const cartTotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppContext.Provider value={{ state, dispatch, announce, speak, cartTotal, cartCount }}>
      {children}
      {/* Live region for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="live-region"
      >
        {state.liveRegionText}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
