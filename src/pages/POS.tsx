
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ProductCard } from '@/components/products/ProductCard';
import { UpiQRCode } from '@/components/pos/UpiQRCode';
import { Customer, CartItem, Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { mockProducts, mockCustomers } from '@/data/mockData';
import { X, Printer, Search, UserRound, Plus, Minus, Trash2, IndianRupee, CreditCard, Wallet, Barcode, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter } from '@/components/ui/drawer';

const POS = () => {
  const { 
    items, 
    subtotal, 
    taxTotal, 
    total, 
    customer,
    setCustomer,
    addItem,
    removeItem,
    updateQuantity, 
    clearCart,
    discountValue,
    discountType,
    setDiscount
  } = useCart();
  
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [discountInput, setDiscountInput] = useState(discountValue.toString());
  const [discountTypeInput, setDiscountTypeInput] = useState<'percentage' | 'fixed'>(discountType);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [barcodeScannerMode, setBarcodeScannerMode] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (barcodeScannerMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [barcodeScannerMode]);
  
  const categories = ['all', ...Array.from(new Set(mockProducts.map(p => p.category)))];
  
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.barcode && product.barcode.includes(searchTerm));
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });
  
  const handleDiscountChange = () => {
    const value = parseFloat(discountInput) || 0;
    setDiscount(value, discountTypeInput);
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSelectCustomer = (customer: Customer | null) => {
    setCustomer(customer);
    toast({
      title: "Customer Selected",
      description: customer ? `${customer.name} added to transaction` : "Walk-in customer selected",
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
  
  const finalizeTransaction = () => {
    toast({
      title: "Payment Successful",
      description: `Transaction of ₹${total.toFixed(2)} completed via ${paymentMethod.toUpperCase()}`,
      variant: "success",
    });
    
    setShowPaymentDialog(false);
    setShowReceiptDialog(false);
    setPaymentSuccess(false);
    
    clearCart();
  };
  
  const generateReference = () => {
    return `INV${Date.now().toString().slice(-8)}`;
  };
  
  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcodeValue(e.target.value);
  };
  
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeValue) {
      e.preventDefault();
      processBarcodeInput();
    }
  };
  
  const processBarcodeInput = () => {
    if (!barcodeValue.trim()) return;
    
    const product = mockProducts.find(p => p.barcode === barcodeValue.trim());
    
    if (product) {
      addItem(product, 1);
      setBarcodeValue('');
      toast({
        title: "Product Added",
        description: `${product.name} added to cart via barcode`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode ${barcodeValue}`,
        variant: "destructive",
      });
    }
    
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };
  
  const handleAddNewCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({
        title: "Missing Information",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }
    
    const newCustomerId = `CUST${Date.now().toString().slice(-6)}`;
    
    const customerToAdd: Customer = {
      id: newCustomerId,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || undefined,
      address: newCustomer.address || undefined,
      loyaltyPoints: 0,
      totalPurchases: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setCustomer(customerToAdd);
    setNewCustomerDialog(false);
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
    });
    
    toast({
      title: "Customer Added",
      description: `${customerToAdd.name} has been added as a new customer`,
      variant: "success",
    });
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
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant={barcodeScannerMode ? "default" : "outline"} 
              size="icon" 
              onClick={() => setBarcodeScannerMode(!barcodeScannerMode)}
              title="Toggle barcode scanner"
            >
              <Barcode className="h-4 w-4" />
            </Button>
          </div>
          
          {barcodeScannerMode && (
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan barcode..."
                  className="pl-9"
                  value={barcodeValue}
                  onChange={handleBarcodeInput}
                  onKeyDown={handleBarcodeKeyDown}
                  autoFocus
                />
              </div>
              <Button onClick={processBarcodeInput} disabled={!barcodeValue.trim()}>
                Add Item
              </Button>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="products" className="flex-1">Products</TabsTrigger>
              <TabsTrigger value="recent" className="flex-1">Recent Sales</TabsTrigger>
              <TabsTrigger value="favorites" className="flex-1">Favorites</TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="recent" className="mt-4">
              <div className="text-center p-6 text-muted-foreground">
                Recent sales will appear here
              </div>
            </TabsContent>
            <TabsContent value="favorites" className="mt-4">
              <div className="text-center p-6 text-muted-foreground">
                Favorite products will appear here
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="lg:w-1/3 border-l flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Order</h2>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-grow flex items-center justify-between" size="sm">
                  <div className="flex items-center">
                    <UserRound className="h-4 w-4 mr-2" />
                    {customer ? customer.name : 'Select Customer'}
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Customer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-auto">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleSelectCustomer(null)}
                  >
                    Walk-in Customer
                  </Button>
                  {mockCustomers.map((cust) => (
                    <Card key={cust.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSelectCustomer(cust)}>
                      <CardContent className="p-4">
                        <div className="font-medium">{cust.name}</div>
                        <div className="text-sm text-muted-foreground">{cust.phone}</div>
                        {cust.email && <div className="text-sm text-muted-foreground">{cust.email}</div>}
                        {cust.loyaltyPoints !== undefined && (
                          <div className="mt-1 text-xs">Loyalty Points: {cust.loyaltyPoints}</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setNewCustomerDialog(true)}
              title="Add new customer"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          
          <Dialog open={newCustomerDialog} onOpenChange={setNewCustomerDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Fill in the customer details below.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Customer name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="Phone number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomer.email || ''}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="Email address (optional)"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium">
                    Address
                  </label>
                  <Input
                    id="address"
                    value={newCustomer.address || ''}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    placeholder="Address (optional)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewCustomerDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNewCustomer}>
                  Add Customer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="bg-muted rounded-full p-3 mb-4">
                <ShoppingCart className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add products from the left panel or use the barcode scanner
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <CartItemCard 
                  key={index} 
                  item={item} 
                  index={index} 
                  onRemove={() => removeItem(index)}
                  onUpdateQuantity={(qty) => updateQuantity(index, qty)}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span>
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                }).format(subtotal)}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Tax</span>
              <span>
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                }).format(taxTotal)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Input
                type="number"
                placeholder="Discount"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="w-20"
              />
              <Select value={discountTypeInput} onValueChange={(val: 'percentage' | 'fixed') => setDiscountTypeInput(val)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">₹ Fixed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleDiscountChange}>
                Apply
              </Button>
            </div>
            
            <div className="flex justify-between text-lg font-bold mt-4">
              <span>Total</span>
              <span>
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                }).format(total)}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              disabled={items.length === 0} 
              onClick={() => {
                setPaymentMethod('cash');
                setShowPaymentDialog(true);
              }}
              className="w-full"
            >
              <Wallet className="mr-2 h-4 w-4" /> Pay with Cash
            </Button>
            
            <Button 
              disabled={items.length === 0} 
              onClick={() => {
                setPaymentMethod('upi');
                setShowPaymentDialog(true);
              }}
              variant="outline"
              className="w-full"
            >
              <IndianRupee className="mr-2 h-4 w-4" /> Pay with UPI
            </Button>
            
            <Button 
              disabled={items.length === 0} 
              onClick={() => {
                setPaymentMethod('card');
                setShowPaymentDialog(true);
              }}
              variant="outline"
              className="w-full"
            >
              <CreditCard className="mr-2 h-4 w-4" /> Pay with Card
            </Button>
          </div>
        </div>
      </div>
      
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {paymentMethod === 'cash' ? 'Cash Payment' : 
               paymentMethod === 'upi' ? 'UPI Payment' : 
               'Card Payment'}
            </DialogTitle>
          </DialogHeader>
          
          {paymentSuccess && (
            <Alert variant="success" className="mb-4">
              <AlertTitle>Payment Successful</AlertTitle>
              <AlertDescription>
                Transaction completed successfully.
              </AlertDescription>
            </Alert>
          )}
          
          {paymentMethod === 'upi' ? (
            <UpiQRCode 
              amount={total} 
              reference={generateReference()} 
              onPaymentConfirmed={handlePaymentConfirmed} 
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {paymentMethod === 'cash' ? 'Cash Payment' : 'Card Payment'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-2xl font-bold mb-4">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                  }).format(total)}
                </div>
                <div className="text-center text-muted-foreground mb-6">
                  {paymentMethod === 'cash' ? 
                    'Collect cash from customer' : 
                    'Process card payment via machine'}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button onClick={handlePaymentConfirmed}>
                    Mark as Paid
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>
              Transaction #{generateReference()}
              <span className="block text-xs mt-1">
                {new Date().toLocaleString('en-IN')}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="border-t border-b py-4 my-4">
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg">RETAIL POS</h3>
              <p className="text-sm text-muted-foreground">123 Main Street, City</p>
              <p className="text-sm text-muted-foreground">Phone: 123-456-7890</p>
              {customer && <p className="text-sm mt-2">Customer: {customer.name}</p>}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Item</span>
                <div className="flex">
                  <span className="w-16 text-right">Qty</span>
                  <span className="w-20 text-right">Amount</span>
                </div>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <div>{item.product.name}</div>
                    {item.variant && (
                      <div className="text-xs text-muted-foreground">
                        {Object.entries(item.variant.attributes)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      ₹{item.price.toFixed(2)} x {item.quantity}
                    </div>
                  </div>
                  <div className="flex">
                    <span className="w-16 text-right">{item.quantity}</span>
                    <span className="w-20 text-right">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t mt-4 pt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>₹{taxTotal.toFixed(2)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Discount {discountType === 'percentage' ? `(${discountValue}%)` : ''}</span>
                  <span>-₹{(discountType === 'percentage' ? (subtotal + taxTotal) * (discountValue / 100) : discountValue).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 text-base">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2">
                <span>Payment Method</span>
                <span>{paymentMethod.toUpperCase()}</span>
              </div>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-xs text-muted-foreground">Thank you for your purchase!</p>
              <p className="text-xs text-muted-foreground">Visit again</p>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handlePrintReceipt}
                disabled={isPrintingReceipt}
              >
                {isPrintingReceipt ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Receipt
                  </>
                )}
              </Button>
              <Button onClick={finalizeTransaction}>
                Done
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const CartItemCard: React.FC<{
  item: CartItem;
  index: number;
  onRemove: () => void;
  onUpdateQuantity: (qty: number) => void;
}> = ({ item, index, onRemove, onUpdateQuantity }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div className="flex-1">
            <div className="font-medium">{item.product.name}</div>
            {item.variant && (
              <div className="text-sm text-muted-foreground">
                {Object.entries(item.variant.attributes)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')}
              </div>
            )}
            <div className="text-sm">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(item.price)} × {item.quantity}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(item.price * item.quantity)}
            </div>
            <div className="text-xs text-muted-foreground">
              GST: {item.product.tax}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <Button variant="outline" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onUpdateQuantity(item.quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ShoppingCart = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="8" cy="21" r="1"/>
    <circle cx="19" cy="21" r="1"/>
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
  </svg>
);

export default POS;
