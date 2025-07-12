import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useSearchParams } from 'react-router-dom';

const BarcodeScanner = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const [lastScanned, setLastScanned] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-reader';

  // Connect to session on mount
  useEffect(() => {
    const connectToSession = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        return;
      }
      try {
        const backendUrl = window.location.hostname === 'localhost'
          ? 'http://localhost:3001'
          : 'https://retail-india-pos-master.onrender.com';

        const res = await fetch(`${backendUrl}/api/mobile-scanner/connect/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connected: true }),
        });

        if (res.ok) {
          setConnected(true);
          console.log('✅ Connected to session');
        } else {
          throw new Error(`Failed with status ${res.status}`);
        }
      } catch (err) {
        console.error('❌ Failed to connect:', err);
        setError('Failed to connect to main application');
      }
    };

    connectToSession();

    return () => {
      // Stop scanning when component unmounts
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [sessionId]);

  const startScanning = async () => {
    if (!sessionId) {
      setError('No session ID found');
      return;
    }

    setError('');
    setScanning(true);

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    const html5QrCode = new Html5Qrcode(scannerId);
    html5QrCodeRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          console.log('✅ Decoded:', decodedText);
          setLastScanned(decodedText);

          // Send to backend
          const backendUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : 'https://retail-india-pos-master.onrender.com';

          try {
            const res = await fetch(`${backendUrl}/api/mobile-scanner/scan/${sessionId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ barcode: decodedText, timestamp: new Date().toISOString() }),
            });

            if (!res.ok) {
              console.error('❌ Failed to send barcode:', await res.text());
              setError('Failed to send barcode to server');
            }
          } catch (err) {
            console.error('❌ Network error:', err);
            setError('Network error while sending barcode');
          }
        },
        (err) => {
          console.log('Decode error:', err);
        }
      );
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

  const handleManualBarcode = async (barcode: string) => {
    const clean = barcode.trim();
    if (!clean) return;

    setLastScanned(clean);

    const backendUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:3001'
      : 'https://retail-india-pos-master.onrender.com';

    try {
      const res = await fetch(`${backendUrl}/api/mobile-scanner/scan/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: clean, timestamp: new Date().toISOString() }),
      });

      if (!res.ok) {
        console.error('❌ Failed to send manual barcode:', await res.text());
        setError('Failed to send manual barcode');
      }
    } catch (err) {
      console.error('❌ Network error (manual barcode):', err);
      setError('Network error while sending manual barcode');
    }
  };

  if (!sessionId) {
    return (
      <div className="p-4">
        <h2 className="text-red-600">❌ No session ID</h2>
        <p>Please scan the QR code in the main app to generate a session.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Barcode / QR Scanner</h1>

      <p className="text-sm text-gray-600">Session: {sessionId.slice(0, 8)}...</p>

      <div>
        {connected ? (
          <span className="text-green-600">✅ Connected to main app</span>
        ) : (
          <span className="text-gray-500">🔄 Connecting...</span>
        )}
      </div>

      {!scanning ? (
        <button
          onClick={startScanning}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Start Scanning
        </button>
      ) : (
        <button
          onClick={stopScanning}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Stop Scanning
        </button>
      )}

      <div id={scannerId} className="w-full max-w-sm h-64 border border-gray-300 rounded" />

      {/* Manual entry fallback */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter barcode manually..."
          className="flex-1 px-2 py-1 border border-gray-400 rounded"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleManualBarcode((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
        <button
          onClick={(e) => {
            const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
            handleManualBarcode(input.value);
            input.value = '';
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Send
        </button>
      </div>

      {lastScanned && (
        <div className="p-2 bg-green-100 text-green-800 rounded">
          Last scanned: <strong>{lastScanned}</strong>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-100 text-red-800 rounded">{error}</div>
      )}
    </div>
  );
};

export default BarcodeScanner;
