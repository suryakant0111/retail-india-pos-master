import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Smartphone, Copy, ExternalLink, QrCode, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';
import QRCode from 'qrcode';

interface MobileScannerQRProps {
  products: Product[];
  onProductFound: (product: Product) => void;
}

export const MobileScannerQR: React.FC<MobileScannerQRProps> = ({
  products,
  onProductFound
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mobileUrl, setMobileUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [processedBarcodes, setProcessedBarcodes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Generate mobile scanner URL and start session
  const startScannerSession = () => {
    const session = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(session);
    setIsScannerActive(true);
    setProcessedBarcodes(new Set()); // Reset processed barcodes for new session
    
    // Use local IP address for mobile access
    const baseUrl = window.location.hostname === 'localhost' 
      ? 'http://192.168.1.197:5173'  // Your local IP from ipconfig
      : window.location.origin;
    const url = `${baseUrl}/mobile-scanner?session=${session}`;
    setMobileUrl(url);
    
    // Generate QR code
    generateQRCode(url);
    
    toast({
      title: "Scanner Started",
      description: "Mobile scanner is now active and polling for scans",
      variant: "success",
    });
  };

  // Generate QR code for the URL
  const generateQRCode = async (url: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "QR Code Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

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

  // Stop scanner
  const stopScanner = () => {
    setIsScannerActive(false);
    setSessionId('');
    setQrCodeDataUrl('');
    toast({
      title: "Scanner Stopped",
      description: "Mobile scanner has been stopped",
      variant: "default",
    });
  };

  // Start polling for scanned barcodes
  useEffect(() => {
    if (!sessionId || !isScannerActive) return;

    console.log('[MobileScannerQR] Polling started for session:', sessionId);
    const interval = setInterval(async () => {
      try {
        // Use local backend for localhost testing
        const backendUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:3001' 
          : 'https://retail-india-pos-master.onrender.com';
        const response = await fetch(`${backendUrl}/scanner-session/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          const scans = data.scans || [];
          if (scans.length > 0) {
            const latestScan = scans[scans.length - 1];
            const barcode = latestScan.barcode;
            
            // Check if this barcode has already been processed
            if (processedBarcodes.has(barcode)) {
              console.log('[MobileScannerQR] Barcode already processed:', barcode);
              return;
            }
            
            console.log('[MobileScannerQR] New barcode received from backend:', barcode);
            
            // Find product by barcode
            const product = products.find(p => {
              const match = p.barcode && p.barcode.toString() === barcode;
              if (match) {
                console.log('[MobileScannerQR] Product matched:', p);
              }
              return match;
            });
            
            if (product) {
              // Add barcode to processed set
              setProcessedBarcodes(prev => new Set([...prev, barcode]));
              
              onProductFound(product);
              toast({
                title: "Product Scanned",
                description: `${product.name} added to cart`,
                variant: "success",
              });
            } else {
              console.warn('[MobileScannerQR] No product found with barcode:', barcode);
              toast({
                title: "Product Not Found",
                description: `No product found with barcode: ${barcode}`,
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        console.error('[MobileScannerQR] Error polling scanner session:', error);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      console.log('[MobileScannerQR] Polling stopped for session:', sessionId);
    };
  }, [sessionId, isScannerActive, products, onProductFound, toast, processedBarcodes]);

  return (
    <div className="flex items-center gap-2">
      {/* Stop Button - Visible when scanner is active */}
      {isScannerActive && (
        <Button
          onClick={stopScanner}
          size="sm"
          variant="destructive"
          className="flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Stop Scanner
        </Button>
      )}

      {/* Main Scanner Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant={isScannerActive ? "default" : "outline"}
            size="sm"
            className={`flex items-center gap-2 ${isScannerActive ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            <QrCode className="h-4 w-4" />
            {isScannerActive ? 'Scanner Active' : 'Mobile Scanner'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Barcode Scanner
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Scanner Status */}
            {isScannerActive && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-green-800">
                      Scanner Active
                    </span>
                  </div>
                  <Button
                    onClick={stopScanner}
                    size="sm"
                    variant="destructive"
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Stop
                  </Button>
                </div>
                <div className="text-xs text-green-600">
                  Session: {sessionId.substring(0, 8)}...
                </div>
              </div>
            )}

            {/* Start Scanner Button */}
            {!isScannerActive && (
              <Button
                onClick={startScannerSession}
                size="lg"
                className="w-full flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Start Mobile Scanner
              </Button>
            )}

            {/* QR Code Display */}
            {isScannerActive && qrCodeDataUrl && (
              <div className="text-center space-y-3">
                <span className="text-sm font-medium">Scan QR Code with Your Phone</span>
                <div className="flex justify-center">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Mobile Scanner QR Code" 
                    className="border rounded-lg shadow-sm"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Open your phone's camera app and point it at this QR code
                </p>
              </div>
            )}

            {/* URL Section */}
            {isScannerActive && mobileUrl && (
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
            )}

            {/* Instructions */}
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>How to use:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Start Mobile Scanner"</li>
                <li>Scan the QR code with your phone camera</li>
                <li>Allow camera permission when prompted</li>
                <li>Point camera at product barcodes</li>
                <li>Scanned products will appear in cart</li>
              </ol>
            </div>

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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 