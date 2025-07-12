import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Scan, Wifi, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// Type declaration for BarcodeDetector
declare global {
  interface Window {
    BarcodeDetector: {
      new (): BarcodeDetector;
    };
  }
}

interface BarcodeDetector {
  detect(image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<Array<{
    rawValue: string;
    format: string;
    boundingBox: DOMRectReadOnly;
  }>>;
}

const SCAN_COOLDOWN = 1500; // 1.5s for faster scanning
const DETECTION_INTERVAL = 300; // Check every 300ms for better responsiveness
const VIDEO_CONSTRAINTS = {
  video: {
    facingMode: 'environment',
    width: { ideal: 1280 }, // Higher resolution for better detection
    height: { ideal: 720 },
    frameRate: { ideal: 30 }, // Higher frame rate for smoother scanning
  }
};

const MobileScanner = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastScanned, setLastScanned] = useState('');
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeDetectorSupported, setBarcodeDetectorSupported] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const processedBarcodes = useRef(new Set());
  const lastScanTime = useRef(0);
  const { toast } = useToast();

  // Check for BarcodeDetector support
  useEffect(() => {
    const checkBarcodeDetectorSupport = async () => {
      try {
        if ('BarcodeDetector' in window) {
          // Test if we can create a detector
          const detector = new window.BarcodeDetector();
          setBarcodeDetectorSupported(true);
          detectorRef.current = detector;
          console.log('✅ BarcodeDetector API supported');
        } else {
          setBarcodeDetectorSupported(false);
          console.log('❌ BarcodeDetector API not supported');
        }
      } catch (err) {
        setBarcodeDetectorSupported(false);
        console.log('❌ BarcodeDetector API check failed:', err);
      }
    };
    
    checkBarcodeDetectorSupport();
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const connectToSession = async () => {
    if (!sessionId) {
      setError('No session ID provided');
      return;
    }
    try {
      const backendUrl = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')
        ? 'http://localhost:3001'
        : 'https://retail-india-pos-master.onrender.com';
      const response = await fetch(`${backendUrl}/api/mobile-scanner/connect/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected: true })
      });
      if (response.ok) {
        setConnected(true);
        toast({
          title: 'Connected!',
          description: 'Successfully connected to the main application',
          variant: 'default',
        });
      } else {
        throw new Error(`Connection failed: ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to connect:', err);
      setError('Failed to connect to main application');
      toast({
        title: 'Connection Error',
        description: 'Could not connect to the main application. Retrying...',
        variant: 'destructive',
      });
      // Retry after 5 seconds
      setTimeout(connectToSession, 5000);
    }
  };

  const startCamera = async () => {
    try {
      console.log('📹 Starting camera...');
      setScanning(true);
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
      console.log('📹 Camera stream obtained:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        console.log('📹 Waiting for video to load...');
        await new Promise<void>(resolve => {
          videoRef.current.onloadedmetadata = () => {
            console.log('📹 Video metadata loaded');
            resolve();
          };
        });
        
        console.log('📹 Starting video playback...');
        await videoRef.current.play();
        console.log('📹 Video playback started');
        
        console.log('📹 Starting barcode detection...');
        startBarcodeDetection();
      }
    } catch (err) {
      console.error('❌ Camera error:', err);
      setError('Failed to access camera: ' + err.message);
      setScanning(false);
      toast({
        title: 'Camera Error',
        description: 'Please allow camera access to scan barcodes',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    setScanning(false);
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startBarcodeDetection = () => {
    if (!barcodeDetectorSupported) {
      console.log('❌ BarcodeDetector not supported, using fallback');
      return;
    }

    console.log('🚀 Starting barcode detection...');
    processedBarcodes.current.clear();
    lastScanTime.current = 0;
    
    // Start detection loop
    detectionIntervalRef.current = setInterval(async () => {
      if (!scanning || !videoRef.current || isScanning) {
        return;
      }

      const now = Date.now();
      if (now - lastScanTime.current < SCAN_COOLDOWN) {
        return;
      }

      try {
        setIsScanning(true);
        console.log('🔍 Attempting barcode detection...');
        
        // Check if video is ready
        if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
          console.log('⚠️ Video not ready yet, skipping detection');
          return;
        }
        
        console.log('📹 Video dimensions:', {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
          readyState: videoRef.current.readyState
        });
        
        const barcodes = await detectorRef.current.detect(videoRef.current);
        console.log('🔍 Detection result:', barcodes);
        
        if (barcodes.length > 0) {
          const barcode = barcodes[0].rawValue;
          console.log('✅ Barcode detected:', barcode);
          handleScanResult(barcode);
        } else {
          console.log('❌ No barcodes found in frame');
        }
      } catch (err) {
        console.error('❌ Detection error:', err);
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
      } finally {
        setIsScanning(false);
      }
    }, DETECTION_INTERVAL);
  };

  const handleScanResult = (barcode) => {
    if (!scanning) return;
    
    const now = Date.now();
    
    // Apply cooldown and duplicate check
    if (
      now - lastScanTime.current < SCAN_COOLDOWN || 
      processedBarcodes.current.has(barcode)
    ) {
      return;
    }
    
    processedBarcodes.current.add(barcode);
    lastScanTime.current = now;
    
    setLastScanned(barcode);
    sendBarcodeToServer(barcode);
    
    toast({
      title: 'Barcode Scanned!',
      description: `Found: ${barcode}`,
      variant: 'default',
    });
  };

  const sendBarcodeToServer = async (barcode) => {
    if (!sessionId) return;
    try {
      const backendUrl = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')
        ? 'http://localhost:3001'
        : 'https://retail-india-pos-master.onrender.com';
      const response = await fetch(`${backendUrl}/api/mobile-scanner/scan/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, timestamp: new Date().toISOString() })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        setError('Failed to send barcode to server');
        toast({
          title: 'Server Error',
          description: 'Failed to send barcode. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error while sending barcode');
      toast({
        title: 'Network Error',
        description: 'Could not reach the server. Please check your connection.',
        variant: 'destructive',
      });
    }
  };

  const handleManualBarcode = async (barcode) => {
    if (!barcode.trim()) return;
    await sendBarcodeToServer(barcode.trim());
    setLastScanned(barcode.trim());
    toast({
      title: 'Barcode Sent!',
      description: `Barcode: ${barcode.trim()}`,
      variant: 'default',
    });
  };

  useEffect(() => {
    if (sessionId) connectToSession();
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Invalid Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">No session ID provided. Please scan the QR code from the main application.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Smartphone className="h-5 w-5 text-blue-600" />
              Mobile Barcode Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {connected ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Connected to main app</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Wifi className="h-4 w-4 animate-pulse" />
                    <span className="text-sm">Connecting...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">Session: {sessionId.slice(0, 8)}...</p>
              
              {/* BarcodeDetector Support Status */}
              <div className="flex items-center gap-2">
                {barcodeDetectorSupported ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-xs">Native Barcode Detection</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-xs">Manual Entry Only</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Camera Scanner */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Camera Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {scanning ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-4 border-blue-500 border-opacity-50 rounded-lg p-4">
                      <Scan className="h-8 w-8 text-blue-500 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Camera not active</p>
                    </div>
                  </div>
                )}
                {scanning && (
                  <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {isScanning ? 'Scanning...' : 'Ready to scan'}
                  </div>
                )}
                
                {/* Debug Status */}
                {scanning && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    <div>📹: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}</div>
                    <div>🔍: {isScanning ? 'Active' : 'Idle'}</div>
                  </div>
                )}
              </div>
              <Button
                onClick={scanning ? stopCamera : startCamera}
                className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                disabled={!barcodeDetectorSupported}
              >
                {scanning ? (
                  'Stop Camera'
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera
                  </>
                )}
              </Button>
              
              {/* Test Detection Button */}
              {scanning && barcodeDetectorSupported && (
                <Button
                  onClick={async () => {
                    console.log('🧪 Manual test detection...');
                    try {
                      const barcodes = await detectorRef.current.detect(videoRef.current);
                      console.log('🧪 Test detection result:', barcodes);
                      if (barcodes.length > 0) {
                        console.log('✅ Test barcode found:', barcodes[0].rawValue);
                        handleScanResult(barcodes[0].rawValue);
                      } else {
                        console.log('❌ No barcodes in test detection');
                      }
                    } catch (err) {
                      console.error('❌ Test detection failed:', err);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  🧪 Test Detection
                </Button>
              )}
              {scanning && barcodeDetectorSupported && (
                <div className="text-center">
                  <Badge className="bg-green-100 text-green-800">
                    <Scan className="mr-1 h-3 w-3" />
                    Native detection active
                  </Badge>
                </div>
              )}
              {!barcodeDetectorSupported && (
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    Your browser doesn't support native barcode detection. Use manual entry below.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Manual Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter barcode manually..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualBarcode(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    handleManualBarcode(input.value);
                    input.value = '';
                  }}
                >
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Scanned */}
        {lastScanned && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Last Scanned</CardTitle>
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
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Badge className="bg-blue-100 text-blue-800">1</Badge>
                <span>Click "Start Camera" to begin scanning</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-blue-100 text-blue-800">2</Badge>
                <span>Point camera at product barcodes</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-blue-100 text-blue-800">3</Badge>
                <span>Scanned barcodes are sent to main app automatically</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-blue-100 text-blue-800">4</Badge>
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