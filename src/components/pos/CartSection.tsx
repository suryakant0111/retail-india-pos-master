
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem, Customer } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { CartItemCard } from './CartItemCard';
import { EmptyCart } from './EmptyCart';
import { CustomerSelection } from './CustomerSelection';
import { NewCustomerDialog } from './NewCustomerDialog';
import { OrderSummary } from './OrderSummary';
import { PaymentButtons } from './PaymentButtons';

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
  
  const handleAddNewCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
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
        
        <CustomerSelection
          customer={customer}
          customers={customers}
          setCustomer={setCustomer}
          onNewCustomerClick={() => setNewCustomerDialog(true)}
        />
        
        <NewCustomerDialog
          open={newCustomerDialog}
          onOpenChange={setNewCustomerDialog}
          newCustomer={newCustomer}
          setNewCustomer={setNewCustomer}
          onAddCustomer={handleAddNewCustomer}
        />
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
        <OrderSummary
          subtotal={subtotal}
          taxTotal={taxTotal}
          total={total}
          discountInput={discountInput}
          setDiscountInput={setDiscountInput}
          discountTypeInput={discountTypeInput}
          setDiscountTypeInput={setDiscountTypeInput}
          handleDiscountChange={handleDiscountChange}
        />
        
        <PaymentButtons
          disabled={items.length === 0}
          onPaymentMethodSelect={openPaymentDialog}
        />
      </div>
    </div>
  );
};
