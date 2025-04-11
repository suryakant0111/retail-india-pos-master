
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UpiQRCode } from '@/components/pos/UpiQRCode';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  total: number;
  paymentSuccess: boolean;
  onPaymentConfirmed: () => void;
  generateReference: () => string;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  paymentMethod,
  total,
  paymentSuccess,
  onPaymentConfirmed,
  generateReference
}) => {
  const [upiId, setUpiId] = useState('7259538046@ybl');
  
  useEffect(() => {
    // Load payment settings from localStorage
    try {
      const storedSettings = localStorage.getItem('paymentSettings');
      if (storedSettings) {
        const settings = JSON.parse(storedSettings) as PaymentSettings;
        if (settings.upiId) {
          setUpiId(settings.upiId);
        }
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  }, []);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {paymentMethod === 'cash' ? 'Cash Payment' : 
             paymentMethod === 'upi' ? 'UPI Payment' : 
             'Card Payment'}
          </DialogTitle>
        </DialogHeader>
        
        {paymentSuccess && (
          <Alert variant="success" className="mb-4">
            <AlertTitle>Payment Successful</AlertTitle>
            <AlertDescription>
              Transaction completed successfully.
            </AlertDescription>
          </Alert>
        )}
        
        {paymentMethod === 'upi' ? (
          <UpiQRCode 
            amount={total} 
            reference={generateReference()} 
            upiId={upiId}
            onPaymentConfirmed={onPaymentConfirmed} 
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {paymentMethod === 'cash' ? 'Cash Payment' : 'Card Payment'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-2xl font-bold mb-4">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                }).format(total)}
              </div>
              <div className="text-center text-muted-foreground mb-6">
                {paymentMethod === 'cash' ? 
                  'Collect cash from customer' : 
                  'Process card payment via machine'}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button onClick={onPaymentConfirmed}>
                  Mark as Paid
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};
