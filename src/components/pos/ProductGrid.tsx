
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Product } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';

interface ProductGridProps {
  filteredProducts: Product[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  filteredProducts,
  activeTab,
  onTabChange
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="products" className="flex-1">Products</TabsTrigger>
        <TabsTrigger value="recent" className="flex-1">Recent Sales</TabsTrigger>
        <TabsTrigger value="favorites" className="flex-1">Favorites</TabsTrigger>
      </TabsList>
      <TabsContent value="products" className="mt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="recent" className="mt-4">
        <div className="text-center p-6 text-muted-foreground">
          Recent sales will appear here
        </div>
      </TabsContent>
      <TabsContent value="favorites" className="mt-4">
        <div className="text-center p-6 text-muted-foreground">
          Favorite products will appear here
        </div>
      </TabsContent>
    </Tabs>
  );
};
