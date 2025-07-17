import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Product } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';
import { useCart } from '@/contexts/CartContext';
// MobileProductCard: a compact card for mobile product grid
const MobileProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  return (
    <div className="bg-white border rounded-lg p-2 flex flex-col items-center justify-between h-full shadow-sm">
      <img src={product.image_url || product.image || '/placeholder.svg'} alt={product.name} className="w-12 h-12 object-cover rounded mb-1" />
      <div className="text-xs font-semibold truncate w-full text-center">{product.name}</div>
      <div className="text-[10px] text-gray-500 truncate w-full text-center">₹{product.price}</div>
      <button
        className="mt-1 w-full bg-indigo-600 text-white text-xs rounded py-1 hover:bg-indigo-700 transition"
        onClick={() => addItem(product, 1)}
      >Add</button>
    </div>
  );
};

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

      {/* Products Tab */}
      <TabsContent value="products" className="mt-4">
        {/* Mobile: 2-column grid with MobileProductCard, Desktop: original ProductCard grid */}
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          {filteredProducts.map((product) => (
            <div key={product.id} className="h-full">
              <div className="block lg:hidden">
                <MobileProductCard product={product} />
              </div>
              <div className="hidden lg:block h-full">
                <ProductCard product={product} />
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      {/* Recent Sales Tab */}
      <TabsContent value="recent" className="mt-4">
        {recentInvoices.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">
            No recent sales found
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 border rounded-md border-gray-300">
            <table className="min-w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 border border-gray-300 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer select-none">
                    Invoice # <span className="inline-block ml-1">&#x25B2;&#x25BC;</span>
                  </th>
                  <th className="px-3 py-2 border border-gray-300 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer select-none">
                    Date <span className="inline-block ml-1">&#x25B2;&#x25BC;</span>
                  </th>
                  <th className="px-3 py-2 border border-gray-300 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer select-none">
                    Customer <span className="inline-block ml-1">&#x25B2;&#x25BC;</span>
                  </th>
                  <th className="px-3 py-2 border border-gray-300 text-right font-semibold text-xs uppercase tracking-wider cursor-pointer select-none">
                    Amount <span className="inline-block ml-1">&#x25B2;&#x25BC;</span>
                  </th>
                  <th className="px-3 py-2 border border-gray-300 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer select-none">
                    Payment <span className="inline-block ml-1">&#x25B2;&#x25BC;</span>
                  </th>
                  <th className="px-3 py-2 border border-gray-300 text-left font-semibold text-xs uppercase tracking-wider cursor-pointer select-none">
                    Status <span className="inline-block ml-1">&#x25B2;&#x25BC;</span>
                  </th>
                  <th className="px-3 py-2 border border-gray-300 text-left font-semibold text-xs uppercase tracking-wider">
                    Products
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv, index) => (
                  <tr key={inv.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                    <td
                      className="px-3 py-2 border border-gray-300 text-left text-xs font-medium truncate max-w-[120px]"
                      title={inv.invoiceNumber}
                    >
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-3 py-2 border border-gray-300 text-left text-xs font-medium whitespace-nowrap">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleString() : ''}
                    </td>
                    <td
                      className="px-3 py-2 border border-gray-300 text-left text-xs font-medium truncate max-w-[140px]"
                      title={inv.customer?.name || 'Walk-in'}
                    >
                      {inv.customer?.name || 'Walk-in'}
                    </td>
                    <td className="px-3 py-2 border border-gray-300 text-right text-xs font-semibold text-green-700">
                      ₹{Number(inv.total).toLocaleString('en-IN')}
                    </td>
                    <td
                      className="px-3 py-2 border border-gray-300 text-left text-xs font-medium truncate max-w-[100px]"
                      title={inv.paymentMethod}
                    >
                      {inv.paymentMethod}
                    </td>
                    <td
                      className="px-3 py-2 border border-gray-300 text-left text-xs font-medium truncate max-w-[100px]"
                      title={inv.paymentStatus}
                    >
                      {inv.paymentStatus}
                    </td>
                    <td className="px-3 py-2 border border-gray-300 text-left text-xs font-medium max-w-[200px]">
                      {(inv.items || []).map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="truncate"
                          title={`${item.product?.name || ''} x${item.quantity}`}
                        >
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

      {/* Favorites Tab */}
      <TabsContent value="favorites" className="mt-4">
        <div className="text-center p-6 text-muted-foreground">
          Favorite products will appear here
        </div>
      </TabsContent>
    </Tabs>
  );
};
