import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UpiQRCode } from '@/components/pos/UpiQRCode';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

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

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
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
  generateReference = () => 'REF' + Date.now().toString()
}) => {
  // Debug log
  console.log('PaymentDialog received:', { discount, discountType, subtotal, taxRate });
  const [upiId, setUpiId] = useState('7259538046@ybl');
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
  
  useEffect(() => {
    async function fetchPaymentSettings() {
      if (!profile?.shop_id) return;
      const { data, error } = await supabase
        .from('shop_settings')
        .select('payment_settings')
        .eq('shop_id', profile.shop_id)
        .single();
      if (data?.payment_settings?.upiId) {
        setUpiId(data.payment_settings.upiId);
      }
    }
    fetchPaymentSettings();
  }, [profile?.shop_id]);
  
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
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[400px] p-2 sm:p-3">
        <DialogHeader>
          <DialogTitle className="text-base">
            {paymentMethod === 'cash' ? 'Cash Payment' : paymentMethod === 'upi' ? 'UPI Payment' : 'Card Payment'}
          </DialogTitle>
        </DialogHeader>

        {paymentSuccess && (
          <Alert variant="success" className="mb-2 text-xs p-2">
            <AlertTitle className="text-sm">Payment Successful</AlertTitle>
            <AlertDescription className="text-xs">
              Transaction completed successfully.
            </AlertDescription>
          </Alert>
        )}

        {paymentMethod === 'upi' ? (
          <UpiQRCode 
            amount={total} 
            reference={currentReference} 
            upiId={upiId}
            onPaymentConfirmed={() => handlePaymentConfirmed('paid')} 
          />
        ) : (
          <Card className="bg-white shadow-none border-none p-0 w-full flex flex-col">
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-base">
                {paymentMethod === 'cash' ? 'Cash Payment' : 'Card Payment'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="mb-2">
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
              <div className="text-center text-muted-foreground mb-2 text-xs">
                {paymentMethod === 'cash' ? 
                  'Collect cash from customer' : 
                  'Process card payment via machine'}
              </div>
            </CardContent>

            <CardFooter className="flex justify-between gap-1 p-2 pt-1 w-full min-w-0">
              <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => handlePaymentConfirmed('paid')}>
                Mark as Paid
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                onClick={() => handlePaymentConfirmed('pending')}
              >
                Mark as Pending
              </Button>
            </CardFooter>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};
