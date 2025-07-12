import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { QrCode, Smartphone, Wifi, CheckCircle, Loader2, Copy, RefreshCw } from 'lucide-react';
import { BarcodeProductData } from '@/services/barcode-service';

interface MobileQRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (productData: BarcodeProductData) => void;
  onBarcodeScanned: (barcode: string) => void;
  isPolling: boolean;
  setIsPolling: (val: boolean) => void;
  stopPollingRef: React.MutableRefObject<(() => void) | undefined>;
}

export const MobileQRScanner: React.FC<MobileQRScannerProps> = ({
  open,
  onOpenChange,
  onProductFound,
  onBarcodeScanned,
  isPolling,
  setIsPolling,
  stopPollingRef
}) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const processedBarcodes = useRef<Set<string>>(new Set());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Generate session ID and QR code
  useEffect(() => {
    if (open) {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      const qrUrl = `${window.location.origin}/mobile-scanner?session=${newSessionId}`;
      setQrCodeUrl(qrUrl);
      setIsConnected(false);
      setScannedData(null);
      processedBarcodes.current = new Set();
    }
  }, [open]);

  // Polling logic using useRef (like cart)
  useEffect(() => {
    if (open && sessionId && !isPolling) {
      setIsPolling(true);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`/api/mobile-scanner/status/${sessionId}`);
          const data = await response.json();

          if (data.connected && !isConnected) {
            setIsConnected(true);
            toast({
              title: "Mobile Device Connected!",
              description: "Your mobile device is now connected for barcode scanning.",
              variant: "default"
            });
          }

          if (data.scannedData) {
            const barcode = data.scannedData.barcode;
            if (!processedBarcodes.current.has(barcode)) {
              setScannedData(data.scannedData);
              setLoading(true);
              processedBarcodes.current.add(barcode);
              try {
                const productResponse = await fetch(`/api/products/barcode/${barcode}`);
                const productData = await productResponse.json();
                if (productData.found) {
                  onProductFound(productData);
                  toast({
                    title: "Product Found!",
                    description: `Found: ${productData.name}`,
                    variant: "default"
                  });
                } else {
                  onBarcodeScanned(barcode);
                  toast({
                    title: "Barcode Scanned",
                    description: `Barcode: ${barcode} - No product data found`,
                    variant: "default"
                  });
                }
                await fetch(`/api/mobile-scanner/clear/${sessionId}`, { method: 'POST' });
                setScannedData(null);
              } catch (error) {
                console.error('Error processing scanned data:', error);
                toast({
                  title: "Error Processing Data",
                  description: "Failed to process scanned barcode data.",
                  variant: "destructive"
                });
              } finally {
                setLoading(false);
              }
            }
          }
        } catch (error) {
          console.warn('Polling error:', error);
        }
      }, 2000);
    }
    // Expose stopPolling to parent
    stopPollingRef.current = stopPolling;
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      // Do not setIsPolling(false) here; only stopPolling does that
    };
  }, [open, sessionId, isConnected, onProductFound, onBarcodeScanned, toast, isPolling, setIsPolling, stopPollingRef]);

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const copyQRCodeUrl = () => {
    navigator.clipboard.writeText(qrCodeUrl);
    toast({
      title: "URL Copied!",
      description: "QR code URL copied to clipboard",
      variant: "default"
    });
  };

  const refreshSession = () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    const qrUrl = `${window.location.origin}/mobile-scanner?session=${newSessionId}`;
    setQrCodeUrl(qrUrl);
    setIsConnected(false);
    setScannedData(null);
    processedBarcodes.current = new Set();
    toast({
      title: "Session Refreshed",
      description: "New QR code generated",
      variant: "default"
    });
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
    setIsConnected(false);
    setScannedData(null);
    toast({
      title: "Polling Stopped",
      description: "Mobile scanning session ended",
      variant: "default"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile QR Scanner
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Scan the QR code with your mobile device to connect for barcode scanning.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scan QR Code with Mobile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}&margin=2&format=png`}
                    alt="QR Code"
                    className="mx-auto"
                    onError={(e) => {
                      console.error('QR code generation failed, using fallback');
                      e.currentTarget.style.display = 'none';
                      const fallbackDiv = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallbackDiv) {
                        fallbackDiv.style.display = 'block';
                      }
                    }}
                  />
                  <div className="hidden text-center p-4 bg-gray-100 rounded">
                    <p className="text-sm font-mono break-all">{qrCodeUrl}</p>
                    <p className="text-xs text-gray-600 mt-2">Copy this URL to your mobile device</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code with your mobile device to connect for barcode scanning
                  </p>
                  
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyQRCodeUrl}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy URL
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={refreshSession}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700">Mobile Device Connected</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Waiting for mobile device...</span>
                    </>
                  )}
                </div>
                
                {isPolling && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Polling for scanned data...</span>
                  </div>
                )}
                
                {scannedData && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Barcode Scanned!</p>
                        <p className="text-xs text-blue-600">Processing product data...</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Stop Polling Button */}
                {isPolling && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={stopPolling}
                    className="w-full"
                  >
                    Stop Polling
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-xs">1</Badge>
                  <span>Open your mobile device camera or QR scanner app</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-xs">2</Badge>
                  <span>Scan the QR code above</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-xs">3</Badge>
                  <span>Allow camera access on your mobile device</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-xs">4</Badge>
                  <span>Point camera at product barcodes to scan</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-xs">5</Badge>
                  <span>Scanned products will appear here automatically</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 