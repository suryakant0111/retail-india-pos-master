
import React, { useState, useEffect } from 'react';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartSection } from '@/components/pos/CartSection';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { ReceiptDialog } from '@/components/pos/ReceiptDialog';
import { QuickProductBar } from '@/components/pos/QuickProductBar';
import { DailySalesSummary } from '@/components/pos/DailySalesSummary';
import { useCart } from '@/contexts/CartContext';
import { mockProducts, mockCustomers } from '@/data/mockData';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

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
  
  const { isManager } = useAuth();
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
  
  const handleQuickAddProduct = (product: Product) => {
    if (product.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is out of stock`,
        variant: "destructive",
      });
      return;
    }
    
    addItem({
      product,
      quantity: 1,
      price: product.price
    });
    
    toast({
      title: "Product Added",
      description: `${product.name} has been added to cart`,
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
  
  const updateInventory = () => {
    try {
      // Get current products
      const allStoredProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const mockProductIds = mockProducts.map(p => p.id);
      
      // Update quantities for sold items
      const updatedProducts = allStoredProducts.map((product: Product) => {
        const soldItem = items.find(item => item.product.id === product.id);
        if (soldItem) {
          return {
            ...product,
            stock: Math.max(0, product.stock - soldItem.quantity)
          };
        }
        return product;
      });
      
      // Also update quantities for mock products that were sold
      const updatedMockProducts = mockProducts.map(product => {
        const soldItem = items.find(item => item.product.id === product.id);
        if (soldItem) {
          return {
            ...product,
            stock: Math.max(0, product.stock - soldItem.quantity)
          };
        }
        return product;
      });
      
      // Save updated products back to localStorage
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // Update products state with updated quantities
      setProducts([...updatedMockProducts, ...updatedProducts]);
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };
  
  const updateCustomerPurchases = () => {
    if (!customer) return;
    
    try {
      // Get current customers
      const storedCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // Find and update the customer
      const updatedCustomers = storedCustomers.map((c: any) => {
        if (c.id === customer.id) {
          return {
            ...c,
            totalPurchases: (c.totalPurchases || 0) + total,
            loyaltyPoints: (c.loyaltyPoints || 0) + Math.floor(total / 100), // 1 point per 100 spent
            updatedAt: new Date()
          };
        }
        return c;
      });
      
      // If customer not found in storage (might be a mock customer), add them
      if (!storedCustomers.some((c: any) => c.id === customer.id)) {
        updatedCustomers.push({
          ...customer,
          totalPurchases: total,
          loyaltyPoints: Math.floor(total / 100),
          updatedAt: new Date()
        });
      }
      
      // Save updated customers back to localStorage
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    } catch (error) {
      console.error('Error updating customer purchases:', error);
    }
  };
  
  const finalizeTransaction = () => {
    // Get business settings for receipt/invoice
    const businessSettings = JSON.parse(localStorage.getItem('businessSettings') || '{}');
    const paymentSettings = JSON.parse(localStorage.getItem('paymentSettings') || '{}');
    
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
        businessDetails: businessSettings,
        paymentDetails: paymentSettings
      };
      
      // Get existing invoices or initialize empty array
      const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const updatedInvoices = [...storedInvoices, newInvoice];
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      
      // Save transaction record
      const newTransaction = {
        id: Date.now().toString(),
        invoiceId: newInvoice.id,
        invoiceNumber: invoiceReference,
        amount: total,
        paymentMethod: paymentMethod,
        customer: customer ? customer.name : 'Walk-in Customer',
        createdAt: new Date(),
      };
      
      const storedTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      localStorage.setItem('transactions', JSON.stringify([...storedTransactions, newTransaction]));
      
      // Update inventory
      updateInventory();
      
      // Update customer purchase history
      updateCustomerPurchases();
      
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
    // Only generate a new reference if one doesn't exist
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
    
    // Generate reference if not already generated
    generateReference();
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
        {isManager && <DailySalesSummary />}
        
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
