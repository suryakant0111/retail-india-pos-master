
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
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';

interface CartSectionProps {
  customers: Customer[];
  openPaymentDialog: (method: 'cash' | 'upi' | 'card') => void;
  refreshCustomers: () => Promise<void>;
  products?: Product[];
}

export const CartSection: React.FC<CartSectionProps> = ({
  customers,
  openPaymentDialog,
  refreshCustomers,
  products = []
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
  
  const handleAddNewCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      return;
    }

    // Check for existing customer by phone or email
    const { data: existing, error } = await supabase
      .from('customers')
      .select('*')
      .or(`phone.eq.${newCustomer.phone},email.eq.${newCustomer.email || ''}`);
    if (existing && existing.length > 0) {
      toast({
        title: 'Customer Exists',
        description: 'A customer with this phone or email already exists.',
        variant: 'destructive',
      });
      return;
    }

    // Insert new customer
    const { data, error: insertError } = await supabase.from('customers').insert([
      {
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email || null,
        address: newCustomer.address || null,
        loyaltyPoints: 0,
        totalPurchases: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ]).select();
    if (insertError) {
      toast({
        title: 'Error',
        description: insertError.message,
        variant: 'destructive',
      });
      return;
    }
    if (data && data[0]) {
      setCustomer(data[0]);
      setNewCustomerDialog(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      toast({
        title: 'Customer Added',
        description: `${data[0].name} has been added as a new customer`,
        variant: 'success',
      });
    }
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
          refreshCustomers={refreshCustomers}
        />
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => {
              // Find the latest product info by ID
              const latestProduct = products.find(p => p.id === item.product.id) || item.product;
              return (
                <CartItemCard 
                  key={index} 
                  item={{ ...item, product: latestProduct }}
                  index={index} 
                  onRemove={() => removeItem(index)}
                  onUpdateQuantity={(qty) => updateQuantity(index, qty)}
                />
              );
            })}
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
