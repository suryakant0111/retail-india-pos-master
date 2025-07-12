import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

const MobileScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get session ID from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session');
    if (session) {
      setSessionId(session);
    }
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        setStatus('scanning');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setStatus('error');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setStatus('idle');
  };

  // Simulate barcode scanning (for demo)
  const simulateScan = () => {
    const demoBarcodes = ['123456789', '987654321', '456789123'];
    const randomBarcode = demoBarcodes[Math.floor(Math.random() * demoBarcodes.length)];
    
    setScannedBarcode(randomBarcode);
    setStatus('success');
    
    // Send barcode to PC
    sendBarcodeToPC(randomBarcode);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setStatus('scanning');
      setScannedBarcode('');
    }, 2000);
  };

  // Send barcode to PC
  const sendBarcodeToPC = async (barcode: string) => {
    try {
      const renderUrl = 'https://retail-india-pos-master.onrender.com';
      const apiUrl = `${renderUrl}/scanner-scan`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: sessionId,
          barcode: barcode,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log('Barcode sent to PC successfully');
      }
    } catch (error) {
      console.error('Error sending barcode to PC:', error);
    }
  };

  // Handle manual barcode entry
  const handleManualEntry = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = (e.target as HTMLInputElement).value;
      if (barcode.trim()) {
        setScannedBarcode(barcode);
        setStatus('success');
        sendBarcodeToPC(barcode);
        (e.target as HTMLInputElement).value = '';
        
        setTimeout(() => {
          setStatus('scanning');
          setScannedBarcode('');
        }, 2000);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mobile Barcode Scanner</h1>
          <p className="text-sm text-gray-600">Scan products to add to cart</p>
          {sessionId && (
            <p className="text-xs text-gray-500 mt-1">Session: {sessionId}</p>
          )}
        </div>

        {/* Camera View */}
        <div className="bg-black rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 object-cover"
            style={{ display: isScanning ? 'block' : 'none' }}
          />
          {!isScanning && (
            <div className="w-full h-64 bg-gray-800 flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Camera not active</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Display */}
        {status === 'success' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Barcode Scanned: {scannedBarcode}
              </span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">
                Camera access denied. Please allow camera permission.
              </span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3">
          {!isScanning ? (
            <button
              onClick={startCamera}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium"
            >
              Stop Camera
            </button>
          )}

          {/* Demo Scan Button */}
          <button
            onClick={simulateScan}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium"
          >
            Demo Scan (Test)
          </button>

          {/* Manual Entry */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Manual Entry
            </label>
            <input
              type="text"
              placeholder="Type barcode and press Enter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              onKeyPress={handleManualEntry}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">How to use:</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Click "Start Camera"</li>
            <li>Allow camera permission when prompted</li>
            <li>Point camera at product barcode</li>
            <li>Product will be added to PC cart automatically</li>
            <li>Use "Demo Scan" to test without real barcode</li>
          </ol>
        </div>

        {/* Connection Status */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${sessionId ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {sessionId ? 'Connected to PC' : 'Not connected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileScanner; 