import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Scan, Wifi, CheckCircle, AlertCircle, Smartphone, Settings, Zap, Clock } from 'lucide-react';

const SCAN_COOLDOWN = 2000; // 2 seconds between scans
const DETECTION_INTERVAL = 500; // Check every 500ms instead of every frame

const MobileScanner = () => {
  const [sessionId] = useState('demo-session-123'); // Demo session ID
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(true); // Demo connected state
  const [lastScanned, setLastScanned] = useState('');
  const [error, setError] = useState(null);
  const [detectionSupported, setDetectionSupported] = useState(false);
  const [scanningInProgress, setScanningInProgress] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [processedBarcodes, setProcessedBarcodes] = useState(new Set());
  const [scanCount, setScanCount] = useState(0);
  const [performanceMode, setPerformanceMode] = useState(true);
  const [manualInput, setManualInput] = useState('');
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const canvasRef = useRef(null);

  // Toast function (simplified)
  const toast = useCallback((config) => {
    console.log(`Toast: ${config.title} - ${config.description}`);
    // In a real app, this would show actual toast notifications
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  // Check for barcode detection support
  useEffect(() => {
    const checkSupport = async () => {
      try {
        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector();
          setDetectionSupported(true);
          console.log('Native BarcodeDetector supported');
        } else {
          setDetectionSupported(false);
          console.log('BarcodeDetector not supported, using fallback');
        }
      } catch (err) {
        setDetectionSupported(false);
        console.log('BarcodeDetector check failed:', err);
      }
    };
    checkSupport();
  }, []);

  const startCamera = async () => {
    try {
      setScanning(true);
      setError(null);
      setScanningInProgress(false);
      
      // Request camera with optimized settings
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video loaded:', {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          });
          startBarcodeDetection();
        };
      }
    } catch (err) {
      setError('Failed to access camera: ' + err.message);
      setScanning(false);
      toast({
        title: "Camera Error",
        description: "Please allow camera access to scan barcodes",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    setScanning(false);
    setScanningInProgress(false);
    
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
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    // Reset state
    setProcessedBarcodes(new Set());
    setLastScanTime(0);
    
    // Start detection with interval instead of animation frame
    detectionIntervalRef.current = setInterval(() => {
      if (!scanning || !videoRef.current || scanningInProgress) {
        return;
      }
      
      const now = Date.now();
      if (now - lastScanTime < SCAN_COOLDOWN) {
        return;
      }
      
      detectBarcode();
    }, DETECTION_INTERVAL);
  };

  const detectBarcode = async () => {
    if (!videoRef.current || scanningInProgress) return;
    
    setScanningInProgress(true);
    
    try {
      if (detectionSupported) {
        // Use native BarcodeDetector
        const detector = new window.BarcodeDetector();
        const barcodes = await detector.detect(videoRef.current);
        
        if (barcodes.length > 0) {
          const barcode = barcodes[0].rawValue;
          await handleBarcodeDetected(barcode);
        }
      } else {
        // Fallback: capture frame and simulate detection
        await simulateBarcodeDetection();
      }
    } catch (err) {
      console.log('Detection error:', err);
      // Don't show error for detection failures, just continue
    } finally {
      setScanningInProgress(false);
    }
  };

  const simulateBarcodeDetection = async () => {
    // Simulate barcode detection for demo purposes
    // In a real app, you'd use ZXing or another library here
    const simulatedBarcodes = [
      '1234567890123',
      '9876543210987',
      '1111222233334',
      '5555666677778'
    ];
    
    // Randomly detect a barcode (10% chance each check)
    if (Math.random() < 0.1) {
      const randomBarcode = simulatedBarcodes[Math.floor(Math.random() * simulatedBarcodes.length)];
      await handleBarcodeDetected(randomBarcode);
    }
  };

  const handleBarcodeDetected = async (barcode) => {
    if (!barcode || processedBarcodes.has(barcode)) {
      return;
    }
    
    // Add to processed set
    setProcessedBarcodes(prev => new Set([...prev, barcode]));
    setLastScanTime(Date.now());
    setLastScanned(barcode);
    setScanCount(prev => prev + 1);
    
    // Send to server
    await sendBarcodeToServer(barcode);
    
    // Show success feedback
    toast({
      title: "Barcode Scanned!",
      description: `Found: ${barcode}`,
      variant: "default"
    });
  };

  const sendBarcodeToServer = async (barcode) => {
    console.log('Sending barcode to server:', barcode);
    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Barcode sent successfully:', barcode);
        resolve();
      }, 100);
    });
  };

  const handleManualBarcode = async () => {
    if (!manualInput.trim()) return;
    
    await handleBarcodeDetected(manualInput.trim());
    setManualInput('');
  };

  const resetScanner = () => {
    setProcessedBarcodes(new Set());
    setLastScanned('');
    setScanCount(0);
    setLastScanTime(0);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              Mobile Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {connected ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-700">Connected</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Connecting...</span>
                    </>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {scanCount} scans
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                Session: {sessionId.substring(0, 8)}...
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Camera Scanner */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Camera Scanner</span>
              <div className="flex items-center gap-2">
                {scanning && (
                  <Badge variant={scanningInProgress ? "default" : "secondary"} className="text-xs">
                    {scanningInProgress ? (
                      <>
                        <Scan className="mr-1 h-3 w-3 animate-spin" />
                        Scanning
                      </>
                    ) : (
                      <>
                        <Clock className="mr-1 h-3 w-3" />
                        Ready
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Video Container */}
              <div className="relative overflow-hidden rounded-xl bg-gray-900">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Scanning Overlay */}
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Scanning Frame */}
                      <div className="w-48 h-32 border-2 border-white/80 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                        
                        {/* Scanning Line */}
                        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
                      </div>
                      
                      {/* Center Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-3 bg-black/30 rounded-full">
                          <Scan className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Inactive State */}
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
                    <div className="text-center">
                      <div className="p-4 bg-gray-700 rounded-full mb-3">
                        <Camera className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-300">Camera not active</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex gap-2">
                {!scanning ? (
                  <Button onClick={startCamera} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    Stop Camera
                  </Button>
                )}
                
                {scanning && (
                  <Button onClick={resetScanner} variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Performance Toggle */}
              {scanning && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Performance Mode</span>
                  </div>
                  <Button
                    size="sm"
                    variant={performanceMode ? "default" : "outline"}
                    onClick={() => setPerformanceMode(!performanceMode)}
                  >
                    {performanceMode ? 'Smooth' : 'Fast'}
                  </Button>
                </div>
              )}

              {/* Detection Status */}
              <div className="text-center">
                <Badge variant={detectionSupported ? "default" : "secondary"} className="text-xs">
                  {detectionSupported ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Native Detection
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Fallback Mode
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Manual Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter barcode manually..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualBarcode();
                    }
                  }}
                />
                <Button size="sm" onClick={handleManualBarcode} className="bg-blue-600 hover:bg-blue-700">
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Scanned */}
        {lastScanned && (
          <Card className="shadow-lg border-0 bg-green-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-800">Last Scanned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Barcode Sent Successfully!</p>
                  <p className="text-xs text-green-600 font-mono mt-1">{lastScanned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="shadow-lg border-0 bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <span className="text-sm">Tap "Start Camera" to begin scanning</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <span className="text-sm">Point camera at barcodes within the frame</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <span className="text-sm">Detected barcodes are sent automatically</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileScanner;