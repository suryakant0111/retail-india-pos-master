
import React from 'react';
import { DiscountSection } from './DiscountSection';

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
