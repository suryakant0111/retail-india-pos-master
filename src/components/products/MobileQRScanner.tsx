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
  const [isPollingActive, setIsPollingActive] = useState(false);
  const processedBarcodes = useRef<Set<string>>(new Set());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Generate session ID and QR code only when scanner is first opened
  useEffect(() => {
    console.log('🔍 [MobileQRScanner] Dialog open state changed:', open);
    
    if (open && !sessionId) {
      console.log('🔍 [MobileQRScanner] Opening scanner dialog for first time');
      const newSessionId = generateSessionId();
      console.log('🔍 [MobileQRScanner] Generated session ID:', newSessionId);
      setSessionId(newSessionId);
      
      // Use local IP address for mobile access, fallback to window.location.origin
      let baseUrl = window.location.origin;
      if (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) {
        baseUrl = `http://${window.location.hostname}:5173`;
      }
      const qrUrl = `${baseUrl}/mobile-scanner?session=${newSessionId}`;
      console.log('🔍 [MobileQRScanner] Generated QR URL:', qrUrl);
      setQrCodeUrl(qrUrl);
      setIsConnected(false);
      setScannedData(null);
      processedBarcodes.current = new Set();
    } else if (!open) {
      console.log('🔍 [MobileQRScanner] Closing scanner dialog (polling continues)');
    }
  }, [open, sessionId]);

  // Simple polling for scanned barcodes (copied from working POS scanner)
  useEffect(() => {
    if (!sessionId) return;

    console.log('🔍 [MobileQRScanner] Starting simple polling for session:', sessionId);
    setIsPollingActive(true);
    
    const interval = setInterval(async () => {
      try {
        // Use backend URL
        let backendUrl = 'https://retail-india-pos-master.onrender.com';
        if (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) {
          backendUrl = 'http://localhost:3001';
        }
        
        console.log('📡 [MobileQRScanner] Polling backend for session:', sessionId);
        const response = await fetch(`${backendUrl}/api/mobile-scanner/status/${sessionId}`);
        
        if (!response.ok) {
          console.warn('📡 [MobileQRScanner] Polling failed:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('📡 [MobileQRScanner] Polling response:', data);
        
        // Check if mobile device connected
        if (data.connected && !isConnected) {
          console.log('📡 [MobileQRScanner] Mobile device connected!');
          setIsConnected(true);
          toast({
            title: "Mobile Device Connected!",
            description: "Your mobile device is now connected for barcode scanning.",
            variant: "default"
          });
        }
        
        // Check if there's new scanned data
        if (data.scannedData && data.scannedData.barcode) {
          const barcode = data.scannedData.barcode;
          
          console.log('📡 [MobileQRScanner] New scan detected:', barcode);
          
          // Prevent duplicate processing
          if (processedBarcodes.current.has(barcode)) {
            console.log('📡 [MobileQRScanner] Barcode already processed:', barcode);
            return;
          }
          
          console.log('📡 [MobileQRScanner] Processing new barcode:', barcode);
          setScannedData(data.scannedData);
          setLoading(true);
          processedBarcodes.current.add(barcode);
          
          try {
            console.log('📡 [MobileQRScanner] Fetching product data for barcode:', barcode);
            const productResponse = await fetch(`${backendUrl}/api/products/barcode/${barcode}`);
            const productData = await productResponse.json();
            console.log('📡 [MobileQRScanner] Product data response:', productData);
            
            if (productData.found) {
              console.log('📡 [MobileQRScanner] Product matched:', productData);
              onProductFound(productData);
              toast({
                title: "Product Found!",
                description: `Found: ${productData.name} - Form will be auto-filled`,
                variant: "default"
              });
            } else {
              console.warn('📡 [MobileQRScanner] No product found with barcode:', barcode);
              onBarcodeScanned(barcode);
              toast({
                title: "Barcode Scanned",
                description: `Barcode: ${barcode} - Couldn't find product details, you can add manually`,
                variant: "default"
              });
            }
            
            console.log('📡 [MobileQRScanner] Clearing scanned data from backend');
            await fetch(`${backendUrl}/api/mobile-scanner/clear/${sessionId}`, { method: 'POST' });
            setScannedData(null);
          } catch (error) {
            console.error('📡 [MobileQRScanner] Error processing scanned data:', error);
            toast({
              title: "Error Processing Data",
              description: "Failed to process scanned barcode data.",
              variant: "destructive"
            });
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('📡 [MobileQRScanner] Polling error:', error);
      }
    }, 1000); // Check every second (same as POS)

    return () => {
      clearInterval(interval);
      setIsPollingActive(false);
      console.log('📡 [MobileQRScanner] Polling stopped for session:', sessionId);
    };
  }, [sessionId, isConnected, onProductFound, onBarcodeScanned, toast, processedBarcodes]);

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
    console.log('🔍 [MobileQRScanner] Manual stop requested');
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPollingActive(false);
    setIsPolling(false);
    setIsConnected(false);
    setScannedData(null);
    setSessionId(''); // Reset session to allow new session creation
    processedBarcodes.current.clear();
    toast({
      title: "Polling Stopped",
      description: "Mobile scanning session ended",
      variant: "default"
    });
  };

  console.log('🔍 [MobileQRScanner] Rendering component - open:', open, 'sessionId:', sessionId, 'isPolling:', isPolling, 'isPollingActive:', isPollingActive);
  console.log('🔍 [MobileQRScanner] Stop button should show when isPollingActive is true. Current value:', isPollingActive);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5" />
            Mobile Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Display */}
          <div className="text-center space-y-3">
            <p className="text-sm font-medium">Scan QR Code with Mobile</p>
            {qrCodeUrl ? (
              <div className="bg-white p-3 rounded-lg border">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeUrl)}&margin=2&format=png`}
                  alt="QR Code"
                  className="mx-auto"
                />
              </div>
            ) : (
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-xs text-gray-600">Generating QR code...</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyQRCodeUrl}
              >
                <Copy className="mr-1 h-3 w-3" />
                Copy URL
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshSession}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">Connected</span>
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Waiting for mobile...</span>
                </>
              )}
            </div>
            
            {isPolling && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs text-muted-foreground">Polling for scans...</span>
              </div>
            )}
            
            {scannedData && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <p className="text-blue-800 font-medium">Barcode Scanned!</p>
                <p className="text-blue-600">Barcode: {scannedData.barcode}</p>
              </div>
            )}
            
            {/* Stop Polling Button */}
            {isPollingActive && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={stopPolling}
                className="w-full"
              >
                Stop Scanner
              </Button>
            )}
          </div>

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

          {/* Manual Barcode Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manual Entry (Testing)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Test with sample barcodes or enter a barcode manually:
                </p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter barcode manually..."
                      className="flex-1 px-3 py-2 border rounded text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const barcode = (e.target as HTMLInputElement).value;
                          if (barcode.trim()) {
                            // Call the parent's manual entry handler
                            onBarcodeScanned(barcode.trim());
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const barcode = input.value.trim();
                        if (barcode) {
                          onBarcodeScanned(barcode);
                          input.value = '';
                        }
                      }}
                    >
                      Test
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Sample barcodes for testing:</p>
                    <div className="space-y-1">
                      <div>• Coca-Cola: 049000006344</div>
                      <div>• Lay's Chips: 028400090000</div>
                      <div>• Diet Coke: 049000006351</div>
                      <div>• Sprite: 049000006368</div>
                      <div>• Indian Products: Try any 12-13 digit barcode</div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      💡 The system will search multiple databases including Open Food Facts, UPC Item DB, and Indian product databases.
                    </p>
                  </div>
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