import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Wifi, CheckCircle, Smartphone, AlertCircle, Camera, Scan } from 'lucide-react';

const MobileScanner = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const [connected, setConnected] = useState(false);
  const [lastScanned, setLastScanned] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-reader';
  const { toast } = useToast();

  useEffect(() => {
    if (sessionId) connectToSession();
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear();
      }
    };
  }, [sessionId]);

  const connectToSession = async () => {
    try {
      const backendUrl =
        window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')
          ? 'http://localhost:3001'
          : 'https://retail-india-pos-master.onrender.com';

      const res = await fetch(`${backendUrl}/api/mobile-scanner/connect/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected: true }),
      });

      if (res.ok) {
        setConnected(true);
        toast({
          title: 'Connected!',
          description: 'Successfully connected to the main application.',
        });
      } else {
        throw new Error('Failed to connect');
      }
    } catch (err) {
      console.error(err);
      setConnected(false);
      toast({
        title: 'Connection Error',
        description: 'Retrying in 5 seconds...',
        variant: 'destructive',
      });
      setTimeout(connectToSession, 5000);
    }
  };

  const startScanning = async () => {
    setError('');
    setScanning(true);
    const html5QrCode = new Html5Qrcode(scannerId);
    html5QrCodeRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          console.log('Decoded:', decodedText);
          handleScan(decodedText);
        },
        (err) => {
          console.log('Decode error:', err);
        }
      );

      // Get video dimensions for debug
      const video = document.querySelector(`#${scannerId} video`) as HTMLVideoElement;
      if (video) {
        video.onloadedmetadata = () => {
          setVideoDimensions({
            width: video.videoWidth,
            height: video.videoHeight,
          });
        };
      }
    } catch (err) {
      console.error(err);
      setError('Failed to start scanner.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop();
      html5QrCodeRef.current.clear();
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  const handleScan = async (barcode: string) => {
    console.log('[MobileScanner] Barcode scanned:', barcode);
    console.log('[MobileScanner] Session ID:', sessionId);
    
    setLastScanned(barcode);
    toast({
      title: 'Scanned!',
      description: `Barcode: ${barcode}`,
    });

    if (!sessionId) {
      console.error('[MobileScanner] No session ID available');
      setError('No session ID. Cannot send barcode to server.');
      return;
    }

    try {
      const backendUrl =
        window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')
          ? 'http://localhost:3001'
          : 'https://retail-india-pos-master.onrender.com';

      console.log('[MobileScanner] Sending barcode to backend:', backendUrl);
      console.log('[MobileScanner] Request payload:', { barcode, timestamp: new Date().toISOString() });

      const res = await fetch(`${backendUrl}/api/mobile-scanner/scan/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, timestamp: new Date().toISOString() }),
      });

      console.log('[MobileScanner] Backend response status:', res.status);
      console.log('[MobileScanner] Backend response ok:', res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[MobileScanner] Backend error response:', errorText);
        setError(`Failed to send barcode to server. Status: ${res.status}`);
      } else {
        const responseData = await res.json();
        console.log('[MobileScanner] Backend success response:', responseData);
        setError(''); // Clear any previous errors
      }
    } catch (err) {
      console.error('[MobileScanner] Network error:', err);
      setError(`Network error while sending barcode: ${err.message}`);
    }
  };

  const handleManualBarcode = (barcode: string) => {
    if (!barcode.trim()) return;
    handleScan(barcode.trim());
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" /> Invalid Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>No session ID. Please scan QR from the main app.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <Smartphone className="w-5 h-5" /> Mobile Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {connected ? (
                <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Connected
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-700 flex items-center gap-1 animate-pulse">
                  <Wifi className="w-4 h-4" /> Connecting...
                </Badge>
              )}
            </div>
            <p className="text-xs mt-1">Session ID: {sessionId.slice(0, 8)}...</p>
          </CardContent>
        </Card>

        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <Camera className="w-5 h-5" /> Camera Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id={scannerId} className="w-full h-64 bg-black rounded"></div>
            {scanning && (
              <div className="mt-2 text-xs text-gray-600">
                📹 Resolution: {videoDimensions.width}x{videoDimensions.height}
              </div>
            )}
            <Button
              onClick={scanning ? stopScanning : startScanning}
              className="mt-3 w-full bg-blue-600 text-white"
            >
              {scanning ? 'Stop Camera' : 'Start Camera'}
            </Button>
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter barcode..."
                className="flex-1 border px-3 py-2 rounded"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualBarcode(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handleManualBarcode(input.value);
                  input.value = '';
                }}
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Scanned */}
        {lastScanned && (
          <Card>
            <CardHeader>
              <CardTitle>Last Scanned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-2 bg-green-50 border rounded">
                <CheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
                <span className="font-mono text-sm">{lastScanned}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card>
            <CardContent>
              <div className="p-2 bg-red-50 border rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="list-disc pl-5 space-y-1">
              <li>Connects automatically to session.</li>
              <li>Click Start Camera to scan barcodes or QR codes.</li>
              <li>Use manual entry if needed.</li>
              <li>Scanned data is sent to the main POS app.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileScanner;
