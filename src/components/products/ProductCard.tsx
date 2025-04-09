
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { PlusCircle, Tag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, showAddToCart = true }) => {
  const { addItem } = useCart();
  
  const handleAddToCart = () => {
    // For products with variants, you'd ideally show a modal to pick the variant first
    // But for simplicity in this demo, we'll just add the base product
    addItem(product, 1);
  };
  
  // Format the price with Indian currency format
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);
  
  // Determine if product has low stock
  const hasLowStock = product.minStock !== undefined && product.stock <= product.minStock;
  
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="relative pt-[100%] bg-muted">
        <img 
          src={product.image || '/placeholder.svg'} 
          alt={product.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {hasLowStock && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
            Low Stock
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-semibold">
            Out of Stock
          </div>
        )}
      </div>
      <CardContent className="flex-1 p-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{product.category}</div>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </div>
        <h3 className="font-medium leading-none mb-1 line-clamp-1">{product.name}</h3>
        <div className="mt-2 flex justify-between items-center">
          <div className="font-semibold">{formattedPrice}</div>
          <div className="text-xs text-muted-foreground">GST: {product.tax}%</div>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Stock: {product.stock} {product.minStock && `(Min: ${product.minStock})`}
        </div>
      </CardContent>
      {showAddToCart && (
        <CardFooter className="pt-0 pb-4 px-4">
          <Button 
            className="w-full" 
            variant="default" 
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
