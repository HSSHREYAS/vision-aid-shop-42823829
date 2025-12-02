import { useApp } from '@/contexts/AppContext';
import { CartItemCard } from '@/components/cart/CartItem';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, Volume2, ArrowLeft, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Cart = () => {
  const { state, dispatch, cartTotal, cartCount, speak } = useApp();
  const { cart } = state;

  const tax = cartTotal * 0.18; // 18% GST placeholder
  const total = cartTotal + tax;

  const handleClearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    speak('Cart cleared.');
  };

  const handleReadSummary = () => {
    if (cart.length === 0) {
      speak('Your cart is empty.');
      return;
    }
    const items = cart.map(item => `${item.productName}, ${item.variantSize}, quantity ${item.quantity}`).join('. ');
    speak(`Your cart has ${cartCount} items. ${items}. Subtotal: ${cartTotal} rupees. Tax: ${Math.round(tax)} rupees. Total: ${Math.round(total)} rupees.`);
  };

  return (
    <main className="container mx-auto animate-fade-in px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            to="/"
            className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Scanner
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-wide text-foreground md:text-4xl">
            Shopping <span className="gradient-text">Cart</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            {cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''} in your cart` : 'Your cart is empty'}
          </p>
        </div>

        {cart.length > 0 && (
          <div className="flex gap-3">
            <Button
              variant="glass"
              onClick={handleReadSummary}
              aria-label="Read cart summary aloud"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Voice Summary
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cart
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-panel border-destructive/30">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear entire cart?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all {cartCount} items from your cart. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearCart}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear Cart
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {cart.length === 0 ? (
        /* Empty Cart State */
        <div className="glass-panel flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-6">
            <ShoppingCart className="h-24 w-24 text-muted-foreground/30" />
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-foreground">Your cart is empty</h2>
          <p className="mb-6 max-w-md text-muted-foreground">
            Start scanning products to add them to your cart. Point your camera at any product to identify it.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/">
              Start Scanning
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Cart Items */}
          <section className="space-y-4 lg:col-span-8" aria-labelledby="cart-items-heading">
            <h2 id="cart-items-heading" className="sr-only">Cart Items</h2>
            {cart.map((item) => (
              <CartItemCard key={item.cartItemId} item={item} />
            ))}
          </section>

          {/* Order Summary */}
          <aside className="lg:col-span-4" aria-labelledby="summary-heading">
            <div className="glass-panel sticky top-24 p-6">
              <h2 id="summary-heading" className="mb-4 font-display text-xl font-semibold text-foreground">
                Order Summary
              </h2>

              <div className="space-y-3 border-b border-border/50 pb-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (GST 18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-success">Free</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-4">
                <span className="text-lg font-semibold text-foreground">Total</span>
                <span
                  className="font-display text-3xl font-bold text-primary"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  ₹{total.toFixed(2)}
                </span>
              </div>

              <Button
                variant="hero"
                size="xl"
                className="w-full"
                disabled
                aria-label="Proceed to checkout"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Checkout
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Checkout is disabled in demo mode
              </p>

              {/* Coupon placeholder */}
              <div className="mt-6 rounded-xl border border-dashed border-border/50 p-4 text-center">
                <span className="text-sm text-muted-foreground">Have a coupon code?</span>
                <Button variant="link" className="ml-1 h-auto p-0 text-sm">
                  Apply here
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
};

export default Cart;
