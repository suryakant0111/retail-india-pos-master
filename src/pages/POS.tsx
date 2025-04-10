
import React, { useState, useEffect } from 'react';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartSection } from '@/components/pos/CartSection';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { ReceiptDialog } from '@/components/pos/ReceiptDialog';
import { useCart } from '@/contexts/CartContext';
import { mockProducts, mockCustomers } from '@/data/mockData';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';

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
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [invoiceReference, setInvoiceReference] = useState('');
  
  useEffect(() => {
    // Try to load products from localStorage
    try {
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts);
        if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
          setProducts([...mockProducts, ...parsedProducts]);
        }
      }
    } catch (error) {
      console.error('Error loading products from localStorage:', error);
    }
  }, []);
  
  // Get unique categories from products
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.barcode && product.barcode.includes(searchTerm));
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });
  
  const handlePaymentConfirmed = () => {
    setPaymentSuccess(true);
    
    if (paymentMethod === 'cash') {
      setShowReceiptDialog(true);
    } else {
      finalizeTransaction();
    }
  };
  
  const finalizeTransaction = () => {
    // Save invoice data to localStorage
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
        createdAt: new Date(),
      };
      
      const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      localStorage.setItem('invoices', JSON.stringify([...storedInvoices, newInvoice]));
      
      toast({
        title: "Payment Successful",
        description: `Transaction of ₹${total.toFixed(2)} completed via ${paymentMethod.toUpperCase()}`,
        variant: "success",
      });
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
    
    setShowPaymentDialog(false);
    setShowReceiptDialog(false);
    setPaymentSuccess(false);
    
    clearCart();
  };
  
  const generateReference = () => {
    const ref = `INV${Date.now().toString().slice(-8)}`;
    setInvoiceReference(ref);
    return ref;
  };
  
  const openPaymentDialog = (method: 'cash' | 'upi' | 'card') => {
    setPaymentMethod(method);
    setShowPaymentDialog(true);
    
    // Generate reference if not already generated
    if (!invoiceReference) {
      generateReference();
    }
  };
  
  const handlePrintReceipt = () => {
    // Set printing state to show printing animation/message
    setIsPrintingReceipt(true);
    
    // Simulate the printing process
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
        <div className="mb-4">
          <ProductSearch 
            products={products}
            onSearch={setSearchTerm}
            searchTerm={searchTerm}
            category={category}
            onCategoryChange={setCategory}
            categories={categories}
          />
          
          <ProductGrid
            filteredProducts={filteredProducts}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>
      
      <CartSection 
        customers={mockCustomers}
        openPaymentDialog={openPaymentDialog}
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
