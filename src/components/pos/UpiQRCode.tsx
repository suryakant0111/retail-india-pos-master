
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
  amount = 0, // Default value
  reference = 'UNKNOWN', // Default value
  upiId: propUpiId,
  onPaymentConfirmed = () => {} // Default function
}) => {
  const [checking, setChecking] = useState(false);
  const [upiId, setUpiId] = useState(propUpiId || '7259538046@ybl');
  const [accountName, setAccountName] = useState('Retail POS Account');
  const [errorState, setErrorState] = useState(false);
  
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
      setErrorState(true);
    }
  }, []);
  
  // Safety check for UPI parameters to prevent crashes
  const safeUpiId = upiId || '7259538046@ybl';
  const safeAccountName = accountName || 'Retail POS Account';
  const safeAmount = amount || 0;
  const safeReference = reference || 'UNKNOWN';
  
  // Create UPI link with error handling
  const createUpiLink = () => {
    try {
      return `upi://pay?pa=${encodeURIComponent(safeUpiId)}&pn=${encodeURIComponent(safeAccountName)}&am=${safeAmount}&cu=INR&tn=${encodeURIComponent(`Payment Ref: ${safeReference}`)}`;
    } catch (error) {
      console.error('Error creating UPI link:', error);
      return `upi://pay?pa=${safeUpiId}`;
    }
  };
  
  const upiLink = createUpiLink();
  
  const handleCheckPayment = () => {
    if (checking) return; // Prevent multiple clicks
    
    setChecking(true);
    
    // Simulate payment verification with error handling
    try {
      setTimeout(() => {
        setChecking(false);
        if (typeof onPaymentConfirmed === 'function') {
          onPaymentConfirmed();
        }
      }, 2000);
    } catch (error) {
      console.error('Error handling payment check:', error);
      setChecking(false);
    }
  };
  
  // Error state fallback UI
  if (errorState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">UPI Payment</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="text-center text-red-500">
            There was an error loading UPI payment information.
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(safeAmount)}
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
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">UPI Payment</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          {upiLink ? (
            <QRCodeSVG
              value={upiLink}
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              includeMargin={false}
            />
          ) : (
            <div className="h-[200px] w-[200px] flex items-center justify-center bg-gray-100">
              QR Code not available
            </div>
          )}
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
