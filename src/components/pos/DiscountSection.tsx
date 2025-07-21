
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DiscountSectionProps {
  discountInput: string;
  setDiscountInput: (value: string) => void;
  discountTypeInput: 'percentage' | 'fixed';
  setDiscountTypeInput: (type: 'percentage' | 'fixed') => void;
  // handleDiscountChange: () => void; // Remove this prop
}

export const DiscountSection: React.FC<DiscountSectionProps> = ({
  discountInput,
  setDiscountInput,
  discountTypeInput,
  setDiscountTypeInput,
  // handleDiscountChange
}) => {
  return (
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
      {/* Remove Apply button */}
    </div>
  );
};
