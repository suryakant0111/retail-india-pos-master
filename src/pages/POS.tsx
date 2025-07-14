import React, { useState, useEffect } from 'react';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartSection } from '@/components/pos/CartSection';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { ReceiptDialog } from '@/components/pos/ReceiptDialog';
import { QuickProductBar } from '@/components/pos/QuickProductBar';
import { DailySalesSummary } from '@/components/pos/DailySalesSummary';
import { MobileScannerQR } from '@/components/pos/MobileScannerQR';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { mockCustomers } from '@/data/mockData';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/types';
import { useProfile } from '@/hooks/useProfile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NewCustomerDialog } from '@/components/pos/NewCustomerDialog';
import { UnitSelector } from '@/components/pos/UnitSelector';
import { convertUnit } from '@/lib/utils';

const ExcelCartQuantityInput = ({
  value,
  unitType,
  convertedUnitLabel,
  index,
  updateQuantity,
  updateQuantityWithUnit,
  toast
}: {
  value: number,
  unitType?: string,
  convertedUnitLabel?: string,
  index: number,
  updateQuantity: (index: number, qty: number) => void,
  updateQuantityWithUnit: (index: number, qty: number, unitLabel: string) => void,
  toast: any
}) => {
  const [inputValue, setInputValue] = React.useState(value.toString());
  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);
  const handleCommit = () => {
    let newQty = parseFloat(inputValue);
    if (isNaN(newQty) || newQty <= 0) {
      newQty = (unitType === 'weight' || unitType === 'volume') ? 0.01 : 1;
      setInputValue(newQty.toString());
      toast({
        title: 'Invalid Quantity',
        description: 'Quantity must be at least 1',
        variant: 'destructive',
      });
    }
    if (convertedUnitLabel) {
      updateQuantityWithUnit(index, newQty, convertedUnitLabel);
    } else {
      updateQuantity(index, newQty);
    }
  };
  return (
    <Input
      type="number"
      value={inputValue}
      onChange={e => setInputValue(e.target.value)}
      onBlur={handleCommit}
      onKeyDown={e => {
        if (e.key === 'Enter') handleCommit();
      }}
      className="w-20 border-0 p-0 bg-transparent"
      min="0"
      step={unitType === 'weight' || unitType === 'volume' ? "0.001" : "1"}
    />
  );
};

const POS = () => {
  const { 
    items, 
    subtotal, 
    taxTotal, 
    total, 
    customer,
    clearCart,
    discountValue,
    discountType,
    addItem,
    setTaxRate,
    removeItem,
    updateQuantity,
    updateQuantityWithUnit,
    updatePrice,
    setCustomer,
    taxRate
  } = useCart();
  
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceReference, setInvoiceReference] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businessSettings, setBusinessSettings] = useState<any>({});
  const [paymentSettings, setPaymentSettings] = useState<any>({});
  const [posMode, setPosMode] = useState<'retail' | 'kirana'>('retail');
  const { profile } = useProfile();
  // Remove paymentStatus and showStatusDialog state
  const [recentSalesProducts, setRecentSalesProducts] = useState<Product[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [cartType, setCartType] = useState<'pos' | 'excel'>('pos');
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({});
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  
  const fetchProducts = async () => {
    console.log('fetchProducts called with shop_id:', profile?.shop_id);
    if (!profile?.shop_id) {
      console.log('fetchProducts: No shop_id, returning early');
      return;
    }
    const { data, error } = await supabase.from('products').select('*').eq('shop_id', profile.shop_id);
    console.log('fetchProducts: Supabase response - data:', data, 'error:', error);
    if (error) {
      console.error('Error fetching products:', error);
    } else if (data) {
      console.log('fetchProducts: Setting products:', data);
      setProducts(data);
    } else {
      console.log('fetchProducts: No data returned from Supabase');
    }
  };

  // Fetch recent sales (latest 10 invoices)
  const fetchRecentSales = async () => {
    console.log('fetchRecentSales called with shop_id:', profile?.shop_id);
    if (!profile?.shop_id) return;
    const { data, error } = await supabase
      .from('invoices')
      .select('items')
      .eq('shop_id', profile.shop_id)
      .order('createdAt', { ascending: false })
      .limit(10);
    if (error) {
      console.error('Error fetching recent sales invoices:', error);
      return;
    }
    console.log('Fetched recent invoices:', data);
    if (data) {
      // Flatten all products from invoice items, robustly
      const products = data.flatMap(inv =>
        Array.isArray(inv.items)
          ? inv.items.map((item: any) => item && item.product ? item.product : null).filter(Boolean)
          : []
      );
      // Remove duplicates by product id
      const uniqueProducts = Array.from(new Map(products.map(p => [p.id, p])).values());
      console.log('Extracted recent sale products:', uniqueProducts);
      setRecentSalesProducts(uniqueProducts);
    }
  };

  // Fetch recent invoices (latest 10)
  const fetchRecentInvoices = async () => {
    console.log('fetchRecentInvoices called with shop_id:', profile?.shop_id);
    if (!profile?.shop_id) return;
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', profile.shop_id)
      .order('createdAt', { ascending: false })
      .limit(10);
    if (error) {
      console.error('Error fetching recent invoices:', error);
      return;
    }
    console.log('Fetched recent invoices:', data);
    setRecentInvoices(data || []);
  };

  useEffect(() => {
    console.log('POS profile:', profile);
    console.log('POS shop_id:', profile?.shop_id);
    if (profile?.shop_id) {
    fetchProducts();
      fetchRecentInvoices();
    async function fetchCustomers() {
      const { data, error } = await supabase.from('customers').select('*').eq('shop_id', profile.shop_id);
      if (error) {
        console.error('Error fetching customers:', error);
      } else if (data) {
        setCustomers(data);
        console.log(`Fetched customers for shop_id ${profile.shop_id}:`, data);
      }
    }
    async function fetchSettings() {
      // Assume shop_settings table: shop_id, business_settings, payment_settings, pos_mode
      const { data, error } = await supabase.from('shop_settings').select('*').eq('shop_id', profile.shop_id).single();
      if (!error && data) {
        setBusinessSettings(data.business_settings || {});
        setPaymentSettings(data.payment_settings || {});
        setPosMode(data.pos_mode || 'retail');
      } else {
        setBusinessSettings({});
        setPaymentSettings({});
        setPosMode('retail');
      }
    }
    fetchCustomers();
    fetchSettings();
    console.log('POS profile.shop_id:', profile?.shop_id);
    }
  }, [profile?.shop_id]);

  useEffect(() => {
    console.log('POS products:', products);
    console.log('POS products with barcodes:', products.filter(p => p.barcode).map(p => ({ name: p.name, barcode: p.barcode })));
    (window as any).products = products;
  }, [products]);
  
  const refreshCustomers = async () => {
    if (!profile?.shop_id) return;
    const { data, error } = await supabase.from('customers').select('*').eq('shop_id', profile.shop_id);
    if (!error && data) setCustomers(data);
  };

  const handleAddNewCustomer = async () => {
    if (!profile?.shop_id) return;
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...newCustomer,
          shop_id: profile.shop_id,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Customer added successfully",
      });

      setNewCustomer({});
      setNewCustomerDialog(false);
      await refreshCustomers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      });
    }
  };
  
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(cat => cat && cat.trim() !== '')))];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.barcode && product.barcode.includes(searchTerm));
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });
  
  const handleQuickAddProduct = (product: Product) => {
    console.log('[POS] handleQuickAddProduct called with product:', product);
    console.log('[POS] Current cart items before adding:', items);
    
    if (product.stock <= 0) {
      console.log('[POS] Product out of stock:', product.name);
      toast({
        title: "Out of Stock",
        description: `${product.name} is out of stock`,
        variant: "destructive",
      });
      return;
    }
    
    // Prompt for custom tax rate
    let taxRate = 0;
    const userInput = window.prompt(`Enter GST/Tax Rate (%) for ${product.name}:`, product.tax !== undefined ? product.tax.toString() : '0');
    if (userInput !== null && userInput !== '') {
      const parsed = parseFloat(userInput);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        taxRate = parsed;
      }
    } else if (product.tax !== undefined) {
      taxRate = product.tax;
    }
    
    console.log('[POS] Setting tax rate to:', taxRate);
    setTaxRate(taxRate);
    
    console.log('[POS] Calling addItem with product:', product, 'quantity: 1');
    addItem(product, 1);
    
    // Note: items won't be updated immediately due to React state updates
    console.log('[POS] Cart items after calling addItem (may not be updated yet):', items);
    
    toast({
      title: "Product Added",
      description: `${product.name} has been added to cart with ${taxRate}% GST/Tax`,
      variant: "success",
    });
  };
  
  const handlePaymentConfirmed = (status: 'paid' | 'pending') => {
    if (typeof status !== 'string') {
      console.error('handlePaymentConfirmed called with non-string status:', status);
      return;
    }
    setPaymentStatus(status);
    setPaymentSuccess(true);
    if (paymentMethod === 'cash') {
      setShowReceiptDialog(true);
    } else {
      finalizeTransaction(status);
    }
  };
  
  const finalizeTransaction = async (status: 'paid' | 'pending' = 'paid') => {
    if (typeof status !== 'string') {
      console.error('finalizeTransaction called with non-string status:', status);
      return;
    }
    try {
      // Strictly sanitize items: only include primitive fields for product
      const sanitizedItems = items.map(item => {
        const safeProduct = {
          id: item.product.id,
          name: item.product.name,
          barcode: item.product.barcode,
          category: item.product.category,
          price: item.product.price,
          unitLabel: item.product.unitLabel,
          // add more primitive fields as needed
        };
        // Test serialization of product
        try {
          JSON.stringify(safeProduct);
        } catch (err) {
          console.error('Non-serializable product:', err, safeProduct, item.product);
          Object.keys(item.product).forEach(key => {
            console.log('product key:', key, 'type:', typeof item.product[key], item.product[key]);
          });
        }
        return {
          product: safeProduct,
          quantity: item.quantity,
          price: item.price,
          unitType: item.unitType,
          unitLabel: item.unitLabel,
          convertedQuantity: item.convertedQuantity,
          convertedUnitLabel: item.convertedUnitLabel,
        };
      });
      // Sanitize customer
      const sanitizedCustomer = customer
        ? {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
          }
        : null;
      // Sanitize businessSettings and paymentSettings
      function safeClone(obj: any) {
        try {
          return obj ? JSON.parse(JSON.stringify(obj)) : undefined;
        } catch {
          return undefined;
        }
      }
      const safeBusinessSettings = safeClone(businessSettings);
      const safePaymentSettings = safeClone(paymentSettings);
      const newInvoice = {
        id: Date.now().toString(),
        invoiceNumber: invoiceReference,
        items: sanitizedItems,
        customer: sanitizedCustomer,
        subtotal: subtotal,
        taxTotal: taxTotal,
        discountValue: discountValue,
        discountType: discountType,
        total: total,
        paymentMethod: paymentMethod,
        paymentStatus: status,
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        businessDetails: safeBusinessSettings,
        paymentDetails: safePaymentSettings,
        shop_id: profile?.shop_id || null
      };
      // Deep serialization check
      try {
        JSON.stringify(newInvoice);
      } catch (err) {
        console.error('Invoice is not serializable:', err, newInvoice);
        Object.keys(newInvoice).forEach(key => {
          console.log('invoice key:', key, 'type:', typeof newInvoice[key], newInvoice[key]);
        });
        toast({
          title: 'Invoice Serialization Error',
          description: 'Invoice contains non-serializable data. Please contact support.',
          variant: 'destructive',
        });
        return;
      }
      // Insert invoice into Supabase
      const { error: invoiceInsertError } = await supabase.from('invoices').insert([newInvoice]);
      if (invoiceInsertError) {
        console.error('Error inserting invoice:', invoiceInsertError, newInvoice);
        toast({
          title: 'Invoice Error',
          description: `Error: ${invoiceInsertError.message}\nData: ${JSON.stringify(newInvoice, null, 2)}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Invoice Saved',
          description: `Invoice #${newInvoice.invoiceNumber} saved with status: ${status}`,
          variant: 'success',
        });
      }
      // Insert payment into Supabase
      const newPayment = {
        order_id: newInvoice.id, // Use invoice id as order_id
        amount: total,
        method: paymentMethod,
        status: status,
        created_at: new Date().toISOString(),
        shop_id: profile?.shop_id || null,
      };
      const { error: paymentInsertError } = await supabase.from('payments').insert([newPayment]);
      if (paymentInsertError) {
        console.error('Error inserting payment:', paymentInsertError, newPayment);
        toast({
          title: 'Payment Error',
          description: `Error: ${paymentInsertError.message}\nData: ${JSON.stringify(newPayment, null, 2)}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Payment Saved',
          description: `Payment for Invoice #${newInvoice.invoiceNumber} saved with status: ${status}`,
          variant: 'success',
        });
      }
      // Update customer's totalPurchases and loyaltyPoints in Supabase
      if (customer && customer.id) {
        await supabase
          .from('customers')
          .update({
            totalPurchases: (customer.totalPurchases || 0) + total,
            loyaltyPoints: (customer.loyaltyPoints || 0) + Math.floor(total / 100),
            updatedAt: new Date().toISOString(),
          })
          .eq('id', customer.id);
      }
      // Update product stock in Supabase
      for (const item of items) {
        const productId = item.product.id;
        const soldQty = item.quantity;
        const currentStock = item.product.stock;
        const newStock = Math.max(0, currentStock - soldQty);
        await supabase.from('products').update({ stock: newStock }).eq('id', productId);
      }
      await fetchProducts();
      toast({
        title: 'Payment Successful',
        description: `Transaction of ₹${total.toFixed(2)} completed via ${paymentMethod.toUpperCase()} (${status.toUpperCase()})`,
        variant: 'success',
      });
      window.dispatchEvent(new Event('transactionAdded'));
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
    setShowPaymentDialog(false);
    setShowReceiptDialog(false);
    setPaymentSuccess(false);
    clearCart();
  };
  
  const generateReference = () => {
    if (!invoiceReference) {
      const ref = `INV${Date.now().toString().slice(-8)}`;
      setInvoiceReference(ref);
      return ref;
    }
    return invoiceReference;
  };
  
  const openPaymentDialog = (method: 'cash' | 'upi' | 'card') => {
    setPaymentMethod(method);
    setShowPaymentDialog(true);
    
    generateReference();
  };
  
  const handlePrintReceipt = () => {
    setIsPrintingReceipt(true);
    
    setTimeout(() => {
      setIsPrintingReceipt(false);
      
      toast({
        title: "Receipt Printed",
        description: "Receipt has been sent to the printer",
        variant: "success",
      });
      
      finalizeTransaction();
    }, 1500);
  };
  
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      <div className={`p-4 overflow-auto ${cartType === 'excel' ? 'w-full' : 'lg:w-2/3'}`}>
        <DailySalesSummary />
        
        {/* Cart Type Toggle */}
        <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Switch
              id="cart-type"
              checked={cartType === 'excel'}
              onCheckedChange={(checked) => setCartType(checked ? 'excel' : 'pos')}
            />
            <Label htmlFor="cart-type">
              {cartType === 'pos' ? 'POS Cart' : 'Excel Cart'}
            </Label>
          </div>
          <div className="text-sm text-gray-600">
            {cartType === 'pos' ? 'Retail POS Layout' : 'Excel-style Table Layout'}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <ProductSearch 
              products={products}
              onSearch={setSearchTerm}
              searchTerm={searchTerm}
              category={category}
              onCategoryChange={setCategory}
              categories={categories}
            />
            <MobileScannerQR
              products={products}
              onProductFound={handleQuickAddProduct}
            />
          </div>
          
          <QuickProductBar
            products={products}
            onSelectProduct={handleQuickAddProduct}
          />
          
          <ProductGrid
            filteredProducts={filteredProducts}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            recentInvoices={recentInvoices}
          />
        </div>
        
        {/* Excel Cart - Shows below products when active */}
        {cartType === 'excel' && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg transition-all duration-300">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Excel Cart</h2>
              <p className="text-sm text-gray-600">Table-style cart layout</p>
            </div>
            
            {/* Excel-style Cart Layout */}
            <div className="space-y-4">
              {/* Customer Selection */}
              <div className="flex gap-2">
                <Select 
                  value={customer?.id || ''} 
                  onValueChange={(value) => {
                    if (value === 'walkin') {
                      // Handle walk-in customer - set customer to null
                      setCustomer(null);
                    } else {
                      const selectedCustomer = customers.find(c => c.id === value);
                      if (selectedCustomer) {
                        setCustomer(selectedCustomer);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walkin">Walk-in Customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setNewCustomerDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Customer
                </Button>
              </div>
              
              {/* Cart Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-4 py-2 text-left">Qty</th>
                      <th className="px-4 py-2 text-left">Price</th>
                      <th className="px-4 py-2 text-left">Total</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No items in cart
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div>
                              <div className="font-medium">{item.product.name && item.product.name !== "0" ? item.product.name : ""}</div>
                              {(item.unitType === 'weight' || item.unitType === 'volume') && (
                                <div className="text-xs text-gray-500">
                                  {item.unitLabel} • Price per {item.unitLabel}: ₹{item.price.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1">
                              <ExcelCartQuantityInput
                                value={item.convertedQuantity || item.quantity}
                                unitType={item.unitType}
                                convertedUnitLabel={item.convertedUnitLabel}
                                index={index}
                                updateQuantity={updateQuantity}
                                updateQuantityWithUnit={updateQuantityWithUnit}
                                toast={toast}
                              />
                              {/* Unit selector for weight/volume products */}
                              {(item.unitType === 'weight' || item.unitType === 'volume') ? (
                                <UnitSelector
                                  value={item.convertedUnitLabel || item.unitLabel || 'kg'}
                                  onChange={(newUnit) => {
                                    // Get the current quantity being displayed
                                    const currentDisplayQty = item.convertedQuantity || item.quantity;
                                    const currentUnit = item.convertedUnitLabel || item.unitLabel || 'kg';
                                    const originalUnit = item.originalUnitLabel || item.unitLabel || 'kg';
                                    
                                    console.log('Unit selector change:', {
                                      currentDisplayQty,
                                      currentUnit,
                                      newUnit,
                                      originalUnit,
                                      convertedQty: convertUnit(currentDisplayQty, currentUnit, newUnit)
                                    });
                                    
                                    // Convert current display quantity to new unit
                                    const convertedQty = convertUnit(currentDisplayQty, currentUnit, newUnit);
                                    
                                    updateQuantityWithUnit(index, convertedQty, newUnit);
                                  }}
                                  unitType={item.unitType}
                                  className="w-12"
                                />
                              ) : (
                                <span className="text-xs text-gray-500">{item.unitLabel || 'pcs'}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const newPrice = parseFloat(e.target.value) || 0;
                                  updatePrice(index, newPrice);
                                }}
                                className="w-24 border-0 p-0 bg-transparent"
                                min="0"
                                step="0.01"
                              />
                              <span className="text-xs text-gray-500">₹/{item.unitLabel || 'pcs'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="font-medium">
                              ₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                            </div>
                            {(item.unitType === 'weight' || item.unitType === 'volume') && item.product.tareWeight && item.product.tareWeight > 0 && (
                              <div className="text-xs text-gray-500">
                                Net: {item.quantity - item.product.tareWeight} {item.unitLabel}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => {
                                removeItem(index);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Summary */}
              {items.length > 0 && (
                <div className="space-y-4 bg-white p-4 rounded-lg border">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span>Tax Rate (%)</span>
                      <Input 
                        type="number" 
                        className="w-20" 
                        value={taxRate}
                        onChange={(e) => {
                          const newTaxRate = parseFloat(e.target.value) || 0;
                          setTaxRate(newTaxRate);
                        }}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span>%</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>₹{taxTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button onClick={() => openPaymentDialog('cash')} className="w-full">
                      Pay with Cash
                    </Button>
                    <Button onClick={() => openPaymentDialog('upi')} variant="outline" className="w-full">
                      Pay with UPI
                    </Button>
                    <Button onClick={() => openPaymentDialog('card')} variant="outline" className="w-full">
                      Pay with Card
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* POS Cart - Only show when not in Excel mode */}
      {cartType === 'pos' && (
        <CartSection 
          customers={customers}
          openPaymentDialog={openPaymentDialog}
          refreshCustomers={refreshCustomers}
        />
      )}
      
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        paymentMethod={paymentMethod}
        total={total}
        paymentSuccess={paymentSuccess}
        onPaymentConfirmed={handlePaymentConfirmed}
        generateReference={generateReference}
      />

      {/* Payment Status Selection Dialog */}
      {/* Remove the Payment Status Selection Dialog from the JSX */}
      
      <ReceiptDialog
        open={showReceiptDialog}
        onOpenChange={setShowReceiptDialog}
        items={items}
        customer={customer}
        subtotal={subtotal}
        taxTotal={taxTotal}
        discountValue={discountValue}
        discountType={discountType}
        total={total}
        paymentMethod={paymentMethod}
        reference={invoiceReference || generateReference()}
        onPrintReceipt={handlePrintReceipt}
        onFinalize={finalizeTransaction}
        isPrintingReceipt={isPrintingReceipt}
      />

      <NewCustomerDialog
        open={newCustomerDialog}
        onOpenChange={setNewCustomerDialog}
        newCustomer={newCustomer}
        setNewCustomer={setNewCustomer}
        onAddCustomer={handleAddNewCustomer}
        refreshCustomers={refreshCustomers}
      />
    </div>
  );
};

export default POS;
