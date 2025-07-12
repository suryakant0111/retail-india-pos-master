import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Scan, Search, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { barcodeService, BarcodeProductData } from '@/services/barcode-service';
import { barcodeDetector, BarcodeDetectionResult } from '@/lib/barcode-detector';

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (productData: BarcodeProductData) => void;
  onBarcodeScanned: (barcode: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
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
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Check if barcode detection is supported
        setDetectionSupported(barcodeDetector.isBarcodeDetectionSupported());
        
        // Start barcode detection if supported
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
            // Stop detection and process the barcode
            stopCamera();
            await processBarcode(result.barcode);
            toast({
              title: "Barcode Detected!",
              description: `Found: ${result.barcode} (${result.format})`,
              variant: "default"
            });
          }
        } catch (error) {
          console.warn('Barcode detection error:', error);
        }
      }
    }, 1000); // Check every second
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
      // Validate barcode format
      if (!barcodeService.validateBarcode(barcode)) {
        setError('Invalid barcode format. Please enter a valid 8-14 digit barcode.');
        return;
      }

      setScannedBarcode(barcode);
      
      // Fetch product data from online databases
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Barcode Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Camera Scanner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-primary rounded-lg p-4">
                      <Scan className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                  </div>
                )}
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Camera not active</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                {!scanning ? (
                  <Button onClick={startCamera} className="flex-1">
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    <X className="mr-2 h-4 w-4" />
                    Stop Camera
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => processBarcode(barcodeService.generateTestBarcode())}
                  disabled={loading}
                >
                  Test Scan
                </Button>
              </div>
              
              {detectionSupported && scanning && (
                <div className="mt-2 text-center">
                  <Badge variant="secondary" className="text-xs">
                    <Scan className="mr-1 h-3 w-3" />
                    Auto-detection active
                  </Badge>
                </div>
              )}
              
              {!detectionSupported && scanning && (
                <div className="mt-2 text-center">
                  <Badge variant="outline" className="text-xs">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Manual entry required
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manual Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter barcode manually..."
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualBarcodeSubmit()}
                    disabled={loading}
                  />
                  <Button 
                    onClick={handleManualBarcodeSubmit}
                    disabled={loading || !manualBarcode.trim()}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>Supported formats: EAN-8, EAN-13, UPC-A, UPC-E, Code 128, Code 39</p>
                  <p>Example: 1234567890123 (EAN-13)</p>
                </div>
                
                {!detectionSupported && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">Barcode Detection Not Supported</p>
                        <p className="text-amber-700">Your browser doesn't support automatic barcode detection. Please use manual entry.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Fetching product data...</span>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Product Data Display */}
          {productData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {productData.found ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Product Found
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      Product Not Found
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label>Barcode</Label>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                      {scannedBarcode}
                    </p>
                  </div>
                  
                  {productData.found && (
                    <>
                      {productData.name && (
                        <div>
                          <Label>Product Name</Label>
                          <p className="font-medium">{productData.name}</p>
                        </div>
                      )}
                      
                      {productData.brand && (
                        <div>
                          <Label>Brand</Label>
                          <p>{productData.brand}</p>
                        </div>
                      )}
                      
                      {productData.category && (
                        <div>
                          <Label>Category</Label>
                          <Badge variant="secondary">{productData.category}</Badge>
                        </div>
                      )}
                      
                      {productData.description && (
                        <div>
                          <Label>Description</Label>
                          <p className="text-sm text-gray-600">{productData.description}</p>
                        </div>
                      )}
                      
                      {productData.image_url && (
                        <div>
                          <Label>Product Image</Label>
                          <img 
                            src={productData.image_url} 
                            alt="Product" 
                            className="w-20 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </>
                  )}
                  
                  {!productData.found && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">
                        No product data found for barcode: <strong>{scannedBarcode}</strong>
                      </p>
                      <p className="text-sm text-gray-500">
                        You can still add this product manually with the scanned barcode.
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
            <Button onClick={handleUseProductData}>
              Use This Data
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 