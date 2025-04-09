
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, Share } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface UpiQRCodeProps {
  amount: number;
  reference: string;
  upiId?: string;
  onPaymentConfirmed: () => void;
}

export const UpiQRCode: React.FC<UpiQRCodeProps> = ({
  amount,
  reference,
  upiId = '7259538046@ybl',
  onPaymentConfirmed,
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const formattedAmount = amount.toFixed(2);
  
  // Generate UPI payment URL
  // Format: upi://pay?pa=UPI_ID&pn=MERCHANT_NAME&am=AMOUNT&tr=REFERENCE&cu=INR
  const upiUrl = `upi://pay?pa=${upiId}&pn=RetailPOS&am=${formattedAmount}&tr=${reference}&cu=INR`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUrl);
    setCopied(true);
    toast({
      title: "Link copied",
      description: "Payment link copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 3000);
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Payment',
          text: `Payment of ₹${formattedAmount} for reference: ${reference}`,
          url: upiUrl,
        });
        toast({
          title: "Shared successfully",
          description: "Payment link shared",
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardHeader className="bg-pos-blue text-white">
        <CardTitle className="text-xl">Scan to Pay</CardTitle>
        <CardDescription className="text-white/80">
          Amount: ₹{formattedAmount}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-6 pb-4">
        <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
          <QRCodeSVG 
            value={upiUrl} 
            size={200} 
            bgColor="#FFFFFF"
            fgColor="#000000"
            level="H"
            includeMargin={false}
          />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Reference: {reference}</p>
          <p className="text-sm text-muted-foreground">UPI ID: {upiId}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
        <Button onClick={onPaymentConfirmed}>Confirm Payment</Button>
      </CardFooter>
    </Card>
  );
};
