
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Product } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';

interface ProductGridProps {
  filteredProducts: Product[];
  activeTab: string;
  onTabChange: (value: string) => void;
  recentInvoices?: any[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  filteredProducts,
  activeTab,
  onTabChange,
  recentInvoices = [],
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="products" className="flex-1">Products</TabsTrigger>
        <TabsTrigger value="recent" className="flex-1">Recent Sales</TabsTrigger>
        <TabsTrigger value="favorites" className="flex-1">Favorites</TabsTrigger>
      </TabsList>
      <TabsContent value="products" className="mt-4">
        <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
          {filteredProducts.map((product) => (
            <div key={product.id} className="w-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="recent" className="mt-4">
        {recentInvoices.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">
            No recent sales found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-muted">
                  <th className="px-2 py-1 border">Invoice #</th>
                  <th className="px-2 py-1 border">Date</th>
                  <th className="px-2 py-1 border">Customer</th>
                  <th className="px-2 py-1 border">Amount</th>
                  <th className="px-2 py-1 border">Payment</th>
                  <th className="px-2 py-1 border">Status</th>
                  <th className="px-2 py-1 border">Products</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="px-2 py-1 border">{inv.invoiceNumber}</td>
                    <td className="px-2 py-1 border">{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : ''}</td>
                    <td className="px-2 py-1 border">{inv.customer?.name || 'Walk-in'}</td>
                    <td className="px-2 py-1 border">₹{Number(inv.total).toLocaleString('en-IN')}</td>
                    <td className="px-2 py-1 border">{inv.paymentMethod}</td>
                    <td className="px-2 py-1 border">{inv.paymentStatus}</td>
                    <td className="px-2 py-1 border">
                      {(inv.items || []).map((item: any, idx: number) => (
                        <div key={idx}>
                          {item.product?.name || ''} x{item.quantity}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>
      <TabsContent value="favorites" className="mt-4">
        <div className="text-center p-6 text-muted-foreground">
          Favorite products will appear here
        </div>
      </TabsContent>
    </Tabs>
  );
};
