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
    setTaxRate
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

  const fetchProducts = async () => {
    if (!profile?.shop_id) return;
    const { data, error } = await supabase.from('products').select('*').eq('shop_id', profile.shop_id);
    if (error) {
      console.error('Error fetching products:', error);
    } else if (data) {
      setProducts(data);
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

  const refreshCustomers = async () => {
    if (!profile?.shop_id) return;
    const { data, error } = await supabase.from('customers').select('*').eq('shop_id', profile.shop_id);
    if (!error && data) setCustomers(data);
  };
  
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.barcode && product.barcode.includes(searchTerm));
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });
  
  const handleQuickAddProduct = (product: Product) => {
    if (product.stock <= 0) {
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
    setTaxRate(taxRate);
    addItem(product, 1);
    toast({
      title: "Product Added",
      description: `${product.name} has been added to cart with ${taxRate}% GST/Tax`,
      variant: "success",
    });
  };
  
  const handlePaymentConfirmed = () => {
    setPaymentSuccess(true);
    if (paymentMethod === 'cash') {
      setShowReceiptDialog(true);
    } else {
      finalizeTransaction();
    }
  };

  const finalizeTransaction = async () => {
    try {
      const newInvoice = {
        id: Date.now().toString(),
        invoiceNumber: invoiceReference,
        items: [...items],
        customer: customer,
        subtotal: subtotal,
        taxTotal: taxTotal,
        discountValue: discountValue,
        discountType: discountType,
        total: total,
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        businessDetails: businessSettings,
        paymentDetails: paymentSettings,
        shop_id: profile?.shop_id || null // Add shop_id to invoice
      };
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
          description: `Invoice #${newInvoice.invoiceNumber} saved with status: paid`,
          variant: 'success',
        });
      }
      // Insert payment into Supabase
      const newPayment = {
        order_id: newInvoice.id, // Use invoice id as order_id
        amount: total,
        method: paymentMethod,
        status: 'paid',
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
          description: `Payment for Invoice #${newInvoice.invoiceNumber} saved with status: paid`,
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
        description: `Transaction of ₹${total.toFixed(2)} completed via ${paymentMethod.toUpperCase()} (PAID)`,
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
      <div className="lg:w-2/3 p-4 overflow-auto">
        <DailySalesSummary />
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
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
      </div>
      
      <CartSection 
        customers={customers}
        openPaymentDialog={openPaymentDialog}
        refreshCustomers={refreshCustomers}
        products={products}
      />
      
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
    </div>
  );
};

export default POS;
