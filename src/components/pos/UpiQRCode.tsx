
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface UpiQRCodeProps {
  amount: number;
  reference: string;
  upiId?: string;
  onPaymentConfirmed: () => void;
}

interface PaymentSettings {
  upiId: string;
  accountName: string;
  enableUpi: boolean;
  enableCash: boolean;
  enableCard: boolean;
}

export const UpiQRCode: React.FC<UpiQRCodeProps> = ({
  amount,
  reference,
  upiId: propUpiId,
  onPaymentConfirmed
}) => {
  const [checking, setChecking] = useState(false);
  const [upiId, setUpiId] = useState(propUpiId || '7259538046@ybl');
  const [accountName, setAccountName] = useState('Retail POS Account');
  
  useEffect(() => {
    // Try to load payment settings from localStorage
    try {
      const storedSettings = localStorage.getItem('paymentSettings');
      if (storedSettings) {
        const settings = JSON.parse(storedSettings) as PaymentSettings;
        if (settings.upiId) {
          setUpiId(settings.upiId);
        }
        if (settings.accountName) {
          setAccountName(settings.accountName);
        }
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  }, []);
  
  // Safety check for UPI parameters to prevent crashes
  const safeUpiId = upiId || '7259538046@ybl';
  const safeAccountName = accountName || 'Retail POS Account';
  const safeAmount = amount || 0;
  const safeReference = reference || 'UNKNOWN';
  
  // UPI deep link with amount and reference
  const upiLink = `upi://pay?pa=${safeUpiId}&pn=${encodeURIComponent(safeAccountName)}&am=${safeAmount}&cu=INR&tn=${encodeURIComponent(`Payment Ref: ${safeReference}`)}`;
  
  const handleCheckPayment = () => {
    setChecking(true);
    // Simulate payment verification
    setTimeout(() => {
      setChecking(false);
      onPaymentConfirmed();
    }, 2000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">UPI Payment</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <QRCodeSVG
            value={upiLink}
            size={200}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"L"}
            includeMargin={false}
          />
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold mb-1">
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
            }).format(safeAmount)}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Scan with any UPI app to pay
          </p>
          <div className="text-xs text-muted-foreground">
            UPI ID: {safeUpiId}
          </div>
          <div className="text-xs text-muted-foreground">
            Reference: {safeReference}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          onClick={handleCheckPayment}
          disabled={checking}
          className="w-full"
        >
          {checking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying Payment...
            </>
          ) : (
            "I've Completed the Payment"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
