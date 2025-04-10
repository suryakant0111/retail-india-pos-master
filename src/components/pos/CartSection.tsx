
import React, { useState } from 'react';
import { X, UserRound, UserPlus, Wallet, IndianRupee, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CartItem, Customer } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { CartItemCard } from './CartItemCard';
import { EmptyCart } from './EmptyCart';

interface CartSectionProps {
  customers: Customer[];
  openPaymentDialog: (method: 'cash' | 'upi' | 'card') => void;
}

export const CartSection: React.FC<CartSectionProps> = ({
  customers,
  openPaymentDialog
}) => {
  const { 
    items, 
    customer,
    setCustomer,
    subtotal, 
    taxTotal, 
    total, 
    discountValue,
    discountType,
    setDiscount,
    clearCart,
    removeItem,
    updateQuantity 
  } = useCart();
  
  const { toast } = useToast();
  const [discountInput, setDiscountInput] = useState(discountValue.toString());
  const [discountTypeInput, setDiscountTypeInput] = useState<'percentage' | 'fixed'>(discountType);
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  
  const handleDiscountChange = () => {
    const value = parseFloat(discountInput) || 0;
    setDiscount(value, discountTypeInput);
  };
  
  const handleSelectCustomer = (customer: Customer | null) => {
    setCustomer(customer);
    toast({
      title: "Customer Selected",
      description: customer ? `${customer.name} added to transaction` : "Walk-in customer selected",
    });
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
  
  return (
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
                {customers.map((cust) => (
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
          <EmptyCart />
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
            <select
              value={discountTypeInput}
              onChange={(e) => setDiscountTypeInput(e.target.value as 'percentage' | 'fixed')}
              className="w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="percentage">%</option>
              <option value="fixed">₹ Fixed</option>
            </select>
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
            onClick={() => openPaymentDialog('cash')}
            className="w-full"
          >
            <Wallet className="mr-2 h-4 w-4" /> Pay with Cash
          </Button>
          
          <Button 
            disabled={items.length === 0} 
            onClick={() => openPaymentDialog('upi')}
            variant="outline"
            className="w-full"
          >
            <IndianRupee className="mr-2 h-4 w-4" /> Pay with UPI
          </Button>
          
          <Button 
            disabled={items.length === 0} 
            onClick={() => openPaymentDialog('card')}
            variant="outline"
            className="w-full"
          >
            <CreditCard className="mr-2 h-4 w-4" /> Pay with Card
          </Button>
        </div>
      </div>
    </div>
  );
};
