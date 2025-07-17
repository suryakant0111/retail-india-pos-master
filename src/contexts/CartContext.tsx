
import React, { createContext, useState, useContext, useEffect } from 'react';
import { CartItem, Product, ProductVariant, Customer } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { convertUnit, getAvailableUnits } from '@/lib/utils';

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
  updateQuantityWithUnit: (index: number, quantity: number, unitLabel: string) => void;
  updatePrice: (index: number, price: number) => void;
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
  taxRate: 0,
  setTaxRate: () => {},
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  updateQuantityWithUnit: () => {},
  updatePrice: () => {},
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
  const [taxRate, setTaxRate] = useState(0);
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
    console.log('[CartContext] addItem called with:', { product, quantity, variant });
    console.log('[CartContext] Current items before adding:', items);
    
    // Calculate price based on product type
    let price = variant ? variant.price : product.price;
    
    // For weight/volume products, use price per unit if available
    if ((product.unitType === 'weight' || product.unitType === 'volume') && product.pricePerUnit) {
      price = product.pricePerUnit;
      console.log('[CartContext] Using price per unit:', price, 'for', product.unitLabel);
    }
    
    console.log('[CartContext] Calculated price:', price);
    
    // Check if this product/variant is already in cart
    const existingItemIndex = items.findIndex(item => {
      if (variant) {
        return item.product.id === product.id && item.variant?.id === variant.id;
      }
      // For manual items, never merge (unique id)
      if (product.id.startsWith('manual-')) return false;
      return item.product.id === product.id && !item.variant;
    });

    // Calculate current quantity in cart
    let currentCartQty = 0;
    if (existingItemIndex >= 0) {
      currentCartQty = items[existingItemIndex].quantity;
    }
    const requestedQty = currentCartQty + quantity;
    // Determine available stock
    let availableStock = 0;
    if (product.unitType === 'weight' || product.unitType === 'volume') {
      // For bulk products, treat null/undefined/0 as infinite
      if (product.stockByWeight === null || product.stockByWeight === undefined || product.stockByWeight === 0) {
        availableStock = Infinity;
      } else {
        availableStock = product.stockByWeight;
      }
    } else {
      availableStock = product.stock;
    }
    // If availableStock is undefined/null, treat as Infinity (for manual/bulk items)
    if (availableStock === undefined || availableStock === null) availableStock = Infinity;
    // Prevent adding more than available
    if (requestedQty > availableStock) {
      toast({
        title: 'Stock Limit',
        description: `Cannot add more than available stock (${availableStock} ${product.unitLabel || 'pcs'}) for ${product.name}.`,
        variant: 'destructive',
      });
      return;
    }
    
    if (existingItemIndex >= 0) {
      // Update existing item
      console.log('[CartContext] Updating existing item at index:', existingItemIndex);
      const updatedItems = [...items];
      const existingItem = updatedItems[existingItemIndex];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + quantity,
        totalPrice: (existingItem.price * (existingItem.quantity + quantity))
      };
      setItems(updatedItems);
      console.log('[CartContext] Updated items:', updatedItems);
    } else {
      // Add new item
      console.log('[CartContext] Adding new item to cart');
      const newItem = {
        product,
        variant,
        quantity,
        price,
        totalPrice: (price * quantity),
        // Pass through unitLabel and unitType for manual/custom items
        unitLabel: product.unitLabel,
        unitType: product.unitType,
        // Initialize converted values for weight/volume products
        originalQuantity: quantity,
        originalUnitLabel: product.unitLabel,
        convertedQuantity: quantity,
        convertedUnitLabel: product.unitLabel,
      };
      console.log('[CartContext] New item to add:', newItem);
      setItems([...items, newItem]);
      console.log('[CartContext] Items after adding new item:', [...items, newItem]);
    }
    
    // Create descriptive message based on product type
    let description = `${quantity} x ${product.name}`;
    if (variant) {
      description += ` (${variant.name})`;
    }
    if (product.unitType === 'weight' || product.unitType === 'volume') {
      description += ` (${product.unitLabel})`;
    }
    
    toast({
      title: "Item added",
      description: description + " added to cart",
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
    
    // Calculate total price based on product type
    let totalPrice = item.price * quantity;
    
    // For weight/volume products, ensure proper calculation
    if (item.unitType === 'weight' || item.unitType === 'volume') {
      totalPrice = item.price * quantity;
      console.log('[CartContext] Weight/volume item total:', totalPrice, 'for', quantity, item.unitLabel);
    }
    
    const newTaxAmount = totalPrice * (taxRate / 100);
    
    updatedItems[index] = {
      ...item,
      quantity,
      taxAmount: newTaxAmount,
      totalPrice: totalPrice
    };
    
    setItems(updatedItems);
    console.log('Cart items after update:', updatedItems);
  };

  const updateQuantityWithUnit = (index: number, quantity: number, unitLabel: string) => {
    console.log('updateQuantityWithUnit called with:', index, quantity, unitLabel);
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    
    const updatedItems = [...items];
    const item = updatedItems[index];
    
    // For weight/volume products, convert units
    if (item.unitType === 'weight' || item.unitType === 'volume') {
      const originalUnitLabel = item.originalUnitLabel || item.unitLabel || 'kg';
      
      // Convert from the new unit to the original unit for price calculation
      const convertedQuantity = convertUnit(quantity, unitLabel, originalUnitLabel);
      
      // Calculate total price based on original unit
      const totalPrice = item.price * convertedQuantity;
      const newTaxAmount = totalPrice * (taxRate / 100);
      
      updatedItems[index] = {
        ...item,
        quantity: convertedQuantity, // Store in original unit for calculations
        convertedQuantity: quantity, // Store customer's preferred quantity for display
        convertedUnitLabel: unitLabel, // Store customer's preferred unit for display
        originalQuantity: item.originalQuantity || item.quantity,
        originalUnitLabel: originalUnitLabel,
        taxAmount: newTaxAmount,
        totalPrice: totalPrice
      };
      
      console.log('[CartContext] Unit conversion:', {
        customerInput: `${quantity} ${unitLabel}`,
        systemCalculation: `${convertedQuantity} ${originalUnitLabel}`,
        totalPrice: totalPrice
      });
    } else {
      // For regular products, just update quantity
      const totalPrice = item.price * quantity;
      const newTaxAmount = totalPrice * (taxRate / 100);
      
      updatedItems[index] = {
        ...item,
        quantity,
        taxAmount: newTaxAmount,
        totalPrice: totalPrice
      };
    }
    
    setItems(updatedItems);
    console.log('Cart items after unit update:', updatedItems);
  };

  const updatePrice = (index: number, price: number) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    updatedItems[index] = {
      ...item,
      price,
      totalPrice: price * item.quantity
    };
    setItems(updatedItems);
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
        updateQuantityWithUnit,
        updatePrice,
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
