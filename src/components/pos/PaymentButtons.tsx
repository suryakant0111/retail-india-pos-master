
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
  // Create safer handler functions that check for onPaymentMethodSelect
  const handleCashPayment = () => {
    if (typeof onPaymentMethodSelect === 'function') {
      onPaymentMethodSelect('cash');
    }
  };
  
  const handleUpiPayment = () => {
    if (typeof onPaymentMethodSelect === 'function') {
      onPaymentMethodSelect('upi');
    }
  };
  
  const handleCardPayment = () => {
    if (typeof onPaymentMethodSelect === 'function') {
      onPaymentMethodSelect('card');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button 
        disabled={disabled} 
        onClick={handleCashPayment}
        className="w-full"
      >
        <Wallet className="mr-2 h-4 w-4" /> Pay with Cash
      </Button>
      
      <Button 
        disabled={disabled} 
        onClick={handleUpiPayment}
        variant="outline"
        className="w-full"
      >
        <IndianRupee className="mr-2 h-4 w-4" /> Pay with UPI
      </Button>
      
      <Button 
        disabled={disabled} 
        onClick={handleCardPayment}
        variant="outline"
        className="w-full"
      >
        <CreditCard className="mr-2 h-4 w-4" /> Pay with Card
      </Button>
    </div>
  );
};
