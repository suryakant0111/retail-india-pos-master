import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product, StockAdjustment } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Tag, Trash2, Edit, Package, AlertTriangle, Plus, Minus, History, X, Check, TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { playBeep } from '@/lib/playBeep';
import { useStockBatches } from '@/contexts/StockBatchContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  showDeleteButton?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: () => void;
  onStockUpdate?: (productId: string, newStock: number) => void;
  isScannerActive?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showAddToCart = true,
  showDeleteButton = false,
  onDelete,
  onEdit,
  onStockUpdate,
  isScannerActive = false,
}) => {
  const { addItem } = useCart();
  const { profile } = useAuth();
  const { stockBatches, setStockBatches } = useStockBatches();
  const { toast } = useToast();
  
  // Stock management states
  const [showStockInput, setShowStockInput] = useState(false);
  const [stockQty, setStockQty] = useState('');
  const [stockNote, setStockNote] = useState('');
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [productStockHistory, setProductStockHistory] = useState<StockAdjustment[]>([]);
  const [showActions, setShowActions] = useState(false);

  // Add state for selected batch
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Fetch stock history from DB
  const fetchStockHistory = async () => {
    const { data, error } = await supabase
      .from('stock_adjustments')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });
    if (data) setProductStockHistory(data);
  };

  useEffect(() => {
    fetchStockHistory();
  }, [product.id]);

  // Get all available batches for this product
  const availableBatches = stockBatches
    .filter(b => b.product_id === product.id && b.quantity > 0)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // When Add to Cart is clicked, pass the selected batchId
  const handleAddToCart = () => {
    const batchIdToUse = selectedBatchId || (availableBatches[0]?.id ?? null);
    addItem(product, 1, undefined, batchIdToUse);
    playBeep();
  };

  const handleAddStock = async () => {
    const qty = parseInt(stockQty);
    if (!qty || isNaN(qty) || qty <= 0) {
      toast({ 
        title: 'Invalid Quantity', 
        description: 'Enter a valid quantity to add.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsAddingStock(true);
    
    const { error } = await supabase.from('stock_adjustments').insert([{
      product_id: product.id,
      quantity: qty,
      type: 'in',
      note: stockNote,
      user_id: profile?.id,
      shop_id: profile?.shop_id
    }]);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setIsAddingStock(false);
      return;
    }
    
    if (onStockUpdate) {
      onStockUpdate(product.id, product.stock + qty);
    }
    
    setStockQty('');
    setStockNote('');
    setShowStockInput(false);
    setIsAddingStock(false);
    
    toast({ 
      title: 'Stock Added', 
      description: `Added ${qty} to ${product.name}.` 
    });
    fetchStockHistory();
  };

  const handleQuickStockAdjustment = async (adjustment: number) => {
    if (onStockUpdate) {
      onStockUpdate(product.id, product.stock + adjustment);
      
      const { error } = await supabase.from('stock_adjustments').insert([{
        product_id: product.id,
        quantity: Math.abs(adjustment),
        type: adjustment > 0 ? 'in' : 'out',
        note: `Quick ${adjustment > 0 ? 'addition' : 'reduction'}`,
        user_id: profile?.id,
        shop_id: profile?.shop_id
      }]);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      
      toast({ 
        title: 'Stock Updated', 
        description: `${adjustment > 0 ? 'Added' : 'Reduced'} ${Math.abs(adjustment)} to ${product.name}.` 
      });
      fetchStockHistory();
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const isWeightVolume = product.unitType === 'weight' || product.unitType === 'volume';
  const hasStock = isWeightVolume
    ? (product.stockByWeight === null || product.stockByWeight === undefined || product.stockByWeight === 0 ? true : product.stockByWeight > 0)
    : (product.stock > 0);
  const hasLowStock = product.minStock !== undefined && product.stock <= product.minStock;

  // Stock status for display
  const getStockStatus = () => {
    if (!hasStock && !(isWeightVolume && (product.stockByWeight === null || product.stockByWeight === undefined || product.stockByWeight === 0))) {
      return { label: 'Out', color: 'bg-red-500', dotColor: 'bg-red-500' };
    }
    if (hasLowStock && hasStock) {
      return { label: 'Low', color: 'bg-amber-500', dotColor: 'bg-amber-500' };
    }
    return { label: 'OK', color: 'bg-green-500', dotColor: 'bg-green-500' };
  };

  const stockStatus = getStockStatus();

  const filteredStockHistory = productStockHistory.filter(a => a.product_id === product.id);

  return (
    <div className="relative w-full max-w-xs mx-auto">
      {/* Main Card */}
      <Card className="w-full bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
        
        {/* Compact Header Section */}
        <div className="relative p-3 border-b border-gray-100">
          <div className="flex items-start gap-3">
            
            {/* Compact Product Image */}
            <div className="relative flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
              <img
                src={product.image_url || product.image || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {/* Status Dot */}
              <div className="absolute -top-1 -right-1">
                <div className={`w-3 h-3 rounded-full border-2 border-white ${stockStatus.dotColor}`}></div>
              </div>
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      <Tag className="w-2.5 h-2.5" />
                      {product.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-green-600">{formattedPrice}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      GST {product.tax}%
                    </span>
                  </div>
                </div>
                
                {/* Actions Menu */}
                {(showDeleteButton || onEdit) && (
                  <div className="relative flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                      onClick={() => setShowActions(!showActions)}
                    >
                      <MoreVertical className="h-3 w-3 text-gray-600" />
                    </Button>
                    
                    {showActions && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowActions(false)}
                        ></div>
                        <div className="absolute top-7 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20 min-w-[110px]">
                          {onEdit && (
                            <button
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                              onClick={() => {
                                onEdit();
                                setShowActions(false);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                              onClick={() => {
                                onDelete(product.id);
                                setShowActions(false);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Stock Management */}
        <div className="px-3 py-2 bg-gray-50 space-y-2">
          
          {/* Stock Display Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">{product.stock}</span>
                {product.minStock && (
                  <span className="text-xs text-gray-500 ml-1">(min {product.minStock})</span>
                )}
              </span>
            </div>
            
            {/* Stock Trend */}
            {productStockHistory.length > 0 && (
              <div className="flex items-center gap-1">
                {productStockHistory[0].type === 'in' ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${productStockHistory[0].type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                  {productStockHistory[0].type === 'in' ? '+' : '-'}{productStockHistory[0].quantity}
                </span>
              </div>
            )}
          </div>

          {/* Compact Stock Controls */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-md"
              onClick={() => handleQuickStockAdjustment(-1)}
              disabled={product.stock <= 0}
              title="Remove 1"
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 border-green-200 bg-green-50 hover:bg-green-100 text-green-600 rounded-md"
              onClick={() => handleQuickStockAdjustment(1)}
              title="Add 1"
            >
              <Plus className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium rounded-md"
              onClick={() => setShowStockInput(true)}
            >
              Add Stock
            </Button>

            {isScannerActive && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-md"
                onClick={() => setShowStockHistory(true)}
                title="View History"
              >
                <History className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        {showAddToCart && availableBatches.length > 0 && (
          <div className="px-3 pt-2 pb-1">
            <div className="mb-1 text-xs font-semibold text-gray-700">Select Batch to Sell:</div>
            <select
              className="w-full border rounded px-2 py-1 text-sm mb-2"
              value={selectedBatchId || availableBatches[0]?.id || ''}
              onChange={e => setSelectedBatchId(e.target.value)}
            >
              {availableBatches.map(batch => (
                <option key={batch.id} value={batch.id}>
                  {new Date(batch.created_at).toLocaleDateString()} ({batch.quantity} left)
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-600">
              {availableBatches.map(batch => (
                <div key={batch.id}>
                  Batch: {new Date(batch.created_at).toLocaleDateString()} ({batch.quantity} left)
                </div>
              ))}
            </div>
          </div>
        )}
        {showAddToCart && (
          <div className="p-3 pt-2">
            <Button
              className={`w-full h-9 rounded-lg font-medium flex items-center justify-center gap-2 text-sm transition-all duration-200 ${
                hasStock
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleAddToCart}
              disabled={!hasStock}
            >
              <ShoppingCart className="h-4 w-4" />
              {hasStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        )}
      </Card>

      {/* Stock Input Modal */}
      {showStockInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold text-gray-900">Add Stock</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowStockInput(false)}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              
              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                <div className="text-xs text-gray-500 mt-1">Current stock: {product.stock}</div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to add *
                </label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  min="1"
                  className="h-11 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  autoFocus
                />
              </div>
              
              {/* Note Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optional)
                </label>
                <Input
                  type="text"
                  placeholder="Add a note about this stock adjustment"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  className="h-11 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAddStock}
                  disabled={isAddingStock || !stockQty}
                  className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingStock ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Add Stock
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowStockInput(false)}
                  className="px-6 h-11 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {showStockHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold text-gray-900">Stock History</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowStockHistory(false)}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              {/* Stock Added Section */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-green-700 mb-2">Stock Added</h4>
                {filteredStockHistory.filter(a => a.type === 'in').length === 0 ? (
                  <div className="text-center text-gray-500">No stock added yet.</div>
              ) : (
                <div className="space-y-3">
                    {filteredStockHistory.filter(a => a.type === 'in').map((adjustment) => (
                      <div key={adjustment.id} className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                        <div className="flex-shrink-0 p-2 rounded-full bg-green-100">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg text-green-600">+{adjustment.quantity}</span>
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full font-medium">Added</span>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            {new Date(adjustment.created_at).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {adjustment.note && (
                            <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg mt-2">
                              {adjustment.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Stock Removed/Sold Section */}
              <div>
                <h4 className="text-lg font-semibold text-red-700 mb-2">Stock Removed / Sold</h4>
                {filteredStockHistory.filter(a => a.type === 'out').length === 0 ? (
                  <div className="text-center text-gray-500">No stock removed or sold yet.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredStockHistory.filter(a => a.type === 'out').map((adjustment) => (
                      <div key={adjustment.id} className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
                        <div className="flex-shrink-0 p-2 rounded-full bg-red-100">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg text-red-600">-{adjustment.quantity}</span>
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full font-medium">Removed/Sold</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {new Date(adjustment.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {adjustment.note && (
                          <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg mt-2">
                            {adjustment.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Usage example with proper grid container
export const ProductGrid: React.FC<{ products: Product[] }> = ({ products }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          showAddToCart={true}
          showDeleteButton={false}
          isScannerActive={false}
        />
      ))}
    </div>
  );
};