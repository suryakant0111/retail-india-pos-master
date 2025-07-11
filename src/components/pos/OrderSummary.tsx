
import React from 'react';
import { DiscountSection } from './DiscountSection';
import { useCart } from '@/contexts/CartContext';

interface OrderSummaryProps {
  subtotal: number;
  taxTotal: number;
  total: number;
  discountInput: string;
  setDiscountInput: (value: string) => void;
  discountTypeInput: 'percentage' | 'fixed';
  setDiscountTypeInput: (type: 'percentage' | 'fixed') => void;
  handleDiscountChange: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  taxTotal,
  total,
  discountInput,
  setDiscountInput,
  discountTypeInput,
  setDiscountTypeInput,
  handleDiscountChange
}) => {
  const { taxRate, setTaxRate } = useCart();
  return (
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
      {/* Cart-level Tax Rate Input */}
      <div className="flex justify-between mb-2 items-center">
        <span className="text-muted-foreground">Tax Rate (%)</span>
        <input
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={taxRate}
          onChange={e => setTaxRate(Number(e.target.value))}
          className="w-16 text-right border rounded px-1 py-0.5"
        />
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
      
      <DiscountSection
        discountInput={discountInput}
        setDiscountInput={setDiscountInput}
        discountTypeInput={discountTypeInput}
        setDiscountTypeInput={setDiscountTypeInput}
        handleDiscountChange={handleDiscountChange}
      />
      
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
  );
};
