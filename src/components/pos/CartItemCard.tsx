
import React from 'react';
import { CartItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

interface CartItemCardProps {
  item: CartItem;
  index: number;
  onRemove: () => void;
  onUpdateQuantity: (qty: number) => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdateQuantity 
}) => {
  const [inputValue, setInputValue] = useState(item.quantity.toString());
  const [inputError, setInputError] = useState('');

  // Sync inputValue with item.quantity if it changes externally
  React.useEffect(() => {
    setInputValue(item.quantity.toString());
  }, [item.quantity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
    setInputValue(val);
    setInputError('');
  };

  const handleInputBlurOrEnter = () => {
    let val = parseInt(inputValue, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (item.product.stock && val > item.product.stock) {
      setInputError(`Max available: ${item.product.stock}`);
      val = item.product.stock;
    }
    setInputValue(val.toString());
    onUpdateQuantity(val);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div className="flex-1">
            <div className="font-medium">{item.product.name}</div>
            {item.variant && (
              <div className="text-sm text-muted-foreground">
                {Object.entries(item.variant.attributes)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')}
              </div>
            )}
            <div className="text-sm">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(item.price)} × {item.quantity}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(item.price * item.quantity)}
            </div>
            <div className="text-xs text-muted-foreground">
              GST: {item.product.tax}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <Button variant="outline" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex flex-col items-center mx-2">
              <input
                type="text"
                min={1}
                max={item.product.stock}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlurOrEnter}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleInputBlurOrEnter();
                }}
                className={`w-12 text-center border rounded ${inputError ? 'border-red-500' : ''}`}
                style={{ width: 48 }}
                disabled={item.product.stock === 0}
              />
              <span className="text-xs text-muted-foreground">/ {item.product.stock ?? '∞'}</span>
              {inputError && <span className="text-xs text-red-500">{inputError}</span>}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              disabled={item.product.stock && item.quantity >= item.product.stock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
