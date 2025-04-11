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
  paymentMethod = 'cash', // Provide default value
  total = 0, // Provide default value
  paymentSuccess = false, // Provide default value
  onPaymentConfirmed = () => {}, // Provide default function
  generateReference = () => 'REF' + Date.now().toString() // Provide default function
}) => {
  const [upiId, setUpiId] = useState('7259538046@ybl');
  const [reference, setReference] = useState('');
  
  // Generate a reference only when the dialog first opens, not on every render
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
  
  // Reset reference when dialog closes
  useEffect(() => {
    if (!open) {
      // Wait a bit to reset the reference to avoid flicker on close
      const timer = setTimeout(() => {
        setReference('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);
  
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
  
  // Safe handler for payment confirmation
  const handlePaymentConfirmed = () => {
    if (typeof onPaymentConfirmed === 'function') {
      try {
        onPaymentConfirmed();
      } catch (error) {
        console.error('Error confirming payment:', error);
      }
    }
  };
  
  // Safe handler for dialog close
  const handleOpenChange = (newOpen: boolean) => {
    if (typeof onOpenChange === 'function') {
      try {
        onOpenChange(newOpen);
      } catch (error) {
        console.error('Error changing dialog state:', error);
      }
    }
  };
  
  // Ensure we always have a stable reference for UPI component
  const currentReference = reference || 'REF' + Date.now().toString();
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            reference={currentReference} 
            upiId={upiId}
            onPaymentConfirmed={handlePaymentConfirmed} 
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
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button onClick={handlePaymentConfirmed}>
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
