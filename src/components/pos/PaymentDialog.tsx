import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UpiQRCode } from '@/components/pos/UpiQRCode';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Input } from '@/components/ui/input';

interface PaymentSettings {
  upiId: string;
  accountName: string;
  enableUpi: boolean;
  enableCash: boolean;
  enableCard: boolean;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: 'cash' | 'upi' | 'card';
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxRate: number;
  total?: number;
  paymentSuccess: boolean;
  onPaymentConfirmed: (status: 'paid' | 'pending') => void;
  generateReference: () => string;
}

export const PaymentDialog: React.FC<PaymentDialogProps & { upiId?: string }> = ({
  open,
  onOpenChange,
  paymentMethod = 'cash',
  subtotal = 0,
  discount = 0,
  discountType = 'percentage',
  taxRate = 0,
  total: totalProp = 0,
  paymentSuccess = false,
  onPaymentConfirmed = () => {},
  generateReference = () => 'REF' + Date.now().toString(),
  upiId // <-- new prop
}) => {
  // Debug log
  console.log('PaymentDialog received:', { discount, discountType, subtotal, taxRate });
  const [reference, setReference] = useState('');
  const { profile } = useProfile();
  
  useEffect(() => {
    if (open && !reference && typeof generateReference === 'function') {
      try {
        const ref = generateReference();
        setReference(ref || 'REF' + Date.now().toString());
      } catch (error) {
        console.error('Error generating reference:', error);
        setReference('REF' + Date.now().toString());
      }
    }
  }, [open, generateReference, reference]);
  
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setReference('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);
  
  const handlePaymentConfirmed = (status: 'paid' | 'pending') => {
      try {
        onPaymentConfirmed(status);
      } catch (error) {
        console.error('Error confirming payment:', error);
    }
  };
  
  const handleOpenChange = (newOpen: boolean) => {
      try {
        onOpenChange(newOpen);
      } catch (error) {
        console.error('Error changing dialog state:', error);
    }
  };
  
  const currentReference = reference || 'REF' + Date.now().toString();
  
  const discountAmount = discountType === 'percentage'
    ? (discount / 100) * subtotal
    : discount;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxTotal = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxTotal;
  
  // Split payment state
  const [splitCash, setSplitCash] = useState(0);
  const [splitUpi, setSplitUpi] = useState(0);
  const [splitCard, setSplitCard] = useState(0);
  const [splitError, setSplitError] = useState('');

  useEffect(() => {
    // Reset split fields when dialog opens
    if (open) {
      if (paymentMethod === 'cash') {
        setSplitCash(total);
        setSplitUpi(0);
        setSplitCard(0);
      } else if (paymentMethod === 'upi') {
        setSplitCash(0);
        setSplitUpi(total);
        setSplitCard(0);
      } else if (paymentMethod === 'card') {
        setSplitCash(0);
        setSplitUpi(0);
        setSplitCard(total);
      } else {
        setSplitCash(0);
        setSplitUpi(0);
        setSplitCard(0);
      }
      setSplitError('');
    }
  }, [open, paymentMethod, total]);

  const handleSplitConfirm = () => {
    const sum = splitCash + splitUpi + splitCard;
    if (sum < total - 0.01) {
      setSplitError('Partial payment: the remaining amount will be due.');
      onPaymentConfirmed({
        status: 'partial',
        split: {
          cash: splitCash,
          upi: splitUpi,
          card: splitCard
        },
        amount_paid: sum,
        amount_due: total - sum
      });
      return;
    }
    if (Math.abs(sum - total) > 0.01) {
      setSplitError('The sum of all payment methods must equal the total.');
      return;
    }
    setSplitError('');
    onPaymentConfirmed({
      status: 'paid',
      split: {
        cash: splitCash,
        upi: splitUpi,
        card: splitCard
      },
      amount_paid: sum,
      amount_due: 0
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[400px] p-2 sm:p-3">
        <DialogHeader>
          <DialogTitle className="text-base">
            Payment
          </DialogTitle>
        </DialogHeader>
        {/* Split Payment UI */}
        <div className="mb-2 space-y-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-xs mb-1">
              <span>Discount ({discountType === 'percentage' ? `${discount}%` : `₹${discount}`}):</span>
              <span>₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs mb-1">
            <span>Taxable Amount:</span>
            <span>₹{taxableAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span>Tax ({taxRate}%):</span>
            <span>₹{taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t pt-1 mt-1">
            <span>Total:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
        <div className="space-y-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-16">Cash</span>
            <Input type="number" min={0} value={splitCash} onChange={e => setSplitCash(Number(e.target.value))} className="flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16">UPI</span>
            <Input type="number" min={0} value={splitUpi} onChange={e => setSplitUpi(Number(e.target.value))} className="flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16">Card</span>
            <Input type="number" min={0} value={splitCard} onChange={e => setSplitCard(Number(e.target.value))} className="flex-1" />
          </div>
          {/* Show due amount if partial payment */}
          {splitCash + splitUpi + splitCard < total && (
            <div className="text-xs text-amber-600 font-semibold">
              Due: ₹{(total - splitCash - splitUpi - splitCard).toFixed(2)}
            </div>
          )}
          <div className="text-xs text-muted-foreground">Enter the amount for each payment method. The sum must equal the total or be less for partial payment.</div>
          {splitError && <div className="text-xs text-red-600">{splitError}</div>}
        </div>
        <CardFooter className="flex justify-between gap-1 p-2 pt-1 w-full min-w-0">
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSplitConfirm}>
            Confirm Payment
          </Button>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
};
