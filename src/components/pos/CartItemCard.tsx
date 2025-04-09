
import React from 'react';
import { CartItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus } from 'lucide-react';

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
            <span className="w-8 text-center">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onUpdateQuantity(item.quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
