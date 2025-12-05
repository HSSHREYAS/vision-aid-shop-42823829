import { CameraView, CameraViewRef } from '@/components/camera/CameraView';
import { ProductDetailsModal } from '@/components/product/ProductDetailsModal';
import { useApp } from '@/contexts/AppContext';
import { Mic, MicOff, Volume2, Eye, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const Scan = () => {
  const { speak, dispatch, state } = useApp();
  const navigate = useNavigate();
  const cameraRef = useRef<CameraViewRef>(null);
  const [commandInput, setCommandInput] = useState('');

  const handleReadInstructions = () => {
    speak('Welcome to SmartShop. Point your camera at a product to identify it. Press Space to capture, or enable continuous detection for automatic scanning.');
  };

  // Command execution functions
  const handleCapture = () => {
    if (cameraRef.current) {
      cameraRef.current.captureFrame();
      speak('Capturing image.');
    } else {
      speak('Camera not ready.');
    }
  };

  const handleAdd = () => {
    if (state.currentProduct) {
      const newItem = {
        cartItemId: `CIT_${Date.now()}`,
        productId: state.currentProduct.productId,
        productName: state.currentProduct.name,
        variantId: state.currentProduct.variants[0]?.variantId || 'V1',
        variantSize: state.currentProduct.variants[0]?.size || '500ml',
        quantity: 1,
        price: state.currentProduct.variants[0]?.price || 45,
        status: 'confirmed' as const,
      };
      dispatch({ type: 'ADD_TO_CART', payload: newItem });
      speak('Item added to cart.');
      toast.success('Added to cart!', {
        action: {
          label: 'Undo',
          onClick: () => dispatch({ type: 'REMOVE_FROM_CART', payload: newItem.cartItemId }),
        },
      });
    } else if (state.detections.length > 0) {
      // Auto-add detected product
      const detection = state.detections[0];
      const newItem = {
        cartItemId: `CIT_${Date.now()}`,
        productId: detection.suggestedProductId || 'PRD001',
        productName: detection.label,
        variantId: 'V1',
        variantSize: '500ml',
        quantity: 1,
        price: 45,
        status: 'confirmed' as const,
      };
      dispatch({ type: 'ADD_TO_CART', payload: newItem });
      speak(`Added ${detection.label} to cart.`);
      toast.success(`Added ${detection.label} to cart!`, {
        action: {
          label: 'Undo',
          onClick: () => dispatch({ type: 'REMOVE_FROM_CART', payload: newItem.cartItemId }),
        },
      });
    } else {
      speak('No product selected. Please scan a product first.');
    }
  };

  const handleDetails = () => {
    if (state.detections.length > 0) {
      speak('Opening product details.');
      dispatch({ type: 'SET_CURRENT_PRODUCT', payload: {
        productId: state.detections[0].suggestedProductId || 'PRD001',
        name: state.detections[0].label,
        variants: [
          { variantId: 'V1', size: '500 ml', price: 45, unitPrice: 90, stock: 12 },
          { variantId: 'V2', size: '1 L', price: 80, unitPrice: 80, stock: 3 },
        ],
      }});
      dispatch({ type: 'TOGGLE_PRODUCT_MODAL', payload: true });
    } else {
      speak('No product detected. Please point camera at a product first.');
    }
  };

  const handleStart = () => {
    if (cameraRef.current) {
      cameraRef.current.startCamera();
      speak('Starting camera.');
    }
  };

  const handleStop = () => {
    if (cameraRef.current) {
      cameraRef.current.stopCamera();
      speak('Stopping camera.');
    }
  };

  const handleUndo = () => {
    if (state.cart.length > 0) {
      const lastItem = state.cart[state.cart.length - 1];
      dispatch({ type: 'REMOVE_FROM_CART', payload: lastItem.cartItemId });
      speak(`Removed ${lastItem.productName} from cart.`);
    } else {
      speak('Cart is empty.');
    }
  };

  // Voice command handlers using direct function calls
  const { isListening, isSupported, toggleListening, executeCommand } = useVoiceCommands({
    onCapture: handleCapture,
    onAdd: handleAdd,
    onDetails: handleDetails,
    onCart: () => {
      speak('Going to cart.');
      navigate('/cart');
    },
    onHelp: () => {
      speak('Opening help page.');
      navigate('/help');
    },
    onStart: handleStart,
    onStop: handleStop,
    onUndo: handleUndo,
  });

  // Handle text command submission
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim()) {
      const result = executeCommand(commandInput.trim());
      if (result) {
        toast.success(`Executed: ${result}`);
      } else {
        toast.error('Unknown command');
      }
      setCommandInput('');
    }
  };

  return (
    <main className="container mx-auto animate-fade-in px-4 py-6 md:py-8 min-h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="mb-6 text-center md:mb-8">
        <h1 className="font-display text-2xl font-bold tracking-wide text-foreground md:text-3xl">
          <span className="gradient-text">Product</span> Scanner
        </h1>
        <p className="mt-2 text-muted-foreground">
          Point your camera at products to identify and add them to cart
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Camera Section */}
        <section className="lg:col-span-8" aria-labelledby="camera-heading">
          <h2 id="camera-heading" className="sr-only">
            Camera and Detection
          </h2>
          <CameraView ref={cameraRef} />
        </section>

        {/* Quick Actions Panel */}
        <aside className="lg:col-span-4" aria-labelledby="actions-heading">
          <h2 id="actions-heading" className="sr-only">
            Quick Actions
          </h2>
          <div className="glass-panel h-full p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              {/* Voice Guide */}
              <Button
                variant="glass"
                className="w-full justify-start gap-3"
                onClick={handleReadInstructions}
                aria-label="Read instructions aloud"
              >
                <Volume2 className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <span className="block font-medium">Voice Guide</span>
                  <span className="text-xs text-muted-foreground">Listen to instructions</span>
                </div>
              </Button>

              {/* Voice Commands */}
              <Button
                variant={isListening ? 'default' : 'glass'}
                className={`w-full justify-start gap-3 ${isListening ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                onClick={toggleListening}
                aria-label={isListening ? 'Stop voice commands' : 'Start voice commands'}
                aria-pressed={isListening}
                disabled={!isSupported}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5 text-destructive animate-pulse" />
                ) : (
                  <Mic className="h-5 w-5 text-secondary" />
                )}
                <div className="text-left">
                  <span className="block font-medium">
                    {isListening ? 'Listening...' : 'Voice Commands'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isSupported 
                      ? (isListening ? 'Say "capture", "add", or "cart"' : 'Click to activate')
                      : 'Not supported - use text input'
                    }
                  </span>
                </div>
              </Button>

              {/* Text Command Input - Always visible as fallback */}
              <form onSubmit={handleCommandSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Type command: capture, add, cart..."
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  className="flex-1"
                  aria-label="Type a voice command"
                />
                <Button type="submit" size="icon" variant="default" aria-label="Execute command">
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              {/* High Contrast */}
              <Button
                variant="glass"
                className="w-full justify-start gap-3"
                asChild
              >
                <a href="/settings">
                  <Eye className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <span className="block font-medium">Accessibility</span>
                    <span className="text-xs text-muted-foreground">Adjust display settings</span>
                  </div>
                </a>
              </Button>
            </div>

            {/* Voice Commands List */}
            {isListening && (
              <div className="mt-6 rounded-xl bg-primary/10 border border-primary/20 p-4 animate-fade-in">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                  Available Commands
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>"<span className="text-foreground font-medium">Capture</span>" - Take a snapshot</li>
                  <li>"<span className="text-foreground font-medium">Add</span>" - Add to cart</li>
                  <li>"<span className="text-foreground font-medium">Details</span>" - View product info</li>
                  <li>"<span className="text-foreground font-medium">Cart</span>" - Go to cart</li>
                  <li>"<span className="text-foreground font-medium">Help</span>" - Open tutorial</li>
                </ul>
              </div>
            )}

            {/* Keyboard Shortcuts */}
            {!isListening && (
              <div className="mt-6 rounded-xl bg-muted/50 p-4">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Keyboard Shortcuts
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Start/Stop Camera</span>
                    <kbd className="rounded bg-card px-2 py-0.5 font-mono text-xs text-primary">Ctrl+Shift+C</kbd>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Capture</span>
                    <kbd className="rounded bg-card px-2 py-0.5 font-mono text-xs text-primary">Space</kbd>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Add to Cart</span>
                    <kbd className="rounded bg-card px-2 py-0.5 font-mono text-xs text-primary">A</kbd>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Toggle Live</span>
                    <kbd className="rounded bg-card px-2 py-0.5 font-mono text-xs text-primary">Ctrl+M</kbd>
                  </li>
                </ul>
              </div>
            )}

            {/* Status indicators */}
            <div className="mt-6 flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isListening ? 'bg-primary' : 'bg-success'} animate-pulse`} />
                <span className="text-sm text-muted-foreground">
                  {isListening ? 'Voice Active' : 'System Ready'}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">v1.0.0</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal />
    </main>
  );
};

export default Scan;
