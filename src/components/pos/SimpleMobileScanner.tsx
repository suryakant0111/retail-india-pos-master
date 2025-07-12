import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Smartphone, Copy, ExternalLink, Wifi } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';
import { ScannerSession } from './ScannerSession';

interface SimpleMobileScannerProps {
  products: Product[];
  onProductFound: (product: Product) => void;
}

export const SimpleMobileScanner: React.FC<SimpleMobileScannerProps> = ({
  products,
  onProductFound
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mobileUrl, setMobileUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const { toast } = useToast();

  // Generate mobile scanner URL
  useEffect(() => {
    if (isDialogOpen) {
      const session = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(session);
      
      // Use local IP address for mobile access
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://192.168.1.197:5173'  // Your local IP from ipconfig
        : window.location.origin;
      const url = `${baseUrl}/mobile-scanner?session=${session}`;
      setMobileUrl(url);
    }
  }, [isDialogOpen]);

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl);
      toast({
        title: "URL Copied",
        description: "Mobile scanner URL copied to clipboard",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  // Open URL in new tab
  const openMobileScanner = () => {
    window.open(mobileUrl, '_blank');
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
              Open this URL on your mobile phone to scan barcodes directly.
            </p>
          </div>

          {/* Mobile URL */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Mobile Scanner URL</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={mobileUrl}
                readOnly
                className="flex-1 px-3 py-2 border rounded text-sm bg-gray-50"
              />
              <Button
                onClick={copyToClipboard}
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
            <Button
              onClick={openMobileScanner}
              size="sm"
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Mobile Scanner
            </Button>
          </div>

          {/* Session Status */}
          <ScannerSession 
            sessionId={sessionId}
            products={products}
            onProductFound={onProductFound}
          />

          {/* Manual Entry */}
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
              <li>Copy the URL above</li>
              <li>Open the URL on your mobile phone</li>
              <li>Allow camera permission when prompted</li>
              <li>Point camera at product barcodes</li>
              <li>Scanned products will appear in cart</li>
            </ol>
          </div>

          {/* Alternative Methods */}
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Alternative Methods:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use manual entry for quick testing</li>
              <li>Share URL via WhatsApp/Telegram</li>
              <li>Bookmark the URL on your mobile</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 