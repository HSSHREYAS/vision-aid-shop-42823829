import { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
    Volume2,
    ArrowLeft,
    ShoppingBag,
    Check,
    Loader2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '@/services/api';
import { toast } from 'sonner';

const Checkout = () => {
    const { state, dispatch, cartTotal, cartCount, speak, announce } = useApp();
    const navigate = useNavigate();
    const { cart, isLoading } = state;

    const tax = cartTotal * 0.18; // 18% GST
    const total = cartTotal + tax;

    // Redirect if cart is empty
    useEffect(() => {
        if (cart.length === 0) {
            navigate('/cart');
        }
    }, [cart.length, navigate]);

    const handleReadOrder = () => {
        if (cart.length === 0) {
            speak('Your cart is empty.');
            return;
        }

        const itemDescriptions = cart.map((item, index) =>
            `Item ${index + 1}: ${item.productName}, ${item.variantSize}, quantity ${item.quantity}, ${item.price > 0 ? `${item.price} rupees each` : 'price pending'}`
        ).join('. ');

        const orderSummary = `Your order has ${cartCount} items. ${itemDescriptions}. ` +
            `Subtotal: ${Math.round(cartTotal)} rupees. ` +
            `Tax: ${Math.round(tax)} rupees. ` +
            `Total: ${Math.round(total)} rupees.`;

        speak(orderSummary);
        announce('Reading order summary...');
    };

    const handleBuyNow = async () => {
        if (cart.length === 0) {
            speak('Your cart is empty.');
            return;
        }

        dispatch({ type: 'SET_LOADING', payload: true });
        speak('Placing your order. Please wait.');

        try {
            // Build order request
            const orderRequest = {
                items: cart.map(item => ({
                    product_id: item.productId,
                    size: item.variantSize,
                    quantity: item.quantity,
                    unit_price: item.price,
                })),
                total_amount: total,
                currency: 'INR',
            };

            // Call order API
            const response = await createOrder(orderRequest);

            if (response.status === 'confirmed') {
                // Success!
                const orderId = response.order_id || `ORD-${Date.now()}`;
                speak(`Order confirmed! Your order ID is ${orderId}. Thank you for shopping with SmartShop.`);

                toast.success('Order Placed Successfully!', {
                    description: `Order ID: ${orderId}`,
                    duration: 8000,
                });

                // Clear cart and navigate home
                dispatch({ type: 'CLEAR_CART' });

                // Small delay for voice to finish
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                throw new Error('Order was not confirmed');
            }
        } catch (error) {
            console.error('Order error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            speak('Order failed. Please try again or contact support.');
            toast.error('Order Failed', {
                description: errorMessage.includes('fetch') ? 'Could not connect to server' : errorMessage,
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    if (cart.length === 0) {
        return null; // Will redirect
    }

    return (
        <main className="container mx-auto animate-fade-in px-4 py-6 md:py-8">
            {/* Header */}
            <div className="mb-6 md:mb-8">
                <Link
                    to="/cart"
                    className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Cart
                </Link>
                <h1 className="font-display text-3xl font-bold tracking-wide text-foreground md:text-4xl">
                    <span className="gradient-text">Checkout</span>
                </h1>
                <p className="mt-1 text-muted-foreground">
                    Review your order and complete purchase
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Order Items */}
                <section className="lg:col-span-7" aria-labelledby="order-items-heading">
                    <h2 id="order-items-heading" className="mb-4 font-display text-xl font-semibold text-foreground">
                        Order Items ({cartCount})
                    </h2>
                    <div className="space-y-3">
                        {cart.map((item, index) => (
                            <div
                                key={item.cartItemId}
                                className="glass-panel flex items-center justify-between p-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                                            {index + 1}
                                        </span>
                                        <h3 className="font-semibold text-foreground">{item.productName}</h3>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {item.variantSize} × {item.quantity}
                                        {item.brand && ` · ${item.brand}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {item.price > 0 ? (
                                        <p className="font-display text-xl font-bold text-primary">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-warning">Price pending</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Order Summary */}
                <aside className="lg:col-span-5" aria-labelledby="checkout-summary">
                    <div className="glass-panel sticky top-24 p-6">
                        <h2 id="checkout-summary" className="mb-4 font-display text-xl font-semibold text-foreground">
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

                        {/* Voice Read Button */}
                        <Button
                            variant="glass"
                            className="mb-4 w-full"
                            onClick={handleReadOrder}
                            aria-label="Read order summary aloud"
                        >
                            <Volume2 className="mr-2 h-4 w-4" />
                            Read Order Aloud
                        </Button>

                        {/* Buy Now Button */}
                        <Button
                            variant="hero"
                            size="xl"
                            className="w-full"
                            onClick={handleBuyNow}
                            disabled={isLoading || cartTotal === 0}
                            aria-label="Complete purchase"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <ShoppingBag className="mr-2 h-5 w-5" />
                                    Buy Now — ₹{total.toFixed(2)}
                                </>
                            )}
                        </Button>

                        {/* Security note */}
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Check className="h-4 w-4 text-success" />
                            <span>Secure checkout powered by SmartShop</span>
                        </div>

                        {/* Accessibility info */}
                        <div className="mt-6 rounded-xl bg-muted/50 p-4">
                            <h3 className="mb-2 text-sm font-semibold text-foreground">
                                Keyboard Shortcuts
                            </h3>
                            <ul className="space-y-1 text-xs text-muted-foreground">
                                <li className="flex justify-between">
                                    <span>Read order aloud</span>
                                    <kbd className="rounded bg-card px-1.5 py-0.5 font-mono">R</kbd>
                                </li>
                                <li className="flex justify-between">
                                    <span>Complete purchase</span>
                                    <kbd className="rounded bg-card px-1.5 py-0.5 font-mono">Enter</kbd>
                                </li>
                                <li className="flex justify-between">
                                    <span>Go back to cart</span>
                                    <kbd className="rounded bg-card px-1.5 py-0.5 font-mono">Esc</kbd>
                                </li>
                            </ul>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
};

export default Checkout;
