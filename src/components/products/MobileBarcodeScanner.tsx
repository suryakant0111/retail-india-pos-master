import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Scan, Search, X, Loader2, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { barcodeService, BarcodeProductData } from '@/services/barcode-service';
import { barcodeDetector } from '@/lib/barcode-detector';

interface MobileBarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (productData: BarcodeProductData) => void;
  onBarcodeScanned: (barcode: string) => void;
}

export const MobileBarcodeScanner: React.FC<MobileBarcodeScannerProps> = ({
  open,
  onOpenChange,
  onProductFound,
  onBarcodeScanned
}) => {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [productData, setProductData] = useState<BarcodeProductData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectionSupported, setDetectionSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Start camera stream
  const startCamera = async () => {
    try {
      setScanning(true);
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        setDetectionSupported(barcodeDetector.isBarcodeDetectionSupported());
        
        if (barcodeDetector.isBarcodeDetectionSupported()) {
          startBarcodeDetection();
        }
      }
    } catch (err: any) {
      setError('Failed to access camera: ' + err.message);
      toast({
        title: "Camera Error",
        description: "Please allow camera access to scan barcodes",
        variant: "destructive"
      });
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setScanning(false);
  };

  // Start barcode detection loop
  const startBarcodeDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && scanning) {
        try {
          const result = await barcodeDetector.detectFromVideo(videoRef.current);
          if (result.success && result.barcode) {
            stopCamera();
            await processBarcode(result.barcode);
            toast({
              title: "Barcode Detected!",
              description: `Found: ${result.barcode}`,
              variant: "default"
            });
          }
        } catch (error) {
          console.warn('Barcode detection error:', error);
        }
      }
    }, 1000);
  };

  // Handle manual barcode entry
  const handleManualBarcodeSubmit = async () => {
    if (!manualBarcode.trim()) return;
    await processBarcode(manualBarcode.trim());
  };

  // Process barcode (scan or manual entry)
  const processBarcode = async (barcode: string) => {
    setLoading(true);
    setError(null);
    setProductData(null);
    
    try {
      if (!barcodeService.validateBarcode(barcode)) {
        setError('Invalid barcode format. Please enter a valid 8-14 digit barcode.');
        return;
      }

      setScannedBarcode(barcode);
      
      const data = await barcodeService.fetchProductData(barcode);
      setProductData(data);
      
      if (data.found) {
        toast({
          title: "Product Found!",
          description: `Found: ${data.name}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Product Not Found",
          description: "No product data found for this barcode. You can add it manually.",
          variant: "default"
        });
      }
      
      onBarcodeScanned(barcode);
    } catch (err: any) {
      setError('Failed to fetch product data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle product data selection
  const handleUseProductData = () => {
    if (productData) {
      onProductFound(productData);
      onOpenChange(false);
      resetScanner();
    }
  };

  // Reset scanner state
  const resetScanner = () => {
    setScanning(false);
    setLoading(false);
    setManualBarcode('');
    setScannedBarcode('');
    setProductData(null);
    setError(null);
    setDetectionSupported(false);
    stopCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle dialog close
  const handleClose = () => {
    resetScanner();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Barcode Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Scanner */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-48 bg-black rounded-lg object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-primary rounded-lg p-2">
                      <Scan className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                  </div>
                )}
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-600">Camera not active</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-3">
                {!scanning ? (
                  <Button onClick={startCamera} className="flex-1" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="outline" className="flex-1" size="sm">
                    <X className="mr-2 h-4 w-4" />
                    Stop Camera
                  </Button>
                )}
              </div>
              
              {detectionSupported && scanning && (
                <div className="mt-2 text-center">
                  <Badge variant="secondary" className="text-xs">
                    <Scan className="mr-1 h-3 w-3" />
                    Auto-detection active
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Manual Entry</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Enter barcode..."
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleManualBarcodeSubmit()}
                      disabled={loading}
                      className="text-sm"
                    />
                    <Button 
                      onClick={handleManualBarcodeSubmit}
                      disabled={loading || !manualBarcode.trim()}
                      size="sm"
                    >
                      <Search className="mr-1 h-3 w-3" />
                      Search
                    </Button>
                  </div>
                </div>
                
                {!detectionSupported && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      <span className="text-amber-700">Use manual entry - auto-detection not supported</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-3">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Fetching product data...</span>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Product Data Display */}
          {productData && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {productData.found ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Product Found</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Product Not Found</span>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-xs">Barcode</Label>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                      {scannedBarcode}
                    </p>
                  </div>
                  
                  {productData.found && (
                    <>
                      {productData.name && (
                        <div>
                          <Label className="text-xs">Product Name</Label>
                          <p className="text-sm font-medium">{productData.name}</p>
                        </div>
                      )}
                      
                      {productData.brand && (
                        <div>
                          <Label className="text-xs">Brand</Label>
                          <p className="text-sm">{productData.brand}</p>
                        </div>
                      )}
                      
                      {productData.category && (
                        <div>
                          <Label className="text-xs">Category</Label>
                          <Badge variant="secondary" className="text-xs">{productData.category}</Badge>
                        </div>
                      )}
                    </>
                  )}
                  
                  {!productData.found && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-600">
                        No product data found for barcode: <strong>{scannedBarcode}</strong>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        You can still add this product manually.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          {productData && (
            <Button onClick={handleUseProductData} size="sm">
              Use This Data
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} size="sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 