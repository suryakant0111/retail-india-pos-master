import React, { useState, useEffect } from 'react';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartSection } from '@/components/pos/CartSection';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { ReceiptDialog } from '@/components/pos/ReceiptDialog';
import { QuickProductBar } from '@/components/pos/QuickProductBar';
import { DailySalesSummary } from '@/components/pos/DailySalesSummary';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { mockCustomers } from '@/data/mockData';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/types';
import { useProfile } from '@/hooks/useProfile';

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
    addItem
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
  const { profile } = useProfile();
  
  const fetchProducts = async () => {
    if (!profile?.shop_id) return;
    const { data, error } = await supabase.from('products').select('*').eq('shop_id', profile.shop_id);
    if (error) {
      console.error('Error fetching products:', error);
    } else if (data) {
      setProducts(data);
    }
  };

  useEffect(() => {
    fetchProducts();
    async function fetchCustomers() {
      if (!profile?.shop_id) {
        console.log('POS profile.shop_id is missing:', profile);
        return;
      }
      const { data, error } = await supabase.from('customers').select('*').eq('shop_id', profile.shop_id);
      if (error) {
        console.error('Error fetching customers:', error);
      } else if (data) {
        setCustomers(data);
        console.log(`Fetched customers for shop_id ${profile.shop_id}:`, data);
      }
    }
    fetchCustomers();
    console.log('POS profile.shop_id:', profile?.shop_id);
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
    let taxRate = 18;
    const userInput = window.prompt(`Enter GST/Tax Rate (%) for ${product.name}:`, product.tax !== undefined ? product.tax.toString() : '18');
    if (userInput !== null && userInput !== '') {
      const parsed = parseFloat(userInput);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        taxRate = parsed;
      }
    } else if (product.tax !== undefined) {
      taxRate = product.tax;
    }
    addItem(product, 1, undefined, taxRate);
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
  
  const updateCustomerPurchases = () => {
    if (!customer) return;
    
    try {
      const storedCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      const updatedCustomers = storedCustomers.map((c: any) => {
        if (c.id === customer.id) {
          return {
            ...c,
            totalPurchases: (c.totalPurchases || 0) + total,
            loyaltyPoints: (c.loyaltyPoints || 0) + Math.floor(total / 100),
            updatedAt: new Date()
          };
        }
        return c;
      });
      
      if (!storedCustomers.some((c: any) => c.id === customer.id)) {
        updatedCustomers.push({
          ...customer,
          totalPurchases: total,
          loyaltyPoints: Math.floor(total / 100),
          updatedAt: new Date()
        });
      }
      
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    } catch (error) {
      console.error('Error updating customer purchases:', error);
    }
  };
  
  const finalizeTransaction = async () => {
    const businessSettings = JSON.parse(localStorage.getItem('businessSettings') || '{}');
    const paymentSettings = JSON.parse(localStorage.getItem('paymentSettings') || '{}');
    
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
          description: invoiceInsertError.message,
          variant: 'destructive',
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

      const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const updatedInvoices = [...storedInvoices, newInvoice];
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      
      const newTransaction = {
        id: Date.now().toString(),
        invoiceId: newInvoice.id,
        invoiceNumber: invoiceReference,
        amount: total,
        paymentMethod: paymentMethod,
        customer: customer ? customer.name : 'Walk-in Customer',
        createdAt: new Date(),
        shop_id: profile?.shop_id || null, // Add shop_id to transaction
      };
      
      const storedTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      localStorage.setItem('transactions', JSON.stringify([...storedTransactions, newTransaction]));
      
      updateCustomerPurchases();

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
        title: "Payment Successful",
        description: `Transaction of ₹${total.toFixed(2)} completed via ${paymentMethod.toUpperCase()}`,
        variant: "success",
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
          <ProductSearch 
            products={products}
            onSearch={setSearchTerm}
            searchTerm={searchTerm}
            category={category}
            onCategoryChange={setCategory}
            categories={categories}
          />
          
          <QuickProductBar
            products={products}
            onSelectProduct={handleQuickAddProduct}
          />
          
          <ProductGrid
            filteredProducts={filteredProducts}
            activeTab={activeTab}
            onTabChange={setActiveTab}
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
