
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { PlusCircle, Tag, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  showDeleteButton?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, showAddToCart = true, showDeleteButton = false, onDelete, onEdit }) => {
  const { addItem } = useCart();
  const { profile } = useAuth();

  const handleAddToCart = () => {
    addItem(product, 1);
  };

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  // For weight/volume products, check stockByWeight or consider infinite stock
  const isWeightVolume = product.unitType === 'weight' || product.unitType === 'volume';
  const hasStock = isWeightVolume ? 
    (product.stockByWeight ? product.stockByWeight > 0 : true) : // Infinite stock if no stockByWeight
    (product.stock > 0);
  
  const hasLowStock = product.minStock !== undefined && product.stock <= product.minStock;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="relative pt-[100%] bg-muted">
        <img 
          src={product.image_url || product.image || '/placeholder.svg'} 
          alt={product.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {showDeleteButton && onDelete && (
          <button
            type="button"
            className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow focus:outline-none z-10"
            title="Delete Product"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        {/* Edit Button for Admins */}
        {showDeleteButton && onEdit && (
          <button
            type="button"
            className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow focus:outline-none z-10"
            title="Edit Product"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
        {hasLowStock && (
          <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
            Low Stock
          </div>
        )}
        {!hasStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-semibold text-xs">
            Out of Stock
          </div>
        )}
      </div>
      <CardContent className="flex-1 p-3">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{product.category}</div>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </div>
        <h3 className="font-medium leading-none mb-1 text-sm line-clamp-1">{product.name}</h3>
        <div className="mt-1 flex justify-between items-center">
          <div className="font-semibold text-sm">{formattedPrice}</div>
          <div className="text-xs text-muted-foreground">GST: {product.tax}%</div>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {isWeightVolume ? (
            product.stockByWeight ? 
              `Stock: ${product.stockByWeight} ${product.unitLabel}` :
              `Stock: Infinite (Bulk Item)`
          ) : (
            `Stock: ${product.stock} ${product.minStock && `(Min: ${product.minStock})`}`
          )}
        </div>
      </CardContent>
      {showAddToCart && (
        <CardFooter className="pt-0 pb-3 px-3">
          <Button 
            className="w-full" 
            variant="default" 
            size="sm"
            onClick={handleAddToCart}
            disabled={!hasStock}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
