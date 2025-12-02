import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { CartItem as CartItemType } from '@/types';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Plus, Minus } from 'lucide-react';
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

interface CartItemProps {
  item: CartItemType;
}

export function CartItemCard({ item }: CartItemProps) {
  const { dispatch, announce, speak } = useApp();
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(1, quantity + delta);
    setQuantity(newQty);
    dispatch({
      type: 'UPDATE_CART_ITEM',
      payload: { cartItemId: item.cartItemId, quantity: newQty },
    });
    announce(`Updated quantity to ${newQty}`);
  };

  const handleRemove = () => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: item.cartItemId });
    speak(`Removed ${item.productName} from cart.`);
  };

  const totalPrice = item.price * quantity;

  return (
    <div className="glass-panel-hover group flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Product Info */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-foreground">{item.productName}</h3>
        <p className="text-sm text-muted-foreground">
          Size: {item.variantSize} · ₹{item.price} each
        </p>
        {item.status === 'pending' && (
          <span className="inline-flex items-center gap-1 text-xs text-warning">
            <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
            Syncing...
          </span>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="3d"
          size="icon"
          onClick={() => handleQuantityChange(-1)}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-[40px] text-center font-display text-xl font-bold text-foreground">
          {quantity}
        </span>
        <Button
          variant="3d"
          size="icon"
          onClick={() => handleQuantityChange(1)}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Price */}
      <div className="text-right">
        <p className="font-display text-2xl font-bold text-primary">₹{totalPrice}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${item.productName}`}
          title="Edit (E)"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              aria-label={`Remove ${item.productName}`}
              title="Remove (Delete)"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-panel border-destructive/30">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove item?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {item.productName} ({item.variantSize}) from your cart?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemove}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
