import { useState, useCallback, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Variant, CartItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Volume2,
  Copy,
  Plus,
  Minus,
  ShoppingCart,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export function ProductDetailsModal() {
  const { state, dispatch, speak, announce } = useApp();
  const { currentProduct, isProductModalOpen } = state;

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when product changes
  useEffect(() => {
    if (currentProduct && currentProduct.variants.length > 0) {
      setSelectedVariant(currentProduct.variants[0]);
      setQuantity(1);
      announce(`Product details: ${currentProduct.name}. Variants found: ${currentProduct.variants.length}.`);
    }
  }, [currentProduct, announce]);

  const handleClose = () => {
    dispatch({ type: 'TOGGLE_PRODUCT_MODAL', payload: false });
    dispatch({ type: 'SET_CURRENT_PRODUCT', payload: null });
  };

  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    speak(`Selected ${variant.size}, price ${variant.price} rupees.`);
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(1, Math.min(quantity + delta, selectedVariant?.stock || 99));
    setQuantity(newQty);
    announce(`Quantity: ${newQty}`);
  };

  const handleReadAloud = () => {
    if (!currentProduct || !selectedVariant) return;
    const text = `${currentProduct.name}. Size: ${selectedVariant.size}. Price: ${selectedVariant.price} rupees. ${selectedVariant.stock > 0 ? `${selectedVariant.stock} in stock.` : 'Out of stock.'}`;
    speak(text);
  };

  const handleCopyText = () => {
    if (!currentProduct) return;
    navigator.clipboard.writeText(currentProduct.name);
    toast.success('Copied to clipboard');
    announce('Copied to clipboard');
  };

  const handleAddToCart = useCallback(async () => {
    if (!currentProduct || !selectedVariant) return;

    setIsLoading(true);
    
    // Optimistic update
    const cartItem: CartItem = {
      cartItemId: `CIT_${Date.now()}`,
      productId: currentProduct.productId,
      productName: currentProduct.name,
      variantId: selectedVariant.variantId,
      variantSize: selectedVariant.size,
      quantity,
      price: selectedVariant.price,
      status: 'pending',
    };

    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
    speak(`Added ${currentProduct.name}, ${selectedVariant.size} to cart. Price: ${selectedVariant.price * quantity} rupees.`);

    // Show undo toast
    toast.success(
      <div className="flex items-center gap-3">
        <Check className="h-5 w-5 text-success" />
        <div>
          <p className="font-medium">Item added to cart</p>
          <p className="text-sm text-muted-foreground">{currentProduct.name} - {selectedVariant.size}</p>
        </div>
      </div>,
      {
        action: {
          label: 'Undo',
          onClick: () => {
            dispatch({ type: 'REMOVE_FROM_CART', payload: cartItem.cartItemId });
            announce('Item removed from cart.');
          },
        },
        duration: 8000,
      }
    );

    // Simulate server confirmation
    setTimeout(() => {
      dispatch({
        type: 'UPDATE_CART_ITEM',
        payload: { cartItemId: cartItem.cartItemId, quantity: cartItem.quantity },
      });
      setIsLoading(false);
    }, 500);

    handleClose();
  }, [currentProduct, selectedVariant, quantity, dispatch, speak, announce]);

  // Keyboard shortcut for Add to Cart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProductModalOpen && e.key === 'a' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleAddToCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProductModalOpen, handleAddToCart]);

  if (!currentProduct) return null;

  const totalPrice = selectedVariant ? selectedVariant.price * quantity : 0;

  return (
    <Dialog open={isProductModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="glass-panel max-w-lg border-primary/30 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="font-display text-2xl font-bold text-foreground">
                {currentProduct.name}
              </DialogTitle>
              <DialogDescription className="mt-1 text-muted-foreground">
                Select variant and quantity to add to cart
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="glass"
                size="icon"
                onClick={handleReadAloud}
                aria-label="Read product details aloud"
                title="Read Aloud (R)"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button
                variant="glass"
                size="icon"
                onClick={handleCopyText}
                aria-label="Copy product name"
                title="Copy"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Variants */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Select Size
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {currentProduct.variants.map((variant) => {
                const isSelected = selectedVariant?.variantId === variant.variantId;
                const isOutOfStock = variant.stock === 0;
                const isLowStock = variant.stock > 0 && variant.stock <= 5;

                return (
                  <button
                    key={variant.variantId}
                    onClick={() => !isOutOfStock && handleVariantSelect(variant)}
                    disabled={isOutOfStock}
                    className={`
                      relative flex flex-col items-center rounded-xl border-2 p-4 transition-all duration-200
                      ${isSelected
                        ? 'border-primary bg-primary/10 shadow-glow-cyan'
                        : 'border-border/50 bg-card hover:border-primary/50 hover:bg-muted'
                      }
                      ${isOutOfStock ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    `}
                    aria-pressed={isSelected}
                    aria-label={`${variant.size}, ${variant.price} rupees${isOutOfStock ? ', out of stock' : isLowStock ? ', low stock' : ''}`}
                  >
                    <span className="text-lg font-bold text-foreground">{variant.size}</span>
                    <span className="text-2xl font-display font-bold text-primary">
                      ₹{variant.price}
                    </span>
                    {variant.unitPrice && (
                      <span className="text-xs text-muted-foreground">
                        ₹{variant.unitPrice}/L
                      </span>
                    )}
                    {/* Stock badge */}
                    <span
                      className={`
                        mt-2 rounded-full px-2 py-0.5 text-xs font-medium
                        ${isOutOfStock
                          ? 'bg-destructive/20 text-destructive'
                          : isLowStock
                          ? 'bg-warning/20 text-warning'
                          : 'bg-success/20 text-success'
                        }
                      `}
                    >
                      {isOutOfStock ? 'Out of stock' : isLowStock ? `Only ${variant.stock} left` : 'In stock'}
                    </span>
                    {isSelected && (
                      <div className="absolute -right-1 -top-1 rounded-full bg-primary p-1">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Quantity
            </h3>
            <div className="flex items-center gap-4">
              <Button
                variant="3d"
                size="icon-lg"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-5 w-5" />
              </Button>
              <span
                className="min-w-[60px] text-center font-display text-3xl font-bold text-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                {quantity}
              </span>
              <Button
                variant="3d"
                size="icon-lg"
                onClick={() => handleQuantityChange(1)}
                disabled={selectedVariant ? quantity >= selectedVariant.stock : false}
                aria-label="Increase quantity"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Low stock warning */}
          {selectedVariant && selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">
                Only {selectedVariant.stock} items left in stock!
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 p-6">
          <div>
            <span className="text-sm text-muted-foreground">Total</span>
            <p className="font-display text-3xl font-bold text-primary">
              ₹{totalPrice}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="hero"
              size="lg"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0 || isLoading}
              aria-label={`Add to cart, price ${totalPrice} rupees`}
              title="Add to Cart (A)"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart — ₹{totalPrice}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
