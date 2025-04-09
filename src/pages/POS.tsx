
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProductCard } from '@/components/products/ProductCard';
import { UpiQRCode } from '@/components/pos/UpiQRCode';
import { Customer, CartItem, Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { mockProducts, mockCustomers } from '@/data/mockData';
import { X, Printer, Search, UserRound, Plus, Minus, Trash2, IndianRupee, CreditCard, Wallet } from 'lucide-react';

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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [discountInput, setDiscountInput] = useState(discountValue.toString());
  const [discountTypeInput, setDiscountTypeInput] = useState<'percentage' | 'fixed'>(discountType);
  
  // Generate unique categories from products
  const categories = ['all', ...Array.from(new Set(mockProducts.map(p => p.category)))];
  
  // Filter products based on search and category
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });
  
  // Handle discount changes
  const handleDiscountChange = () => {
    const value = parseFloat(discountInput) || 0;
    setDiscount(value, discountTypeInput);
  };
  
  // Handle product search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle customer selection
  const handleSelectCustomer = (customer: Customer | null) => {
    setCustomer(customer);
  };
  
  // Handle payment confirmation
  const handlePaymentConfirmed = () => {
    // In a real app, this would save the invoice to the database
    // For now, we'll just clear the cart and close the dialog
    clearCart();
    setShowPaymentDialog(false);
  };
  
  // Generate a unique reference ID for UPI payments
  const generateReference = () => {
    return `INV${Date.now().toString().slice(-8)}`;
  };
  
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      {/* Left side - Product Browser */}
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
          </div>
          
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
      
      {/* Right side - Cart & Checkout */}
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
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full flex items-center" size="sm">
                <UserRound className="h-4 w-4 mr-2" />
                {customer ? customer.name : 'Select Customer'}
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
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="bg-muted rounded-full p-3 mb-4">
                <ShoppingCart className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add products from the left panel
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
      
      {/* Payment Processing Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {paymentMethod === 'cash' ? 'Cash Payment' : 
               paymentMethod === 'upi' ? 'UPI Payment' : 
               'Card Payment'}
            </DialogTitle>
          </DialogHeader>
          
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
                  <Button variant="outline" onClick={handlePaymentConfirmed}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Receipt
                  </Button>
                  <Button onClick={handlePaymentConfirmed}>
                    Mark as Paid
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Cart Item Card Component
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

// ShoppingCart icon component
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
