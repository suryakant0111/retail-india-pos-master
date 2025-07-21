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
import { usePOSData } from '@/hooks/usePOSData';
import { ExcelCart } from '@/components/pos/ExcelCart';
import { CartSidebar } from '@/components/pos/CartSidebar';
import { addOfflineSale, getOfflineSales, removeOfflineSale, OfflineSale, addOfflineCustomer, getOfflineCustomers, removeOfflineCustomer, OfflineCustomer, addOfflineProductUpdate, getOfflineProductUpdates, removeOfflineProductUpdate, OfflineProductUpdate, addOfflineBill, getOfflineBills, removeOfflineBill, OfflineBill, addOfflinePayment, getOfflinePayments, removeOfflinePayment, OfflinePayment } from '@/lib/offlineDB';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getOfflineConflicts, clearOfflineConflicts } from '@/lib/offlineDB';
import { useStockBatches } from '@/contexts/StockBatchContext';

const POS = () => {
  const pos = usePOSData();
  const { discountValue, discountType } = useCart();
  const { updateBatchId } = useCart();
  const { 
    items, 
    subtotal, 
    taxTotal, 
    total, 
    customer,
    clearCart,
    addItem,
    setTaxRate,
    removeItem,
    updateQuantity,
    updateQuantityWithUnit,
    updatePrice,
    setCustomer,
    taxRate,
    toast,
    searchTerm,
    setSearchTerm,
    category,
    setCategory,
    activeTab,
    setActiveTab,
    showPaymentDialog,
    setShowPaymentDialog,
    paymentMethod,
    setPaymentMethod,
    showReceiptDialog,
    setShowReceiptDialog,
    paymentSuccess,
    setPaymentSuccess,
    isPrintingReceipt,
    setIsPrintingReceipt,
    products,
    setProducts,
    invoiceReference,
    setInvoiceReference,
    customers,
    setCustomers,
    businessSettings,
    setBusinessSettings,
    paymentSettings,
    setPaymentSettings,
    posMode,
    setPosMode,
    profile,
    recentSalesProducts,
    setRecentSalesProducts,
    recentInvoices,
    setRecentInvoices,
    cartType,
    setCartType,
    newCustomerDialog,
    setNewCustomerDialog,
    newCustomer,
    setNewCustomer,
    paymentStatus,
    setPaymentStatus,
    fetchProducts,
    fetchRecentSales,
    fetchRecentInvoices,
    refreshCustomers,
    handleAddNewCustomer
  } = pos;
  
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
    setShowReceiptDialog(true); // Always show the receipt dialog for all payment methods
    // Optionally, you can call finalizeTransaction(status) after printing/closing the dialog
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
      // Calculate correct total for invoice
      let discountAmount = 0;
      if (discountType === 'percentage') {
        discountAmount = subtotal * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }
      const discountedSubtotal = Math.max(0, subtotal - discountAmount);
      let cgstAmount = 0;
      let sgstAmount = 0;
      if (taxRate > 0 && discountedSubtotal > 0) {
        const cgstRate = taxRate / 2;
        const sgstRate = taxRate / 2;
        cgstAmount = discountedSubtotal * (cgstRate / 100);
        sgstAmount = discountedSubtotal * (sgstRate / 100);
      }
      const totalValue = discountedSubtotal + cgstAmount + sgstAmount;
      const newInvoice = {
        id: Date.now().toString(),
        invoiceNumber: invoiceReference,
        items: sanitizedItems,
        customer: sanitizedCustomer,
        subtotal: subtotal,
        taxTotal: cgstAmount + sgstAmount,
        discountValue: discountValue,
        discountType: discountType,
        total: totalValue,
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
      const isOffline = !window.navigator.onLine;
      if (isOffline) {
        // Save to Dexie instead of Supabase
        await addOfflineSale({ id: newInvoice.id, data: newInvoice, createdAt: Date.parse(newInvoice.createdAt) });
        // Queue bill
        const billNumber = `MJ/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000000)}`;
        const businessDetails = {
          shopName: businessSettings?.name || '',
          addressLines: [businessSettings?.address || ''].filter(Boolean),
          phone: businessSettings?.phone || '',
          gstin: businessSettings?.gstNumber || '',
          state: businessSettings?.state || '',
        };
        const billItems = items.map(item => ({
          name: item.product?.name || item.name,
          quantity: item.quantity,
          unitLabel: item.unitLabel || item.product?.unitLabel || '',
          price: item.price,
          totalPrice: item.price * item.quantity,
          taxRate, // from useCart()
          taxAmount: (item.price * item.quantity) * (taxRate / 100),
        }));
        let discountedSubtotal = subtotal;
        if (discountType === 'percentage') {
          discountedSubtotal = subtotal * (1 - (discountValue / 100));
        } else {
          discountedSubtotal = subtotal - discountValue;
        }
        discountedSubtotal = Math.max(0, discountedSubtotal);
        const taxes = [];
        let cgstAmount = 0;
        let sgstAmount = 0;
        if (taxRate > 0 && discountedSubtotal > 0) {
          const cgstRate = taxRate / 2;
          const sgstRate = taxRate / 2;
          cgstAmount = discountedSubtotal * (cgstRate / 100);
          sgstAmount = discountedSubtotal * (sgstRate / 100);
          taxes.push(
            {
              name: `CGST@${cgstRate.toFixed(2)}%`,
              rate: cgstRate,
              taxable: discountedSubtotal,
              amount: cgstAmount,
            },
            {
              name: `SGST@${sgstRate.toFixed(2)}%`,
              rate: sgstRate,
              taxable: discountedSubtotal,
              amount: sgstAmount,
            }
          );
        }
        const totalValue = discountedSubtotal + cgstAmount + sgstAmount;
        const billObj = {
          bill_number: billNumber,
          shop_id: profile?.shop_id,
          items: billItems,
          customer: customer ? {
            name: customer.name,
            phone: customer.phone,
            gstin: customer.gstin || 'Unregistered',
          } : { name: 'Walk-in Customer', phone: '-', gstin: 'Unregistered' },
          subtotal: subtotal,
          discount: discountValue,
          taxable_amount: discountedSubtotal,
          taxes: taxes,
          total: totalValue,
          payment_method: paymentMethod,
          cash_received: totalValue,
          change: 0,
          created_by: profile?.id,
          cashier: profile?.name || '',
          business_details: businessDetails,
          payment_details: safePaymentSettings,
          createdAt: newInvoice.createdAt,
        };
        await addOfflineBill({ id: billNumber, data: billObj, createdAt: Date.parse(newInvoice.createdAt) });
        // Queue payment
        const newPayment = {
          order_id: newInvoice.id,
          amount: totalValue,
          method: paymentMethod,
          status: status,
          created_at: newInvoice.createdAt,
          shop_id: profile?.shop_id || null,
        };
        await addOfflinePayment({ id: `${newInvoice.id}-payment`, data: newPayment, createdAt: Date.parse(newInvoice.createdAt) });
        // Queue product stock updates
        for (const item of items) {
          const productId = item.product.id;
          const soldQty = item.quantity;
          const currentStock = item.product.stock;
          const newStock = Math.max(0, currentStock - soldQty);
          await addOfflineProductUpdate({
            id: `${productId}-${Date.now()}`,
            data: { id: productId, update: { stock: newStock } },
            createdAt: Date.parse(newInvoice.createdAt),
          });
        }
        toast({
          title: 'Offline Sale Saved',
          description: 'Sale, bill, payment, and inventory updates saved locally. They will sync when online.',
          variant: 'default',
        });
      } else {
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
          // --- Insert Bill into Supabase ---
          try {
            // Always fetch the latest shop details from DB before inserting the bill
            let shopDetails = null;
            if (profile?.shop_id) {
              const { data: shopData, error: shopError } = await supabase
                .from('shops')
                .select('name, address, phone, gstin, state')
                .eq('id', profile.shop_id)
                .single();
              if (shopData) {
                shopDetails = {
                  businessName: shopData.name,
                  address: shopData.address,
                  phone: shopData.phone,
                  gstNumber: shopData.gstin,
                  state: shopData.state,
                };
              }
            }
            const billNumber = `MJ/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000000)}`;
            const businessDetails = {
              shopName: shopDetails?.businessName || '',
              addressLines: [shopDetails?.address || ''].filter(Boolean),
              phone: shopDetails?.phone || '',
              gstin: shopDetails?.gstNumber || '',
              state: shopDetails?.state || '',
            };
            // Bill items use global taxRate from useCart()
            const billItems = items.map(item => ({
              name: item.product?.name || item.name,
              quantity: item.quantity,
              unitLabel: item.unitLabel || item.product?.unitLabel || '',
              price: item.price,
              totalPrice: item.price * item.quantity,
              taxRate, // from useCart()
              taxAmount: (item.price * item.quantity) * (taxRate / 100),
            }));

            // Calculate discounted subtotal
            let discountedSubtotal = subtotal;
            if (discountType === 'percentage') {
              discountedSubtotal = subtotal * (1 - (discountValue / 100));
            } else {
              discountedSubtotal = subtotal - discountValue;
            }
            discountedSubtotal = Math.max(0, discountedSubtotal);

            // Build taxes array (CGST/SGST split)
            const taxes = [];
            if (taxTotal > 0) {
              const cgstRate = taxRate / 2;
              const sgstRate = taxRate / 2;
              const cgstAmount = taxTotal / 2;
              const sgstAmount = taxTotal / 2;
              taxes.push(
                {
                  name: `CGST@${cgstRate.toFixed(2)}%`,
                  rate: cgstRate,
                  taxable: discountedSubtotal,
                  amount: cgstAmount,
                },
                {
                  name: `SGST@${sgstRate.toFixed(2)}%`,
                  rate: sgstRate,
                  taxable: discountedSubtotal,
                  amount: sgstAmount,
                }
              );
            }
            const { error: billInsertError } = await supabase.from('bills').insert([
              {
                bill_number: billNumber,
                shop_id: profile?.shop_id,
                items: billItems,
                customer: customer ? {
                  name: customer.name,
                  phone: customer.phone,
                  gstin: customer.gstin || 'Unregistered',
                } : { name: 'Walk-in Customer', phone: '-', gstin: 'Unregistered' },
                subtotal: subtotal,
                discount: discountValue,
                taxable_amount: discountedSubtotal,
                taxes: taxes,
                total: totalValue,
                payment_method: paymentMethod,
                cash_received: totalValue, // Always use correct total
                change: 0, // You can adjust this if you track change
                created_by: profile?.id,
                cashier: profile?.name || '',
                business_details: businessDetails,
                payment_details: safePaymentSettings,
              }
            ]);
            if (billInsertError) {
              console.error('Error inserting bill:', billInsertError);
              toast({
                title: 'Bill Error',
                description: `Error: ${billInsertError.message}`,
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Bill Saved',
                description: `Bill #${billNumber} saved successfully!`,
                variant: 'success',
              });
            }
          } catch (err) {
            console.error('Error saving bill:', err);
          }
          // Insert payment into Supabase
          const newPayment = {
            order_id: newInvoice.id, // Use invoice id as order_id
            amount: totalValue,
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
          // After updating product stock in Supabase, insert 'out' adjustment for each sold batch
          for (const item of items) {
            if (item.batchId) {
              await supabase.from('stock_adjustments').insert([
                {
                  product_id: item.product.id,
                  quantity: item.quantity,
                  type: 'out',
                  note: 'Sale',
                  user_id: profile?.id,
                  shop_id: profile?.shop_id,
                  batch_id: Number(item.batchId), // Ensure batch_id is a bigint (number)
                  created_at: new Date().toISOString(),
                }
              ]);
            }
          }
          await fetchProducts();
          toast({
            title: 'Payment Successful',
            description: `Transaction of ₹${totalValue.toFixed(2)} completed via ${paymentMethod.toUpperCase()} (${status.toUpperCase()})`,
            variant: 'success',
          });
          window.dispatchEvent(new Event('transactionAdded'));
        }
      }
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
  
  // Prepare safePaymentSettings for the hook
  function safeClone(obj: any) {
    try {
      return obj ? JSON.parse(JSON.stringify(obj)) : undefined;
    } catch {
      return undefined;
    }
  }
  const safePaymentSettings = safeClone(paymentSettings);

  // Use the offline sync hook
  const { isOffline, isSyncing, syncOfflineData } = useOfflineSync({
    toast,
    supabase,
    profile,
    businessSettings,
    safePaymentSettings,
  });

  // Manual toggle for testing (optional, can be removed if not needed)
  // const toggleOffline = () => setIsOffline((prev) => !prev);
  
  const [conflicts, setConflicts] = useState([]);
  const [showConflicts, setShowConflicts] = useState(false);

  // Function to load conflicts
  const loadConflicts = async () => {
    const data = await getOfflineConflicts();
    setConflicts(data);
    setShowConflicts(true);
  };
  // Function to clear conflicts
  const handleClearConflicts = async () => {
    await clearOfflineConflicts();
    setConflicts([]);
    setShowConflicts(false);
    toast({ title: 'Conflicts Cleared', description: 'All conflict logs have been cleared.', variant: 'success' });
  };

  const { stockBatches, setStockBatches } = useStockBatches();

  const [selectedBatchIds, setSelectedBatchIds] = useState<Record<string, string>>({});

  // Helper to update selected batch for a product
  const handleBatchSelect = (productId: string, batchId: string) => {
    setSelectedBatchIds(prev => ({ ...prev, [productId]: batchId }));
  };

  // Update handleBatchConfirm to update cart items' batchId
  // const updateBatchId = (index: number, batchId: string) => {
  //   setItems(prevItems => {
  //     const newItems = [...prevItems];
  //     newItems[index] = { ...newItems[index], batchId };
  //     return newItems;
  //   });
  // };

  return (
    <>
      {/* Offline Mode Banner */}
      {isOffline && (
        <div className="w-full bg-yellow-400 text-black text-center py-2 font-semibold z-50">
          Offline Mode: Sales will be saved locally and synced when online.
        </div>
      )}
      {isSyncing && (
        <div className="w-full bg-blue-200 text-blue-900 text-center py-2 font-semibold z-50">
          Syncing offline data...
        </div>
      )}
      {/* Manual sync button for testing (optional) */}
      {/* <div className="fixed top-16 right-4 z-50">
        <button
          onClick={syncOfflineData}
          className="bg-gray-800 text-white px-3 py-1 rounded shadow hover:bg-gray-700"
        >
          Sync Offline Data
        </button>
      </div> */}
      {/* Conflict Review Button and Modal */}
      <div className="fixed top-24 right-4 z-50">
        <Button onClick={loadConflicts} variant="outline">
          Review Conflicts
        </Button>
      </div>
      {showConflicts && (
        <Dialog open={showConflicts} onOpenChange={setShowConflicts}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Offline Sync Conflicts</DialogTitle>
              <DialogDescription>
                These are product stock conflicts detected during offline sync. Please review and resolve as needed.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {conflicts.length === 0 ? (
                <div className="text-center text-gray-500">No conflicts found.</div>
              ) : (
                <table className="w-full text-xs border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">Product ID</th>
                      <th className="p-2 border">Expected</th>
                      <th className="p-2 border">Actual</th>
                      <th className="p-2 border">Update</th>
                      <th className="p-2 border">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conflicts.map((c) => (
                      <tr key={c.id} className="border-b">
                        <td className="p-2 border">{c.data?.productId}</td>
                        <td className="p-2 border">{c.data?.expected}</td>
                        <td className="p-2 border">{c.data?.actual}</td>
                        <td className="p-2 border">{JSON.stringify(c.data?.update)}</td>
                        <td className="p-2 border">{new Date(c.data?.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <DialogFooter>
              <Button variant="destructive" onClick={handleClearConflicts}>Clear All</Button>
              <Button variant="outline" onClick={() => setShowConflicts(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200 w-full">
        <div className="flex items-center px-4 py-3">
          <div className="flex items-center">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2954e0] text-white font-bold mr-2 text-lg">Z:</span>
            <span className="text-[#2954e0] font-semibold text-xl px-4 py-2 bg-white rounded-xl">zapretail</span>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-full min-h-screen relative">
        <div className="p-2 sm:p-4 overflow-auto flex-1 min-w-0">
          {/* Mobile: ProductSearch, QuickProductBar, CartTypeToggle, ProductGrid, DailySalesSummary (in this order) */}
          <div className="block lg:hidden">
            <QuickProductBar
              products={products}
              onSelectProduct={handleQuickAddProduct}
            />
            <div className="mb-2 flex items-center justify-between bg-gray-50 p-2 rounded-lg">
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
              <div className="text-xs text-gray-600">
                {cartType === 'pos' ? 'Retail POS Layout' : 'Excel-style Table Layout'}
              </div>
            </div>
            <ProductGrid
              filteredProducts={filteredProducts}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              recentInvoices={recentInvoices}
            />
            <div className="mt-2">
              <ProductSearch 
                products={products}
                onSearch={setSearchTerm}
                searchTerm={searchTerm}
                category={category}
                onCategoryChange={setCategory}
                categories={categories}
              />
            </div>
          </div>
          {/* Desktop: original order and spacing */}
          <div className="hidden lg:block">
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
            <div className="mb-4 flex items-center gap-2">
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
              usePOSCard={true}
            />
          </div>
          {/* Excel Cart - Shows below products when active (unchanged) */}
          {cartType === 'excel' && (
            <ExcelCart
              items={items}
              customers={customers}
              customer={customer}
              setCustomer={setCustomer}
              newCustomerDialog={newCustomerDialog}
              setNewCustomerDialog={setNewCustomerDialog}
              newCustomer={newCustomer}
              setNewCustomer={setNewCustomer}
              handleAddNewCustomer={handleAddNewCustomer}
              refreshCustomers={refreshCustomers}
              updateQuantity={updateQuantity}
              updateQuantityWithUnit={updateQuantityWithUnit}
              updatePrice={updatePrice}
              removeItem={removeItem}
              toast={toast}
              cartType={cartType}
              subtotal={subtotal}
              taxRate={taxRate}
              setTaxRate={setTaxRate}
              taxTotal={taxTotal}
              discountValue={discountValue}
              discountType={discountType}
              total={total}
              openPaymentDialog={openPaymentDialog}
              products={products}
              addItem={addItem}
            />
          )}
        </div>
        
        {/* CartSection: always visible on desktop, slide-over on mobile */}
        {cartType === 'pos' && (
          <CartSidebar
                customers={customers}
                openPaymentDialog={openPaymentDialog}
                refreshCustomers={refreshCustomers}
            items={items}
          />
        )}
        
        <PaymentDialog
          key={`${discountValue}-${discountType}-${showPaymentDialog}`}
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          paymentMethod={paymentMethod}
          subtotal={subtotal}
          discount={discountValue}
          discountType={discountType}
          taxRate={taxRate}
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
          taxRate={taxRate}
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

    </>
  );
};

export default POS;
