
import React, { createContext, useState, useContext, useEffect } from 'react';
import { CartItem, Product, ProductVariant, Customer } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface CartContextType {
  items: CartItem[];
  customer: Customer | null;
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  taxRate: number;
  setTaxRate: (rate: number) => void;
  addItem: (product: Product, quantity: number, variant?: ProductVariant) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (value: number, type: 'percentage' | 'fixed') => void;
  subtotal: number;
  taxTotal: number;
  total: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  customer: null,
  discountValue: 0,
  discountType: 'percentage',
  taxRate: 18,
  setTaxRate: () => {},
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  setCustomer: () => {},
  setDiscount: () => {},
  subtotal: 0,
  taxTotal: 0,
  total: 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomerState] = useState<Customer | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [taxRate, setTaxRate] = useState(18);
  const { toast } = useToast();
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discountedSubtotal = subtotal;
  if (discountType === 'percentage') {
    discountedSubtotal = subtotal * (1 - (discountValue / 100));
  } else {
    discountedSubtotal = subtotal - discountValue;
  }
  discountedSubtotal = Math.max(0, discountedSubtotal);
  const taxTotal = discountedSubtotal * (taxRate / 100);
  let finalTotal = discountedSubtotal + taxTotal;
  finalTotal = Math.max(0, finalTotal);
  
  const addItem = (product: Product, quantity: number, variant?: ProductVariant) => {
    const price = variant ? variant.price : product.price;
    // No per-product tax
    // Check if this product/variant is already in cart
    const existingItemIndex = items.findIndex(item => {
      if (variant) {
        return item.product.id === product.id && item.variant?.id === variant.id;
      }
      return item.product.id === product.id && !item.variant;
    });
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...items];
      const existingItem = updatedItems[existingItemIndex];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + quantity,
        totalPrice: (existingItem.price * (existingItem.quantity + quantity))
      };
      setItems(updatedItems);
    } else {
      // Add new item
      setItems([...items, {
        product,
        variant,
        quantity,
        price,
        totalPrice: (price * quantity)
      }]);
    }
    
    toast({
      title: "Item added",
      description: `${quantity} x ${product.name}${variant ? ` (${variant.name})` : ''} added to cart`,
    });
  };
  
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const updateQuantity = (index: number, quantity: number) => {
    console.log('updateQuantity called with:', index, quantity);
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    
    const updatedItems = [...items];
    const item = updatedItems[index];
    const newTaxAmount = item.price * (taxRate / 100) * quantity;
    
    updatedItems[index] = {
      ...item,
      quantity,
      taxAmount: newTaxAmount,
      totalPrice: (item.price * quantity) + newTaxAmount
    };
    
    setItems(updatedItems);
    console.log('Cart items after update:', updatedItems);
  };
  
  const clearCart = () => {
    setItems([]);
    setCustomerState(null);
    setDiscountValue(0);
    setDiscountType('percentage');
  };
  
  const setCustomer = (customer: Customer | null) => {
    setCustomerState(customer);
    if (customer) {
      toast({
        title: "Customer selected",
        description: `${customer.name} has been added to this transaction`,
      });
    }
  };
  
  const setDiscount = (value: number, type: 'percentage' | 'fixed') => {
    setDiscountValue(value);
    setDiscountType(type);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        customer,
        discountValue,
        discountType,
        taxRate,
        setTaxRate,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setCustomer,
        setDiscount,
        subtotal,
        taxTotal,
        total: finalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
