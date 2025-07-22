import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Product } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';
import { useCart } from '@/contexts/CartContext';
import { Package } from 'lucide-react';
import { playBeep } from '@/lib/playBeep';

// MobileProductCard: a compact card for mobile product grid
// Mobile Product Card: e-commerce style layout optimized for mobile touch
const MobileProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col min-h-[240px]">
      {/* Image Container with Stock Badge */}
      <div className="relative mb-3">
        <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
          <img
            src={product.image_url || product.image || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Stock Badge */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
          <span className="text-xs font-medium text-gray-700">{product.stock}</span>
        </div>
      </div>
      {/* Product Details */}
      <div className="flex-1 flex flex-col">
        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight mb-1 min-h-[2.2rem]">
          {product.name}
        </h3>
        {/* Price - prominent, bold, dark, with background */}
        <div className="mb-3 mt-0.5 flex justify-center">
          <span className="text-lg font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
            ₹{typeof product.price === 'number' ? product.price : 0}
          </span>
        </div>
        {/* Add to Cart Button */}
        <button 
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 touch-manipulation"
          onClick={() => { addItem(product, 1); playBeep(); }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

// Compact POSProductCard: optimized for desktop POS grid with efficient space usage
const POSProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  return (
    <div className="flex items-center bg-white border border-indigo-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-2 w-[400]">
      {/* Product Image */}
      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-3">
        <img
          src={product.image_url || product.image || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Info Section */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
        {/* Top Row: Name + Add Button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-gray-900 truncate mb-0.5">{product.name}</div>
          </div>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow transition-all duration-150 self-center"
            onClick={(e) => { e.stopPropagation(); addItem(product, 1); playBeep(); }}
            title="Add to Cart"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        {/* Middle Row: Category + Price */}
        <div className="flex items-center gap-2 mt-1 mb-1">
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full truncate max-w-[80px]">
            {product.category}
          </span>
          <span className="font-bold text-green-700 text-lg ml-1">₹{typeof product.price === 'number' ? product.price : 0}</span>
        </div>
        {/* Bottom Row: Stock + GST */}
        <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
          <span className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            {product.stock} {product.unitLabel || 'pcs'}
          </span>
          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-700 font-medium">
            GST {product.tax || 0}%
          </span>
        </div>
      </div>
    </div>
  );
};
interface ProductGridProps {
  filteredProducts: Product[];
  activeTab: string;
  onTabChange: (value: string) => void;
  recentInvoices?: any[];
  usePOSCard?: boolean; // If true, use POSProductCard for desktop
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  filteredProducts,
  activeTab,
  onTabChange,
  recentInvoices = [],
  usePOSCard = false,
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
        {/* Mobile: 2-column grid with MobileProductCard, Desktop: POSProductCard or ProductCard grid */}
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          {filteredProducts.map((product) => (
            <div key={product.id} className="h-full">
              <div className="block lg:hidden">
                <MobileProductCard product={product} />
              </div>
              <div className="hidden lg:block h-full">
                {usePOSCard ? (
                  <POSProductCard product={product} />
                ) : (
                  <ProductCard product={product} />
                )}
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
