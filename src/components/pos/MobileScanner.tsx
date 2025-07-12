import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Smartphone, Wifi } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';

interface MobileScannerProps {
  products: Product[];
  onProductFound: (product: Product) => void;
}

export const MobileScanner: React.FC<MobileScannerProps> = ({
  products,
  onProductFound
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  // Generate unique session ID
  useEffect(() => {
    if (isDialogOpen) {
      const newSessionId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      
      // Create QR code URL for mobile scanner
      const baseUrl = window.location.origin;
      const mobileUrl = `${baseUrl}/mobile-scanner?session=${newSessionId}`;
      setQrCodeUrl(mobileUrl);
      
      // Start listening for scanned barcodes
      startListening(newSessionId);
    }
  }, [isDialogOpen]);

  // Start listening for scanned barcodes from mobile
  const startListening = (session: string) => {
    setIsListening(true);
    
    // Poll for new barcode scans every 2 seconds
    const interval = setInterval(async () => {
      try {
        // Check if there's a new barcode scan for this session
        const response = await fetch(`/api/scanner-status?session=${session}`);
        const data = await response.json();
        
        if (data.barcode) {
          // Process the scanned barcode
          const product = products.find(p => 
            p.barcode && p.barcode.toString() === data.barcode
          );
          
          if (product) {
            onProductFound(product);
            toast({
              title: "Product Scanned",
              description: `${product.name} added to cart`,
              variant: "success",
            });
          } else {
            toast({
              title: "Product Not Found",
              description: `No product found with barcode: ${data.barcode}`,
              variant: "destructive",
            });
          }
          
          // Clear the scanned barcode
          await fetch(`/api/clear-scan?session=${session}`);
        }
      } catch (error) {
        console.error('Error checking scanner status:', error);
      }
    }, 2000);

    // Cleanup interval when dialog closes
    return () => {
      clearInterval(interval);
      setIsListening(false);
    };
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setIsListening(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Smartphone className="h-4 w-4" />
          Mobile Scanner
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mobile Barcode Scanner</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Instructions */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Use Your Mobile Phone</span>
            </div>
            <p className="text-sm text-blue-700">
              Scan the QR code below with your mobile phone to open the barcode scanner.
            </p>
          </div>

          {/* QR Code */}
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border inline-block">
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                {/* QR Code would be generated here */}
                <div className="text-center">
                  <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">QR Code</p>
                  <p className="text-xs text-gray-400 mt-1">{qrCodeUrl}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Session Status */}
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {isListening ? 'Listening for scans...' : 'Scanner ready'}
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Session ID: {sessionId}
            </p>
          </div>

          {/* Manual Entry Fallback */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Manual Entry (Fallback)</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter barcode manually"
                className="flex-1 px-3 py-2 border rounded text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const barcode = (e.target as HTMLInputElement).value;
                    const product = products.find(p => 
                      p.barcode && p.barcode.toString() === barcode
                    );
                    if (product) {
                      onProductFound(product);
                      (e.target as HTMLInputElement).value = '';
                      toast({
                        title: "Product Found",
                        description: `${product.name} added to cart`,
                        variant: "success",
                      });
                    } else {
                      toast({
                        title: "Product Not Found",
                        description: `No product found with barcode: ${barcode}`,
                        variant: "destructive",
                      });
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>How to use:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open camera app on your mobile phone</li>
              <li>Point camera at the QR code above</li>
              <li>Tap the notification to open scanner</li>
              <li>Scan product barcodes</li>
              <li>Products will appear in cart automatically</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 