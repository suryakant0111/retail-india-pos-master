import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Tag, Trash2, Edit, Package, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { playBeep } from '@/lib/playBeep';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  showDeleteButton?: boolean;
  onDelete?: (id: string) => void;
  
  onEdit?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showAddToCart = true,
  showDeleteButton = false,
  onDelete,
  onEdit
}) => {
  const { addItem } = useCart();
  const { profile } = useAuth();

  const handleAddToCart = () => {
    addItem(product, 1);
    playBeep();
  };

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const isWeightVolume = product.unitType === 'weight' || product.unitType === 'volume';
  // For bulk products, treat null/undefined/0 as available
  const hasStock = isWeightVolume
    ? (product.stockByWeight === null || product.stockByWeight === undefined || product.stockByWeight === 0 ? true : product.stockByWeight > 0)
    : (product.stock > 0);
  const hasLowStock = product.minStock !== undefined && product.stock <= product.minStock;

  return (
    <Card className="w-40 h-20 p-1 flex flex-row items-center min-w-0 bg-gradient-to-br from-white to-gray-50 border-2 border-indigo-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] relative group lg:w-48 lg:h-24 lg:p-0">
      {/* Image */}
      <div className="relative flex-shrink-0 w-12 h-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden lg:w-16">
        <img
          src={product.image_url || product.image || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Action Buttons */}
        {showDeleteButton && (onDelete || onEdit) && (
          <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {onEdit && (
              <button
                type="button"
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 shadow-lg focus:outline-none"
                title="Edit Product"
                onClick={onEdit}
              >
                <Edit className="h-3 w-3" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg focus:outline-none"
                title="Delete Product"
                onClick={() => onDelete(product.id)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
        {/* Stock Badges */}
        {/* Remove the overlay that covers the card when out of stock */}
        {/*
        {!hasStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Out of Stock
            </div>
          </div>
        )}
        */}
        {/* Instead, just show a badge in the corner if out of stock */}
        {/* Removed out of stock badge to avoid overlapping with buttons */}
        {/*
        {!hasStock && (
          <div className="absolute top-1 left-1>
            <div className="bg-red-50 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1>            <AlertTriangle className="h-3 w-3
              Out of Stock
            </div>
          </div>
        )}
        */}
        {/* Out of stock badge positioned to avoid overlapping */}
        {!hasStock && !(
          isWeightVolume && (product.stockByWeight === null || product.stockByWeight === undefined || product.stockByWeight === 0)
        ) && (
          <div className="absolute bottom-1 right-1">
            <div className="bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="h-2 w-2" />
              Out
            </div>
          </div>
        )}
        {hasLowStock && hasStock && (
          <div className="absolute bottom-1 left-1">
            <div className="bg-amber-500 text-white text-[9px] font-semibold px-1 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="h-2 w-2" />
              Low
            </div>
          </div>
        )}
      </div>
      {/* Content */}
      <div className="flex-1 flex flex-col justify-between p-1 min-w-0 h-full lg:p-2">
        {/* Top Row: Name + Add Button */}
        <div className="flex items-center justify-between gap-1">
          <h3 className="font-bold text-[11px] text-gray-900 truncate max-w-[60px] lg:text-xs lg:max-w-[80px]">{product.name}</h3>
          {showAddToCart && (
            <Button
              className={`
                h-7 w-7 p-0 rounded-full flex items-center justify-center
                ${hasStock
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
              variant="default"
              size="sm"
              onClick={handleAddToCart}
              disabled={!hasStock}
              title={hasStock ? "Add to Cart" : "Out of Stock"}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </div>
        {/* Category + Price */}
        <div className="flex items-center gap-1 mt-0.5 lg:mt-1">
          <span className="bg-blue-100 text-blue-700 text-[9px] font-medium px-1 py-0.5 rounded-full flex items-center gap-1">
            <Tag className="h-2 w-2" />
            <span className="truncate max-w-[40px]">{product.category}</span>
          </span>
          <span className="font-bold text-xs text-green-600 ml-auto">{formattedPrice}</span>
        </div>
        {/* Stock + GST */}
        <div className="flex items-center justify-between text-[9px] text-gray-500 mt-0.5 lg:mt-1">
          <div className="flex items-center gap-1">
            <Package className="h-2.5 w-2.5" />
            <span className="truncate max-w-[28px] lg:max-w-[40px]">
              {isWeightVolume
                ? (product.stockByWeight
                  ? `${product.stockByWeight} ${product.unitLabel}`
                  : `Bulk`)
                : `${product.stock} pcs`}
            </span>
          </div>
          <span className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded-full ml-1">
            GST {product.tax}%
          </span>
        </div>
      </div>
      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  );
};
