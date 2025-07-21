import React from 'react';
import ProductCard from './ProductCard';
import { Checkbox } from '@/components/ui/checkbox';

const ProductsList = ({
  products,
  viewMode,
  selectedProducts,
  onProductSelect,
  onEdit,
  onDelete,
  onStockUpdate,
  profile,
  productRefs,
  highlightedId
}) => {
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-lg font-semibold">No products found</h3>
        <p className="text-muted-foreground mt-1">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }
  return (
    <div className={viewMode === 'grid' 
      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
      : "space-y-2"
    }>
      {products.map(product => (
        <div
          key={product.id}
          ref={el => (productRefs.current[product.id] = el)}
          className={highlightedId === product.id ? 'ring-4 ring-amber-400 transition-all duration-500' : ''}
        >
          {viewMode === 'grid' ? (
            <div className="max-w-[180px] mx-auto flex flex-col items-center">
              <div className="mb-2 flex items-center w-full justify-between">
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={(checked) => onProductSelect(product.id, checked as boolean)}
                />
              </div>
              <ProductCard
                product={product}
                showAddToCart={false}
                showDeleteButton={!!profile && (profile.role === 'admin' || profile.role === 'manager')}
                onDelete={onDelete}
                onEdit={() => onEdit(product)}
                onStockUpdate={onStockUpdate}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Checkbox
                checked={selectedProducts.includes(product.id)}
                onCheckedChange={(checked) => onProductSelect(product.id, checked as boolean)}
              />
              <img 
                src={product.image_url || product.image || '/placeholder.svg'} 
                alt={product.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.category}</p>
                <p className="text-sm">Stock: {product.stock}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold">₹{product.price}</div>
                <div className="text-sm text-muted-foreground">GST: {product.tax}%</div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProductsList; 