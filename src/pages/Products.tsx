
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductAnalytics } from '@/components/products/ProductAnalytics';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductBulkActions } from '@/components/products/ProductBulkActions';
import { ProductQuickActions } from '@/components/products/ProductQuickActions';
import { MobileQRScanner } from '@/components/products/MobileQRScanner';
import { Product } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, Grid, List, Download, Upload, Camera, QrCode, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateNextBarcode } from '@/lib/barcode-utils';
import { BarcodeProductData } from '@/services/barcode-service';

const Products = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  // Add global polling state
  const [isMobilePolling, setIsMobilePolling] = useState(false);
  const mobileScannerStopRef = useRef<() => void>();
  
  // Debug logging for mobile polling state
  console.log('🔍 [Products] isMobilePolling state:', isMobilePolling);
  // Bulk add state
  const [bulkAddMode, setBulkAddMode] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  
  // Bulk edit modal state
  const [editIndex, setEditIndex] = useState<number | null>(null);
  // Remove duplicate editProduct/setEditProduct declarations (keep only one)
  const [lastScannedProduct, setLastScannedProduct] = useState<any | null>(null);

  // Hooks
  const { 
    products, 
    loading, 
    error, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    bulkDelete, 
    bulkUpdate,
    duplicateProduct,
    searchByBarcode 
  } = useProducts();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Helper function to get unit labels based on unit type
  const getUnitLabels = (unitType: string) => {
    if (!unitType || unitType.trim() === '') {
      return ['pcs', 'units']; // Default fallback
    }
    
    switch (unitType) {
      case 'weight':
        return ['kg', 'g'];
      case 'volume':
        return ['L', 'ml'];
      case 'length':
        return ['m', 'cm'];
      case 'unit':
      default:
        return ['pcs', 'units'];
    }
  };
  
  // Form setup
  const productForm = useForm({
    defaultValues: {
      name: '',
      category: '',
      price: '',
      stock: '',
      description: '',
      barcode: '',
      tax: '',
      minStock: '',
      costPrice: '',
      hsn: '',
      unitType: 'unit',
      unitLabel: 'pcs',
      pricePerUnit: '',
      stockByWeight: '',
      tareWeight: '',
      isActive: true
    }
  });

  // Reset form when editProduct changes
  useEffect(() => {
    if (editProduct) {
      productForm.reset({
        name: editProduct.name || '',
        category: editProduct.category || '',
        price: editProduct.price?.toString() || '',
        stock: editProduct.stock?.toString() || '',
        description: editProduct.description || '',
        barcode: editProduct.barcode || '',
        tax: editProduct.tax?.toString() || '',
        minStock: editProduct.minStock?.toString() || '',
        costPrice: editProduct.costPrice?.toString() || '',
        hsn: editProduct.hsn || '',
        unitType: editProduct.unitType || 'unit',
        unitLabel: editProduct.unitLabel || 'pcs',
        pricePerUnit: editProduct.pricePerUnit?.toString() || '',
        stockByWeight: editProduct.stockByWeight?.toString() || '',
        tareWeight: editProduct.tareWeight?.toString() || '',
        isActive: editProduct.isActive !== false
      });
    }
  }, [editProduct, productForm]);

  // Highlight product from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlight = params.get('highlight');
    if (highlight) {
      setHighlightedId(highlight);
      setTimeout(() => setHighlightedId(null), 2500);
      setTimeout(() => {
        const ref = productRefs.current[highlight];
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [location.search, products]);
  
  // Get unique categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(cat => cat && cat.trim() !== '')))];
  
  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
    
    const matchesCategory = category === 'all' || product.category === category;
    
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    // For weight/volume products, check stockByWeight or consider infinite stock
    const isWeightVolume = product.unitType === 'weight' || product.unitType === 'volume';
    const hasStock = isWeightVolume ? 
      (product.stockByWeight ? product.stockByWeight > 0 : true) : // Infinite stock if no stockByWeight
      (product.stock > 0);
    
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'in-stock' && hasStock) ||
                        (stockFilter === 'low-stock' && product.minStock && product.stock <= product.minStock) ||
                        (stockFilter === 'out-of-stock' && !hasStock);
    
    const matchesDate = !dateFilter; // Date filtering disabled since createdAt column doesn't exist
    
    return matchesSearch && matchesCategory && matchesPrice && matchesStock && matchesDate;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategory('all');
    setPriceRange([0, 10000]);
    setStockFilter('all');
    setDateFilter(undefined);
  };

  // Handle product selection
  const handleProductSelection = (productId: string, selected: boolean) => {
    if (selected) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "unsigned_preset");
      
      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dka53t4ym/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await response.json();
        
        if (data.secure_url) {
          setProductImage(data.secure_url);
          toast({
            title: "Image Uploaded",
            description: "Image uploaded successfully.",
            variant: "default",
          });
        } else {
          throw new Error(data.error?.message || "Upload failed");
        }
      } catch (error: any) {
        toast({
          title: "Upload Error",
          description: error.message || "Failed to upload image.",
          variant: "destructive",
        });
      }
    }
  };

  // Form submission handlers
  const handleAddProduct = async (data: any) => {
    try {
      // For weight/volume products, use stockByWeight instead of stock
      const isWeightVolume = data.unitType === 'weight' || data.unitType === 'volume';
      const stockValue = isWeightVolume ? 
        (data.stockByWeight ? parseFloat(data.stockByWeight) : 0) : // Use 0 instead of undefined
        (parseInt(data.stock) || 0);
      
      await addProduct({
        name: data.name,
        description: data.description,
        category: data.category,
        price: parseFloat(data.price),
        stock: stockValue,
        tax: parseFloat(data.tax) || 0,
        image_url: productImage,
        barcode: data.barcode,
        minStock: data.minStock ? parseInt(data.minStock) : undefined,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : undefined,
        hsn: data.hsn,
        unitType: data.unitType || 'unit',
        unitLabel: data.unitLabel || 'pcs',
        pricePerUnit: data.pricePerUnit ? parseFloat(data.pricePerUnit) : undefined,
        stockByWeight: data.stockByWeight ? parseFloat(data.stockByWeight) : undefined,
        tareWeight: data.tareWeight ? parseFloat(data.tareWeight) : 0
      });
      
      setShowAddProductDialog(false);
      setProductImage(null);
      productForm.reset();
      setLastScannedProduct(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleUpdateProduct = async (data: any) => {
    if (!editProduct) return;
    
    try {
      // For weight/volume products, use stockByWeight instead of stock
      const isWeightVolume = data.unitType === 'weight' || data.unitType === 'volume';
      const stockValue = isWeightVolume ? 
        (data.stockByWeight ? parseFloat(data.stockByWeight) : 0) : // Use 0 instead of undefined
        (parseInt(data.stock) || 0);
      
      await updateProduct(editProduct.id, {
        name: data.name,
        description: data.description,
        category: data.category,
        price: parseFloat(data.price),
        stock: stockValue,
        barcode: data.barcode,
        tax: parseFloat(data.tax),
        minStock: data.minStock ? parseInt(data.minStock) : undefined,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : undefined,
        hsn: data.hsn,
        unitType: data.unitType || 'unit',
        unitLabel: data.unitLabel || 'pcs',
        pricePerUnit: data.pricePerUnit ? parseFloat(data.pricePerUnit) : undefined,
        stockByWeight: data.stockByWeight ? parseFloat(data.stockByWeight) : undefined,
        tareWeight: data.tareWeight ? parseFloat(data.tareWeight) : 0
      });
      
      setEditProduct(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  // Quick actions handlers
  const handleQuickAdd = async (productData: any) => {
    try {
      await addProduct(productData);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = searchByBarcode(barcode);
    if (product) {
      navigate(`/products?highlight=${product.id}`);
    }
  };

  // Handle barcode scanner product data
  const handleBarcodeProductFound = (productData: BarcodeProductData) => {
    console.log('[Products] Received barcode product data:', productData);
    
    // First check if product already exists in our database using Supabase
    const existingProduct = products.find(p => p.barcode === productData.barcode);
    
    if (existingProduct) {
      toast({
        title: "Product Already Exists",
        description: `Product "${existingProduct.name}" with barcode ${productData.barcode} is already in your inventory.`,
        variant: "destructive"
      });
      // Keep scanner open so user can scan another product
      return;
    }
    
    if (!productData.found) {
      toast({
        title: "Product Not Found",
        description: `Couldn't find product details for barcode: ${productData.barcode}. You can still add it manually.`,
        variant: "destructive"
      });
      
      // Still open the form with just the barcode filled
      const formData = {
        name: '',
        category: '',
        price: '',
        stock: '1',
        description: `Product scanned: Barcode ${productData.barcode}`,
        barcode: productData.barcode,
        tax: '18',
        minStock: '5',
        costPrice: '',
        hsn: ''
      };
      
      productForm.reset(formData);
      setShowAddProductDialog(true);
      return;
    }

    setLastScannedProduct(productData);
    if (bulkAddMode) {
      setPendingProducts(prev => [...prev, {
        name: productData.name || '',
        category: productData.category || '',
        price: '',
        stock: '1',
        description: productData.description || `Product scanned: ${productData.name || 'Unknown'}`,
        barcode: productData.barcode,
        tax: '18',
        minStock: '5',
        costPrice: '',
        hsn: '',
        image_url: productData.image_url || ''
      }]);
      toast({
        title: "Product Queued",
        description: `Product '${productData.name || 'Unknown'}' added to bulk list. Keep scanning for more products.`,
        variant: "default"
      });
      // Don't close scanner in bulk mode - keep it open for more scans
      return;
    }
    
    // Auto-fill the add product form with scanned data
    const formData = {
      name: productData.name || '',
      category: productData.category || '',
      price: '',
      stock: '1',
      description: productData.description || `Product scanned: ${productData.name || 'Unknown'}`,
      barcode: productData.barcode,
      tax: '18', // Default GST rate
      minStock: '5',
      costPrice: '',
      hsn: ''
    };
    
    // Reset form with scanned data
    productForm.reset(formData);
    
    // Set the product image if available
    if (productData.image_url) {
      setProductImage(productData.image_url);
    }
    
    // Keep scanner open and show add product dialog
    setShowAddProductDialog(true);
    
    toast({
      title: "Product Found!",
      description: `Product "${productData.name || 'Unknown'}" found and form auto-filled. Keep scanning or close scanner when done.`,
      variant: "default"
    });
  };

  // Manual barcode entry for testing
  const handleManualBarcodeEntry = async (barcode: string) => {
    if (!barcode.trim()) return;
    
    try {
      // First check if product already exists in our database using Supabase
      const existingProduct = products.find(p => p.barcode === barcode.trim());
      
      if (existingProduct) {
        toast({
          title: "Product Already Exists",
          description: `Product "${existingProduct.name}" with barcode ${barcode.trim()} is already in your inventory.`,
          variant: "destructive"
        });
        return;
      }
      
      // Use the same backend endpoint that the mobile scanner uses
      let backendUrl = 'https://retail-india-pos-master.onrender.com';
      if (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) {
        backendUrl = 'http://localhost:3001';
      }
      
      const response = await fetch(`${backendUrl}/api/products/barcode/${barcode.trim()}`);
      const productData = await response.json();
      
      if (productData.found) {
        handleBarcodeProductFound(productData);
      } else {
        toast({
          title: "Product Not Found",
          description: `Couldn't find product details for barcode: ${barcode.trim()}. You can still add it manually.`,
          variant: "destructive"
        });
        
        // Open form with just the barcode
        const formData = {
          name: '',
          category: '',
          price: '',
          stock: '1',
          description: `Product scanned: Barcode ${barcode.trim()}`,
          barcode: barcode.trim(),
          tax: '18',
          minStock: '5',
          costPrice: '',
          hsn: ''
        };
        
        productForm.reset(formData);
        setShowAddProductDialog(true);
      }
    } catch (error) {
      console.error('[Products] Error fetching product data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch product data. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Auto-fill form with lastScannedProduct when opening Add Product dialog
  useEffect(() => {
    if (showAddProductDialog && lastScannedProduct) {
      const formData = {
        name: lastScannedProduct.name || '',
        category: lastScannedProduct.category || '',
        price: '',
        stock: '1',
        description: lastScannedProduct.description || `Product scanned: ${lastScannedProduct.name || 'Unknown'}`,
        barcode: lastScannedProduct.barcode,
        tax: '18',
        minStock: '5',
        costPrice: '',
        hsn: ''
      };
      productForm.reset(formData);
      if (lastScannedProduct.image_url) {
        setProductImage(lastScannedProduct.image_url);
      }
      setLastScannedProduct(null);
    }
  }, [showAddProductDialog]);

  // Import/Export handlers
  const handleImport = async (file: File) => {
    // TODO: Implement CSV/Excel import
    toast({
      title: "Import Feature",
      description: "Import functionality will be implemented soon.",
      variant: "default"
    });
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: "Export Feature",
      description: "Export functionality will be implemented soon.",
      variant: "default"
    });
  };

  const handleEditPending = (index: number) => {
    setEditIndex(index);
    setEditProduct({ ...pendingProducts[index] });
  };

  const handleSaveEdit = () => {
    if (editIndex !== null && editProduct) {
      setPendingProducts(prev => prev.map((p, i) => (i === editIndex ? editProduct : p)));
      setEditIndex(null);
      setEditProduct(null);
    }
  };

  const handleRemovePending = (index: number) => {
    setPendingProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkAddAll = async () => {
    for (const p of pendingProducts) {
      await addProduct({
        ...p,
        price: parseFloat(p.price) || 0,
        stock: parseInt(p.stock) || 1,
        tax: parseFloat(p.tax) || 0,
        minStock: p.minStock ? parseInt(p.minStock) : undefined,
        costPrice: p.costPrice ? parseFloat(p.costPrice) : undefined,
      });
    }
    setPendingProducts([]);
    toast({
      title: 'Bulk Add Complete',
      description: 'All pending products have been added.',
      variant: 'success',
    });
  };

  if (loading) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Products</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
        <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product inventory ({products.length} products)
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant={bulkAddMode ? "default" : "outline"} onClick={() => setBulkAddMode(b => !b)}>
            {bulkAddMode ? 'Bulk Add: ON' : 'Bulk Add Products'}
          </Button>
          <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)}>
            Analytics
          </Button>
          <Button variant="outline" onClick={() => {
            setShowBarcodeScanner(true);
            setIsMobilePolling(true);
          }}>
            <QrCode className="mr-2 h-4 w-4" /> Mobile QR Scan
          </Button>
          {/* Test barcode scanning */}
          <Button 
            variant="outline" 
            onClick={() => handleManualBarcodeEntry('049000006344')}
            title="Test with Coca-Cola barcode"
          >
            Test Scan
          </Button>
          {/* Stop Polling button outside dialog */}
          {isMobilePolling && (
            <Button variant="destructive" onClick={() => {
              if (mobileScannerStopRef.current) mobileScannerStopRef.current();
              setIsMobilePolling(false);
              setShowBarcodeScanner(false);
            }}>
              Stop Mobile Scanner
            </Button>
          )}
          <Button onClick={() => setShowAddProductDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>
      
      {/* Bulk Add Panel Placeholder */}
      {bulkAddMode && pendingProducts.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h2 className="text-lg font-semibold mb-2">Bulk Add Pending Products</h2>
          <p className="text-sm text-muted-foreground mb-2">Review, edit, or remove products before adding all at once.</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-blue-100">
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Category</th>
                  <th className="p-2 border">Barcode</th>
                  <th className="p-2 border">Stock</th>
                  <th className="p-2 border">Price</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingProducts.map((p, i) => (
                  <tr key={i} className="bg-white">
                    <td className="p-2 border">{p.name}</td>
                    <td className="p-2 border">{p.category}</td>
                    <td className="p-2 border">{p.barcode}</td>
                    <td className="p-2 border">{p.stock}</td>
                    <td className="p-2 border">{p.price}</td>
                    <td className="p-2 border">
                      <Button size="icon" variant="ghost" onClick={() => handleEditPending(i)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleRemovePending(i)} title="Remove">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleBulkAddAll} disabled={pendingProducts.length === 0}>
              Add All
            </Button>
          </div>
          {/* Edit Modal */}
          {editIndex !== null && editProduct && (
            <Dialog open={true} onOpenChange={() => { setEditIndex(null); setEditProduct(null); }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Pending Product</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Name</label>
                  <input className="w-full border rounded px-2 py-1" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} placeholder="Product Name" />
                  <label className="block text-sm font-medium">Category</label>
                  <input className="w-full border rounded px-2 py-1" value={editProduct.category} onChange={e => setEditProduct({ ...editProduct, category: e.target.value })} placeholder="Category" />
                  <label className="block text-sm font-medium">Barcode</label>
                  <input className="w-full border rounded px-2 py-1" value={editProduct.barcode} onChange={e => setEditProduct({ ...editProduct, barcode: e.target.value })} placeholder="Barcode" />
                  <label className="block text-sm font-medium">Stock</label>
                  <input className="w-full border rounded px-2 py-1" type="number" value={String(editProduct.stock)} onChange={e => setEditProduct({ ...editProduct, stock: parseInt(e.target.value) || 0 })} placeholder="Stock" />
                  <label className="block text-sm font-medium">Price</label>
                  <input className="w-full border rounded px-2 py-1" type="number" value={String(editProduct.price)} onChange={e => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })} placeholder="Price" />
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveEdit}>Save</Button>
                  <Button variant="outline" onClick={() => { setEditIndex(null); setEditProduct(null); }}>Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* Analytics */}
      {showAnalytics && <ProductAnalytics products={products} />}

      {/* Quick Actions */}
      <ProductQuickActions
        onQuickAdd={handleQuickAdd}
        onDuplicate={(productId: string) => {
          const product = products.find(p => p.id === productId);
          if (product) {
            duplicateProduct(product);
          }
        }}
        onBarcodeScan={handleBarcodeScan}
        products={products}
      />

      {/* Bulk Actions */}
      <ProductBulkActions
        selectedProducts={selectedProducts}
        onBulkDelete={bulkDelete}
        onBulkUpdate={bulkUpdate}
        onImport={handleImport}
        onExport={handleExport}
      />

      {/* Filters */}
      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onClearFilters={clearFilters}
      />

      {/* View Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        
        {filteredProducts.length > 0 && (
        <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedProducts.length} of {filteredProducts.length} selected
            </span>
        </div>
        )}
      </div>
      
      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Grid className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No products found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <Button className="mt-4" onClick={() => setShowAddProductDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Product
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
          : "space-y-2"
        }>
          {filteredProducts.map(product => (
            <div
              key={product.id}
              ref={el => (productRefs.current[product.id] = el)}
              className={highlightedId === product.id ? 'ring-4 ring-amber-400 transition-all duration-500' : ''}
            >
              {viewMode === 'grid' ? (
                <div className="max-w-[180px] mx-auto">
                  <div className="mb-2">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleProductSelection(product.id, checked as boolean)}
                    />
                  </div>
              <ProductCard
                product={product}
                showAddToCart={false}
                showDeleteButton={!!profile && profile.role === 'admin'}
                    onDelete={deleteProduct}
                onEdit={() => setEditProduct(product)}
              />
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => handleProductSelection(product.id, checked as boolean)}
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
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditProduct(product)}>
                      Edit
                    </Button>
                    {profile?.role === 'admin' && (
                      <Button size="sm" variant="destructive" onClick={() => deleteProduct(product.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Add Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new product to your inventory.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Tax</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
          <Form {...productForm}>
              <form onSubmit={productForm.handleSubmit(handleAddProduct)}>
                <TabsContent value="basic" className="space-y-4">
              <FormField
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={productForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                          <Textarea placeholder="Enter product description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={productForm.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Enter product barcode" {...field} />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              title="Generate Sequential Barcode" 
                          onClick={() => {
                                const nextBarcode = generateNextBarcode(products);
                                field.onChange(nextBarcode);
                              }}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              title="Scan Real Barcode" 
                          onClick={() => {
                                setShowBarcodeScanner(true);
                              }}
                            >
                              <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Unit Type and Label Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="unitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unit">Pieces (pcs)</SelectItem>
                            <SelectItem value="weight">Weight (kg/g)</SelectItem>
                            <SelectItem value="volume">Volume (L/ml)</SelectItem>
                            <SelectItem value="length">Length (m/cm)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={productForm.control}
                  name="unitLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Label</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit label" />
                          </SelectTrigger>
                          <SelectContent>
                            {getUnitLabels(productForm.watch('unitType')).map(label => (
                              <SelectItem key={label} value={label}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
                </TabsContent>
                
                <TabsContent value="pricing" className="space-y-4">
                  <FormField
                    control={productForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter price" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter cost price" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="tax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST/Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={100} step={0.01} placeholder="Enter GST/Tax rate" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Initial Stock - Only show for regular products (not weight/volume) */}
                  {(productForm.watch('unitType') === 'unit' || productForm.watch('unitType') === 'length' || !productForm.watch('unitType')) && (
                    <FormField
                      control={productForm.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Stock *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Enter stock quantity" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <FormField
                    control={productForm.control}
                    name="minStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Stock Level</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter minimum stock level" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={productForm.control}
                    name="hsn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HSN Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter HSN code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />



                  {/* Weight/Volume Specific Fields - Only show for weight/volume products */}
                  {(productForm.watch('unitType') === 'weight' || productForm.watch('unitType') === 'volume') && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm font-medium text-blue-800">
                        Weight/Volume Settings
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={productForm.control}
                          name="pricePerUnit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price Per Unit (₹)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder={`Price per ${productForm.watch('unitLabel') || 'unit'}`}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={productForm.control}
                          name="stockByWeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stock by Weight/Volume (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.001" 
                                  placeholder={`Leave empty for infinite stock`}
                                  {...field} 
                                />
                              </FormControl>
                              <div className="text-xs text-muted-foreground">
                                Leave empty for bulk items (sugar, oil, etc.) or enter specific weight/volume
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                                              {/* Stock Management Toggle */}
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="infiniteStock"
                            checked={!productForm.watch('stockByWeight')}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                productForm.setValue('stockByWeight', '');
                              }
                            }}
                          />
                          <label htmlFor="infiniteStock" className="text-sm font-medium">
                            Infinite Stock (Bulk Items)
                          </label>
                        </div>
                        
                        {/* Out of Stock Toggle */}
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="outOfStock"
                            checked={productForm.watch('isActive') === false}
                            onCheckedChange={(checked) => {
                              productForm.setValue('isActive', !checked);
                            }}
                          />
                          <label htmlFor="outOfStock" className="text-sm font-medium text-red-600">
                            Out of Stock (Manual Toggle)
                          </label>
                        </div>
                      </div>
                    )}

                  {/* Tare Weight - Only show for weight/volume products */}
                  {(productForm.watch('unitType') === 'weight' || productForm.watch('unitType') === 'volume') && (
                    <FormField
                      control={productForm.control}
                      name="tareWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tare Weight (for containers)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.001" 
                              placeholder="Container weight (default 0)" 
                              {...field} 
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            Weight of empty container. Will be subtracted from total weight during sales.
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
              
              <FormItem>
                <FormLabel>Product Image</FormLabel>
                    <div className="mt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  
                  {productImage ? (
                    <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={productImage} 
                        alt="Product preview" 
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={() => setProductImage(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-40 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                    >
                          <Upload className="h-10 w-10 text-gray-300" />
                      <div className="text-sm text-muted-foreground text-center">
                        <p>Click to upload image</p>
                        <p className="text-xs">JPG, PNG, GIF up to 5MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </FormItem>
                </TabsContent>
              
              <DialogFooter>
                <Button type="submit">Add Product</Button>
              </DialogFooter>
            </form>
          </Form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editProduct} onOpenChange={open => { if (!open) setEditProduct(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details and inventory information.
            </DialogDescription>
          </DialogHeader>
          {editProduct && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Tax</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
            <Form {...productForm}>
                <form onSubmit={productForm.handleSubmit(handleUpdateProduct)}>
                  <TabsContent value="basic" className="space-y-4">
              <FormField
                control={productForm.control}
                  name="name"
                render={({ field }) => (
                  <FormItem>
                          <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                            <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                    
              <FormField
                control={productForm.control}
                  name="category"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Category</FormLabel>
                    <FormControl>
                            <Input placeholder="Enter category" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={productForm.control}
                  name="description"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Description</FormLabel>
                    <FormControl>
                            <Textarea placeholder="Enter product description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
                <FormField
                  control={productForm.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                            <div className="flex gap-2">
                              <Input placeholder="Enter product barcode" {...field} />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon" 
                                title="Generate Sequential Barcode" 
                                onClick={() => {
                                  const nextBarcode = generateNextBarcode(products);
                                  field.onChange(nextBarcode);
                                }}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon" 
                                title="Scan Real Barcode" 
                                onClick={() => {
                                  setShowBarcodeScanner(true);
                                }}
                              >
                                <Camera className="h-4 w-4" />
                              </Button>
                            </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  </TabsContent>
                  
                  <TabsContent value="pricing" className="space-y-4">
                <FormField
                  control={productForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                          <FormLabel>Price (₹) *</FormLabel>
                      <FormControl>
                            <Input type="number" placeholder="Enter price" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                    
                <FormField
                  control={productForm.control}
                      name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                          <FormLabel>Cost Price (₹)</FormLabel>
                      <FormControl>
                            <Input type="number" placeholder="Enter cost price" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                    
                <FormField
                  control={productForm.control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST/Tax Rate (%)</FormLabel>
                      <FormControl>
                            <Input type="number" min={0} max={100} step={0.01} placeholder="Enter GST/Tax rate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                    
                <FormField
                  control={productForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                          <FormLabel>Current Stock *</FormLabel>
                      <FormControl>
                            <Input type="number" placeholder="Enter stock quantity" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                <FormField
                  control={productForm.control}
                      name="minStock"
                  render={({ field }) => (
                    <FormItem>
                          <FormLabel>Minimum Stock Level</FormLabel>
                      <FormControl>
                            <Input type="number" placeholder="Enter minimum stock level" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                    
                <FormField
                  control={productForm.control}
                      name="hsn"
                  render={({ field }) => (
                    <FormItem>
                          <FormLabel>HSN Code</FormLabel>
                      <FormControl>
                            <Input placeholder="Enter HSN code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  </TabsContent>
              
              <DialogFooter>
                  <Button type="submit">Update Product</Button>
                    <Button type="button" variant="secondary" onClick={() => setEditProduct(null)}>
                      Cancel
                    </Button>
              </DialogFooter>
            </form>
          </Form>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile QR Scanner */}
      <MobileQRScanner
        open={showBarcodeScanner}
        onOpenChange={(open) => {
          setShowBarcodeScanner(open);
          // Don't reset polling state when dialog closes - let user manually stop
        }}
        onProductFound={handleBarcodeProductFound}
        onBarcodeScanned={handleManualBarcodeEntry}
        isPolling={isMobilePolling}
        setIsPolling={setIsMobilePolling}
        stopPollingRef={mobileScannerStopRef}
      />
    </div>
  );
};

export default Products;
