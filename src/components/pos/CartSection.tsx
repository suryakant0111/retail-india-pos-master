
import React, { useState, useEffect, useRef } from 'react';
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
import { SimpleMobileScanner } from './SimpleMobileScanner';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { useProfile } from '@/hooks/useProfile';

interface CartSectionProps {
  customers: Customer[];
  openPaymentDialog: (method: 'cash' | 'upi' | 'card') => void;
  refreshCustomers: () => Promise<void>;
  products?: Product[];
  posMode?: 'retail' | 'kirana';
}

export const CartSection: React.FC<CartSectionProps> = ({
  customers,
  openPaymentDialog,
  refreshCustomers,
  products = [],
  posMode = 'retail',
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
    updateQuantity,
    updatePrice,
    addItem
  } = useCart();
  const { profile } = useProfile();
  
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
  
  // Forgotten Item (manual entry) state
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState('');
  const [manualUnit, setManualUnit] = useState('kg');
  // Add manual item to cart
  const handleAddManualItem = () => {
    if (!manualName || !manualPrice || !manualQty) return;
    const qty = parseFloat(manualQty);
    const price = parseFloat(manualPrice);
    if (isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) return;
    // Determine unitType based on manualUnit
    let manualUnitType: 'weight' | 'unit' | 'volume' = 'unit';
    if (['kg', 'g'].includes(manualUnit)) manualUnitType = 'weight';
    else if (['L', 'ml'].includes(manualUnit)) manualUnitType = 'volume';
    else manualUnitType = 'unit';
    // Create a fake Product object for manual item
    const manualProduct = {
      id: 'manual-' + Date.now(),
      name: manualName,
      description: '',
      category: 'Manual',
      price,
      tax: 0,
      stock: 1000000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      unitType: manualUnitType,
      unitLabel: manualUnit,
      shop_id: profile?.shop_id,
    };
    addItem(manualProduct, qty);
    setManualName('');
    setManualPrice('');
    setManualQty('');
    // Do not reset manualUnit
  };
  
  const handleDiscountChange = () => {
    const value = parseFloat(discountInput) || 0;
    setDiscount(value, discountTypeInput);
  };
  
  const handleAddNewCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      return;
    }
    // Check for existing customer by phone or email
    console.log('Cart Add Customer: profile.shop_id', profile?.shop_id);
    const customerToAdd = {
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || null,
      address: newCustomer.address || null,
      loyaltyPoints: 0,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shop_id: profile?.shop_id || null,
    };
    console.log('Cart Add Customer: customerToAdd', customerToAdd);
    const { data: existing, error: existingError } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', profile?.shop_id);
    if (existingError) {
      toast({
        title: 'Error',
        description: 'Failed to check for duplicates: ' + existingError.message,
        variant: 'destructive',
      });
      return;
    }
    const duplicate = (existing || []).find(
      c => c.phone === newCustomer.phone || (newCustomer.email && c.email === newCustomer.email)
    );
    if (duplicate) {
      toast({
        title: 'Customer Exists',
        description: 'A customer with this phone or email already exists in this shop.',
        variant: 'destructive',
      });
      return;
    }
    // Insert new customer with shop_id
    const { data, error: insertError } = await supabase.from('customers').insert([
      customerToAdd
    ]).select();
    if (insertError) {
      console.error('Supabase insert error:', insertError);
      toast({
        title: 'Error',
        description: 'Failed to add customer: ' + insertError.message,
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
      await refreshCustomers();
    }
  };

  // Handle barcode scanner product found
  const handleBarcodeProductFound = (product: Product) => {
    if (product.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is out of stock`,
        variant: "destructive",
      });
      return;
    }
    addItem(product, 1);
    toast({
      title: "Product Added",
      description: `${product.name} has been added to cart`,
      variant: "success",
    });
  };
  
  const cartEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when cart items change
  useEffect(() => {
    if (cartEndRef.current) {
      cartEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [items.length]);

  return (
    <div className="lg:w-1/3 border-l flex flex-col h-full overflow-auto">
      <div className="p-4 border-b bg-white z-10">
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
        
        {/* Mobile Scanner */}
        <div className="mt-3">
          <SimpleMobileScanner
            products={products}
            onProductFound={handleBarcodeProductFound}
          />
        </div>
      </div>
      <div className="p-4 bg-white flex flex-col gap-2">
        {/* Forgotten Item Input as a card at the top of the cart */}
        <div className="mb-2">
          <div className="p-4 bg-muted rounded border shadow mb-2">
            <div className="font-medium mb-1">Add Forgotten Item</div>
            <div className="flex flex-wrap gap-2 mb-1 items-end">
              <input
                type="text"
                placeholder="Item name"
                className="border rounded px-2 py-1 w-32"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Price"
                className="border rounded px-2 py-1 w-20"
                value={manualPrice}
                onChange={e => setManualPrice(e.target.value)}
                min={0.01}
                step={0.01}
              />
              <input
                type="number"
                placeholder={posMode === 'kirana' ? 'Weight' : 'Qty'}
                className="border rounded px-2 py-1 w-16"
                value={manualQty}
                onChange={e => setManualQty(e.target.value)}
                min={0.01}
                step={posMode === 'kirana' ? 0.01 : 1}
              />
              <select
                className="border rounded px-2 py-1"
                value={manualUnit}
                onChange={e => setManualUnit(e.target.value)}
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
              </select>
              <Button size="sm" className="shrink-0" onClick={handleAddManualItem}>Add</Button>
            </div>
          </div>
        </div>
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            {items.map((item, index) => (
              <CartItemCard
                key={item.product?.id || item.name || index}
                item={item}
                index={index}
                onRemove={() => removeItem(index)}
                onUpdateQuantity={qty => updateQuantity(index, qty)}
                onUpdatePrice={price => updatePrice(index, price)}
                posMode={posMode}
                unitLabel={item.unitLabel || item.product?.unitLabel}
                unitType={item.unitType || item.product?.unitType}
              />
            ))}
            <div ref={cartEndRef} />
            <div className="mt-4">
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
          </>
        )}
      </div>
    </div>
  );
};
