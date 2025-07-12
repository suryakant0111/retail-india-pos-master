import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Scan, Wifi, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { barcodeDetector } from '@/lib/barcode-detector';
import { useSearchParams } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';

const MobileScanner = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastScanned, setLastScanned] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [detectionSupported, setDetectionSupported] = useState(false);
  const [usingPolyfill, setUsingPolyfill] = useState(false);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (sessionId) {
      connectToSession();
    }
  }, [sessionId]);

  const connectToSession = async () => {
    try {
      // Use backend URL
      let backendUrl = 'https://retail-india-pos-master.onrender.com';
      if (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) {
        backendUrl = 'http://localhost:3001';
      }
      
      const response = await fetch(`${backendUrl}/api/mobile-scanner/connect/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected: true })
      });
      
      if (response.ok) {
        setConnected(true);
        toast({
          title: "Connected!",
          description: "You're now connected to the main application",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      setError('Failed to connect to main application');
    }
  };

  const startCamera = async () => {
    try {
      console.log('[MobileScanner] Starting camera...');
      setScanning(true);
      setError(null);
      
      // Request camera with specific constraints for mobile
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          aspectRatio: { ideal: 16/9 }
        }
      };
      
      console.log('[MobileScanner] Requesting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('[MobileScanner] Camera stream obtained:', stream);
      console.log('[MobileScanner] Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('[MobileScanner] Video metadata loaded');
          console.log('[MobileScanner] Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          
          // Start barcode detection after video is ready
          startBarcodeDetection();
        };
        
        videoRef.current.onerror = (error) => {
          console.error('[MobileScanner] Video error:', error);
          setError('Video playback error');
        };
        
        // Check barcode detection support
        console.log('[MobileScanner] Checking barcode detection support...');
        const isSupported = barcodeDetector.isBarcodeDetectionSupported();
        console.log('[MobileScanner] BarcodeDetector supported:', isSupported);
        
        if (isSupported) {
          console.log('[MobileScanner] Using native BarcodeDetector');
          setDetectionSupported(true);
          setUsingPolyfill(false);
        } else {
          console.log('[MobileScanner] Using ZXing polyfill');
          setDetectionSupported(false);
          setUsingPolyfill(true);
        }
      }
    } catch (err: any) {
      console.error('[MobileScanner] Camera error:', err);
      setError('Failed to access camera: ' + err.message);
      toast({
        title: "Camera Error",
        description: "Please allow camera access to scan barcodes",
        variant: "destructive"
      });
    }
  };

  const startZXingDetection = () => {
    console.log('[MobileScanner] Starting ZXing detection...');
    
    // Clean up any existing reader
    if (zxingReaderRef.current) {
      console.log('[MobileScanner] Stopping previous ZXing reader');
      try {
        zxingReaderRef.current.decodeFromVideoDevice(undefined, undefined, () => {});
      } catch (error) {
        console.log('[MobileScanner] Error stopping previous reader:', error);
      }
    }
    
    try {
      zxingReaderRef.current = new BrowserMultiFormatReader();
      console.log('[MobileScanner] ZXing reader created');
      
      console.log('[MobileScanner] Starting ZXing video decoding...');
      zxingReaderRef.current.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current!,
        async (result, err) => {
          if (result) {
            console.log('[MobileScanner] ZXing detected barcode:', result.getText());
            await sendBarcodeToServer(result.getText());
            setLastScanned(result.getText());
            toast({
              title: "Barcode Scanned! (ZXing)",
              description: `Found: ${result.getText()}`,
              variant: "default"
            });
          }
          if (err) {
            // Only log errors that aren't "No MultiFormat Readers" (which is normal)
            if (!err.message?.includes('No MultiFormat Readers')) {
              console.error('[MobileScanner] ZXing error:', err);
              setError('ZXing error: ' + err.message);
            }
          }
        }
      );
      console.log('[MobileScanner] ZXing detection started successfully');
    } catch (error) {
      console.error('[MobileScanner] Error creating ZXing reader:', error);
      setError('Failed to initialize barcode scanner: ' + error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (zxingReaderRef.current) {
      zxingReaderRef.current.decodeFromVideoDevice(undefined, undefined, () => {});
      zxingReaderRef.current = null;
    }
    setScanning(false);
  };

  const startBarcodeDetection = () => {
    console.log('[MobileScanner] Starting barcode detection...');
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    if (detectionSupported) {
      // Use native BarcodeDetector
      console.log('[MobileScanner] Using native BarcodeDetector');
      detectionIntervalRef.current = setInterval(async () => {
        if (videoRef.current && scanning) {
          try {
            console.log('[MobileScanner] Attempting native barcode detection...');
            const result = await barcodeDetector.detectFromVideo(videoRef.current);
            console.log('[MobileScanner] Native detection result:', result);
            
            if (result.success && result.barcode) {
              console.log('[MobileScanner] Native detector found barcode:', result.barcode);
              await sendBarcodeToServer(result.barcode);
              setLastScanned(result.barcode);
              toast({
                title: "Barcode Scanned!",
                description: `Found: ${result.barcode}`,
                variant: "default"
              });
            } else if (result.error) {
              console.log('[MobileScanner] Native detection error:', result.error);
            }
          } catch (error) {
            console.error('[MobileScanner] Native barcode detection error:', error);
          }
        }
      }, 2000); // Check every 2 seconds for native detection
      console.log('[MobileScanner] Native barcode detection interval started');
    } else {
      // Use ZXing polyfill
      console.log('[MobileScanner] Using ZXing polyfill');
      startZXingDetection();
    }
  };

  const sendBarcodeToServer = async (barcode: string) => {
    if (!sessionId) return;
    
    try {
      // Use backend URL
      let backendUrl = 'https://retail-india-pos-master.onrender.com';
      if (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) {
        backendUrl = 'http://localhost:3001';
      }
      
      const response = await fetch(`${backendUrl}/api/mobile-scanner/scan/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          barcode,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send barcode data');
      }
    } catch (error) {
      console.error('Failed to send barcode:', error);
      toast({
        title: "Error",
        description: "Failed to send barcode to main application",
        variant: "destructive"
      });
    }
  };

  const handleManualBarcode = async (barcode: string) => {
    if (!barcode.trim()) return;
    
    await sendBarcodeToServer(barcode.trim());
    setLastScanned(barcode.trim());
    toast({
      title: "Barcode Sent!",
      description: `Barcode: ${barcode.trim()}`,
      variant: "default"
    });
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Invalid Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No session ID provided. Please scan the QR code from the main application.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Barcode Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {connected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700">Connected to main app</span>
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Connecting...</span>
                  </>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Session: {sessionId.substring(0, 8)}...
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Camera Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Camera Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
              
              <div className="flex gap-2">
                {!scanning ? (
                  <Button onClick={startCamera} className="flex-1">
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    Stop Camera
                  </Button>
                )}
              </div>
              
              {detectionSupported && scanning && (
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    <Scan className="mr-1 h-3 w-3" />
                    Auto-detection active
                  </Badge>
                </div>
              )}
              {!detectionSupported && usingPolyfill && scanning && (
                <div className="text-center mt-2">
                  <Badge variant="secondary" className="text-xs bg-yellow-200 text-yellow-800">
                    ZXing Polyfill Active
                  </Badge>
                  <p className="text-xs text-yellow-700 mt-1">Using fallback barcode scanner for unsupported browsers.</p>
                </div>
              )}
              {!detectionSupported && !usingPolyfill && scanning && (
                <div className="text-center mt-2">
                  <Badge variant="destructive" className="text-xs">No Barcode Scanning Available</Badge>
                  <p className="text-xs text-red-700 mt-1">Barcode scanning is not supported on this device/browser. Use manual entry below.</p>
                </div>
              )}
            </div>
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
                <input
                  type="text"
                  placeholder="Enter barcode manually..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualBarcode(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button 
                  size="sm"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    handleManualBarcode(input.value);
                    input.value = '';
                  }}
                >
                  Send
                </Button>
              </div>
              
              {/* Test Camera Button */}
              {scanning && (
                <div className="space-y-2">
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      console.log('[MobileScanner] Testing camera access...');
                      console.log('[MobileScanner] Video element:', videoRef.current);
                      console.log('[MobileScanner] Video ready state:', videoRef.current?.readyState);
                      console.log('[MobileScanner] Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                      console.log('[MobileScanner] Stream tracks:', streamRef.current?.getTracks().map(t => t.kind));
                      
                      // Test ZXing directly
                      if (zxingReaderRef.current) {
                        console.log('[MobileScanner] ZXing reader exists');
                      } else {
                        console.log('[MobileScanner] ZXing reader not created');
                      }
                      
                      // Test BarcodeDetector
                      console.log('[MobileScanner] BarcodeDetector supported:', barcodeDetector.isBarcodeDetectionSupported());
                      console.log('[MobileScanner] Detection supported:', detectionSupported);
                      console.log('[MobileScanner] Using polyfill:', usingPolyfill);
                      
                      // Test camera capture
                      if (videoRef.current && videoRef.current.videoWidth > 0) {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          canvas.width = videoRef.current.videoWidth;
                          canvas.height = videoRef.current.videoHeight;
                          ctx.drawImage(videoRef.current, 0, 0);
                          console.log('[MobileScanner] Camera capture successful, canvas size:', canvas.width, 'x', canvas.height);
                        }
                      }
                    }}
                  >
                    Test Camera
                  </Button>
                  <p className="text-xs text-gray-500">Click to check camera status in console</p>
                </div>
              )}
              
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

        {/* Last Scanned */}
        {lastScanned && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Last Scanned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Barcode Sent!</p>
                    <p className="text-xs text-green-600 font-mono">{lastScanned}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs">1</Badge>
                <span>Click "Start Camera" to begin scanning</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs">2</Badge>
                <span>Point camera at product barcodes</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs">3</Badge>
                <span>Scanned barcodes are sent to main app automatically</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs">4</Badge>
                <span>Or use manual entry for testing</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileScanner; 