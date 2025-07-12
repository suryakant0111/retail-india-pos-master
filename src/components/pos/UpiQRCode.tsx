
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Smartphone, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { checkPaymentStatus } from '@/lib/payment-status';

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
  const [stableReference] = useState(reference); // Create a stable reference that won't change with re-renders
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);
  const [confirmationMethod, setConfirmationMethod] = useState<'manual' | 'sms' | 'notification'>('manual');
  const { profile } = useProfile();

  // Auto-check payment status every 30 seconds
  useEffect(() => {
    if (!autoCheckEnabled || paymentStatus !== 'pending') return;
    
    const interval = setInterval(async () => {
      await checkPaymentStatusHandler();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoCheckEnabled, paymentStatus, stableReference]);

  // Check payment status via webhook simulation or API
  const checkPaymentStatusHandler = async () => {
    try {
      // Use the payment status utility
      const result = await checkPaymentStatus(stableReference, amount, 'simulate');
      
      if (result.status === 'success') {
        setPaymentStatus('success');
        onPaymentConfirmed();
      } else if (result.status === 'failed') {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.log('Payment status check failed, continuing manual mode');
    }
  };

  useEffect(() => {
    // If upiId is not provided as prop, fetch from Supabase
    if (propUpiId) return;
    async function fetchPaymentSettings() {
      if (!profile?.shop_id) return;
      const { data, error } = await supabase
        .from('shop_settings')
        .select('payment_settings')
        .eq('shop_id', profile.shop_id)
        .single();
      if (data && data.payment_settings) {
        if (data.payment_settings.upiId) setUpiId(data.payment_settings.upiId);
        if (data.payment_settings.accountName) setAccountName(data.payment_settings.accountName);
      } else if (error) {
        setErrorState(true);
      }
    }
    fetchPaymentSettings();
  }, [profile?.shop_id, propUpiId]);
  
  // Safety check for UPI parameters to prevent crashes
  const safeUpiId = upiId || '7259538046@ybl';
  const safeAccountName = accountName || 'Retail POS Account';
  const safeAmount = amount || 0;
  const safeReference = stableReference || 'UNKNOWN'; // Use the stable reference
  
  // Create UPI link with error handling
  const createUpiLink = () => {
    try {
      return `upi://pay?pa=${encodeURIComponent(safeUpiId)}&pn=${encodeURIComponent(safeAccountName)}&am=${safeAmount}&cu=INR&tn=${encodeURIComponent(`Payment Ref: ${safeReference}`)}`;
    } catch (error) {
      console.error('Error creating UPI link:', error);
      return `upi://pay?pa=${safeUpiId}`;
    }
  };
  
  // Create UPI link once and memoize it to prevent continuous regeneration
  const upiLink = React.useMemo(() => createUpiLink(), [safeUpiId, safeAccountName, safeAmount, safeReference]);
  
  const handleCheckPayment = () => {
    if (checking) return; // Prevent multiple clicks
    
    setChecking(true);
    
    // Simulate payment verification with error handling
    try {
      setTimeout(() => {
        setChecking(false);
        setPaymentStatus('success');
        if (typeof onPaymentConfirmed === 'function') {
          onPaymentConfirmed();
        }
      }, 2000);
    } catch (error) {
      console.error('Error handling payment check:', error);
      setChecking(false);
    }
  };

  // Payment status indicator
  const getStatusIndicator = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Payment Confirmed</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Payment Failed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <Loader2 className="h-5 w-4 animate-spin" />
            <span className="font-medium">Waiting for Payment...</span>
          </div>
        );
    }
  };

  // Confirmation method selector
  const getConfirmationMethodSelector = () => {
    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium mb-2">Payment Confirmation Method:</div>
        <div className="flex gap-2">
          <Button
            variant={confirmationMethod === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setConfirmationMethod('manual')}
            className="flex items-center gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            Manual
          </Button>
          <Button
            variant={confirmationMethod === 'sms' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setConfirmationMethod('sms')}
            className="flex items-center gap-1"
          >
            <MessageSquare className="h-3 w-3" />
            SMS Alert
          </Button>
          <Button
            variant={confirmationMethod === 'notification' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setConfirmationMethod('notification')}
            className="flex items-center gap-1"
          >
            <Smartphone className="h-3 w-3" />
            App Notification
          </Button>
        </div>
      </div>
    );
  };

  // Confirmation instructions
  const getConfirmationInstructions = () => {
    switch (confirmationMethod) {
      case 'sms':
        return (
          <div className="text-xs text-blue-600 mt-2">
            💡 Check your phone for SMS from bank when payment received
          </div>
        );
      case 'notification':
        return (
          <div className="text-xs text-blue-600 mt-2">
            💡 Check your UPI app for payment notification
          </div>
        );
      default:
        return (
          <div className="text-xs text-blue-600 mt-2">
            💡 Click "Payment Confirmed" when you receive money
          </div>
        );
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
        {getStatusIndicator()}
        
        {getConfirmationMethodSelector()}
        
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
          {getConfirmationInstructions()}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          onClick={handleCheckPayment}
          disabled={checking || paymentStatus === 'success'}
          className="w-full"
        >
          {checking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying Payment...
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Payment Confirmed
            </>
          ) : (
            "I've Completed the Payment"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
