import React, { useState } from 'react';
import { saveHeldCart, getHeldCarts, removeHeldCart, HeldCart } from '@/services/holdCartService';
import { Button } from '@/components/ui/button';

interface HoldCartButtonsProps {
  currentCart: any;
  onResumeCart: (cart: any) => void;
  onClearCart: () => void;
}

const HoldCartButtons: React.FC<HoldCartButtonsProps> = ({ currentCart, onResumeCart, onClearCart }) => {
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(getHeldCarts());

  const handleHoldCart = () => {
    saveHeldCart(currentCart);
    setHeldCarts(getHeldCarts());
    onClearCart();
  };

  const handleResumeCart = (cart: HeldCart) => {
    onResumeCart(cart.cart);
    removeHeldCart(cart.id);
    setHeldCarts(getHeldCarts());
  };

  return (
    <div className="flex flex-col gap-2 mb-2">
      <Button variant="outline" onClick={handleHoldCart} disabled={!currentCart || !currentCart.items || currentCart.items.length === 0}>
        Hold Cart
      </Button>
      {heldCarts.length > 0 && (
        <div className="border rounded p-2 bg-muted">
          <div className="font-semibold mb-1">Held Carts</div>
          <ul className="space-y-1">
            {heldCarts.map(cart => (
              <li key={cart.id} className="flex items-center justify-between">
                <span className="text-xs">{new Date(cart.timestamp).toLocaleString()}</span>
                <Button size="sm" className="ml-2" onClick={() => handleResumeCart(cart)}>
                  Resume
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HoldCartButtons; 