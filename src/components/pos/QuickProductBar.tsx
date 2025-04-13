
import React from 'react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';

interface QuickProductBarProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const QuickProductBar: React.FC<QuickProductBarProps> = ({ 
  products, 
  onSelectProduct 
}) => {
  // Get the top 8 most common products for quick access
  const quickProducts = products
    .filter(p => p.stock > 0)
    .slice(0, 8);
    
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="w-full text-sm font-medium text-muted-foreground mb-1">
        Quick Add
      </div>
      {quickProducts.map((product) => (
        <Button 
          key={product.id}
          variant="outline"
          className="h-auto py-2 px-3 flex flex-col items-center justify-center"
          onClick={() => onSelectProduct(product)}
        >
          <span className="text-xs font-medium">{product.name}</span>
          <span className="text-xs text-muted-foreground mt-1">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </Button>
      ))}
    </div>
  );
};
