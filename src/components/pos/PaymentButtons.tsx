
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, IndianRupee, CreditCard } from 'lucide-react';

interface PaymentButtonsProps {
  disabled: boolean;
  onPaymentMethodSelect: (method: 'cash' | 'upi' | 'card') => void;
}

export const PaymentButtons: React.FC<PaymentButtonsProps> = ({
  disabled,
  onPaymentMethodSelect
}) => {
  return (
    <div className="flex flex-col gap-2">
      <Button 
        disabled={disabled} 
        onClick={() => onPaymentMethodSelect('cash')}
        className="w-full"
      >
        <Wallet className="mr-2 h-4 w-4" /> Pay with Cash
      </Button>
      
      <Button 
        disabled={disabled} 
        onClick={() => onPaymentMethodSelect('upi')}
        variant="outline"
        className="w-full"
      >
        <IndianRupee className="mr-2 h-4 w-4" /> Pay with UPI
      </Button>
      
      <Button 
        disabled={disabled} 
        onClick={() => onPaymentMethodSelect('card')}
        variant="outline"
        className="w-full"
      >
        <CreditCard className="mr-2 h-4 w-4" /> Pay with Card
      </Button>
    </div>
  );
};
