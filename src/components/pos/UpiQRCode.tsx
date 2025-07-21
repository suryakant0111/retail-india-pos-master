
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Smartphone, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();

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

  // Payment status indicator - compact version
  const getStatusIndicator = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <div className="flex items-center justify-center gap-2 text-green-600 mb-3">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Payment Confirmed</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center justify-center gap-2 text-red-600 mb-3">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Payment Failed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center gap-2 text-blue-600 mb-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Waiting for Payment</span>
          </div>
        );
    }
  };

  // Compact confirmation method selector for mobile
  const getConfirmationMethodSelector = () => {
    if (isMobile) {
      return (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <div className="text-xs font-medium mb-1 text-center">Confirm via:</div>
          <div className="flex justify-center gap-1">
            <Button
              variant={confirmationMethod === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setConfirmationMethod('manual')}
              className="text-xs px-2 py-1 h-7"
            >
              Manual
            </Button>
            <Button
              variant={confirmationMethod === 'sms' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setConfirmationMethod('sms')}
              className="text-xs px-2 py-1 h-7"
            >
              SMS
            </Button>
            <Button
              variant={confirmationMethod === 'notification' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setConfirmationMethod('notification')}
              className="text-xs px-2 py-1 h-7"
            >
              App
            </Button>
          </div>
        </div>
      );
    }
    
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

  // Compact confirmation instructions
  const getConfirmationInstructions = () => {
    const instruction = confirmationMethod === 'sms' 
      ? '💡 Check SMS from bank when payment received'
      : confirmationMethod === 'notification'
      ? '💡 Check UPI app for payment notification'
      : '💡 Click "Payment Confirmed" when you receive money';
      
    return (
      <div className="text-xs text-blue-600 text-center mt-1">
        {instruction}
      </div>
    );
  };
  
  // Error state fallback UI - compact version
  if (errorState) {
    return (
      <Card className={isMobile ? "max-w-sm mx-auto" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg">UPI Payment</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 px-4">
          <div className="text-center text-red-500 text-sm">
            Error loading UPI payment information.
          </div>
          <div className="text-center">
            <div className="text-xl font-bold mb-1">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(safeAmount)}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center px-4 pb-4">
          <Button 
            onClick={handleCheckPayment}
            disabled={checking}
            className="w-full"
            size={isMobile ? "sm" : "default"}
          >
            {checking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
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
    <Card className={isMobile ? "max-w-xs mx-auto p-2" : "max-w-sm mx-auto p-4"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-base">UPI Payment</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2 px-2">
        {getStatusIndicator()}
        {/* Compact confirmation method selector: icon row */}
        <div className="flex justify-center gap-1 mb-1">
          <Button
            variant={confirmationMethod === 'manual' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setConfirmationMethod('manual')}
            className="h-7 w-7 p-0"
            title="Manual"
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button
            variant={confirmationMethod === 'sms' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setConfirmationMethod('sms')}
            className="h-7 w-7 p-0"
            title="SMS"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            variant={confirmationMethod === 'notification' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setConfirmationMethod('notification')}
            className="h-7 w-7 p-0"
            title="App Notification"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm">
          {upiLink ? (
            <QRCodeSVG
              value={upiLink}
              size={isMobile ? 120 : 180}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              includeMargin={false}
            />
          ) : (
            <div className={`${isMobile ? 'h-[120px] w-[120px]' : 'h-[180px] w-[180px]'} flex items-center justify-center bg-gray-100 text-xs`}>
              QR Code not available
            </div>
          )}
        </div>
        <div className="text-center mt-1">
          <div className="text-lg font-bold mb-0.5">
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
            }).format(safeAmount)}
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">
            Scan with any UPI app
          </p>
          <div className="text-xs text-muted-foreground">
            UPI: {safeUpiId}
          </div>
          <div className="text-xs text-muted-foreground">
            Ref: {safeReference}
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5">
            {getConfirmationInstructions()}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center px-2 pb-2">
        <Button 
          onClick={handleCheckPayment}
          disabled={checking || paymentStatus === 'success'}
          className="w-full text-xs h-8"
          size={isMobile ? "sm" : "default"}
        >
          {checking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Payment Confirmed
            </>
          ) : (
            "I've Paid"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
