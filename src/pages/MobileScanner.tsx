import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Scan, Wifi, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { barcodeDetector } from '@/lib/barcode-detector';
import { useSearchParams } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';

const SCAN_COOLDOWN = 3000; // 3 seconds

const MobileScanner = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastScanned, setLastScanned] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [detectionSupported, setDetectionSupported] = useState(false);
  const [usingPolyfill, setUsingPolyfill] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(true); // Default to performance mode
  const [scanningInProgress, setScanningInProgress] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [processedBarcodes, setProcessedBarcodes] = useState<Set<string>>(new Set());
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopCamera();
      if (detectionFrameRef.current) {
        cancelAnimationFrame(detectionFrameRef.current);
      }
    };
  }, []);

  const connectToSession = async () => {
    try {
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
      setScanning(true);
      setError(null);
      // Lowered video resolution and frame rate for best performance
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 320, max: 640 },
          height: { ideal: 240, max: 480 },
          frameRate: { ideal: 10, max: 15 },
          aspectRatio: { ideal: 4/3 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.onloadedmetadata = () => {
          startBarcodeDetection();
        };
        videoRef.current.onerror = (error) => {
          setError('Video playback error');
        };
        const isSupported = barcodeDetector.isBarcodeDetectionSupported();
        setDetectionSupported(isSupported);
        setUsingPolyfill(!isSupported);
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

  const stopCamera = () => {
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionFrameRef.current) {
      cancelAnimationFrame(detectionFrameRef.current);
      detectionFrameRef.current = null;
    }
    if (zxingReaderRef.current) {
      try {
        zxingReaderRef.current.decodeFromVideoDevice(undefined, undefined, () => {});
      } catch {}
      zxingReaderRef.current = null;
    }
  };

  // Main detection loop using requestAnimationFrame
  const barcodeDetectionLoop = async () => {
    if (!videoRef.current || !scanning) return;
    if (scanningInProgress) {
      detectionFrameRef.current = requestAnimationFrame(barcodeDetectionLoop);
      return;
    }
    if (Date.now() - lastScanTime < SCAN_COOLDOWN) {
      detectionFrameRef.current = requestAnimationFrame(barcodeDetectionLoop);
      return;
    }
    setScanningInProgress(true);
    if (detectionSupported) {
      // Native BarcodeDetector
      const result = await barcodeDetector.detectFromVideo(videoRef.current);
      if (result.success && result.barcode) {
        if (!processedBarcodes.has(result.barcode)) {
          setProcessedBarcodes(prev => new Set([...prev, result.barcode!]));
          setLastScanTime(Date.now());
          setLastScanned(result.barcode);
          await sendBarcodeToServer(result.barcode);
          toast({
            title: "Barcode Scanned!",
            description: `Found: ${result.barcode}`,
            variant: "default"
          });
        }
      }
    } else {
      // ZXing fallback
      if (!zxingReaderRef.current) {
        zxingReaderRef.current = new BrowserMultiFormatReader();
      }
      try {
        const result = await zxingReaderRef.current.decodeOnceFromVideoElement(videoRef.current!);
        if (result && result.getText()) {
          if (!processedBarcodes.has(result.getText())) {
            setProcessedBarcodes(prev => new Set([...prev, result.getText()]));
            setLastScanTime(Date.now());
            setLastScanned(result.getText());
            await sendBarcodeToServer(result.getText());
            toast({
              title: "Barcode Scanned! (ZXing)",
              description: `Found: ${result.getText()}`,
              variant: "default"
            });
          }
        }
      } catch (err) {
        // Ignore errors
      }
    }
    setScanningInProgress(false);
    detectionFrameRef.current = requestAnimationFrame(barcodeDetectionLoop);
  };

  const startBarcodeDetection = () => {
    setProcessedBarcodes(new Set());
    setLastScanTime(0);
    setScanningInProgress(false);
    if (detectionFrameRef.current) {
      cancelAnimationFrame(detectionFrameRef.current);
    }
    detectionFrameRef.current = requestAnimationFrame(barcodeDetectionLoop);
  };

  const sendBarcodeToServer = async (barcode: string) => {
    if (!sessionId) return;
    
    console.log('[MobileScanner] Sending barcode to server:', barcode);
    console.log('[MobileScanner] Session ID:', sessionId);
    
    try {
      let backendUrl = 'https://retail-india-pos-master.onrender.com';
      if (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) {
        backendUrl = 'http://localhost:3001';
      }
      
      console.log('[MobileScanner] Backend URL:', backendUrl);
      console.log('[MobileScanner] Request payload:', { barcode, timestamp: new Date().toISOString() });
      
      const response = await fetch(`${backendUrl}/api/mobile-scanner/scan/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, timestamp: new Date().toISOString() })
      });
      
      console.log('[MobileScanner] Response status:', response.status);
      console.log('[MobileScanner] Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MobileScanner] Server error:', errorText);
      } else {
        const responseData = await response.json();
        console.log('[MobileScanner] Server response:', responseData);
      }
    } catch (error) {
      console.error('[MobileScanner] Network error:', error);
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

  // Restore: Ensure mobile connects to backend session on load
  useEffect(() => {
    if (sessionId) {
      connectToSession();
    }
    // eslint-disable-next-line
  }, [sessionId]);

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
              {/* Performance Mode Toggle */}
              {scanning && (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Performance Mode</span>
                    <span className="text-xs text-gray-500">
                      {performanceMode ? 'Smooth camera (slower detection)' : 'Fast detection (may lag)'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={performanceMode ? "default" : "outline"}
                    onClick={() => {
                      setPerformanceMode(!performanceMode);
                      // Restart detection with new settings
                      if (detectionSupported) {
                        startBarcodeDetection();
                      }
                    }}
                  >
                    {performanceMode ? 'Performance' : 'Speed'}
                  </Button>
                </div>
              )}
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
                      if (videoRef.current && videoRef.current.videoWidth > 0) {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          canvas.width = videoRef.current.videoWidth;
                          canvas.height = videoRef.current.videoHeight;
                          ctx.drawImage(videoRef.current, 0, 0);
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