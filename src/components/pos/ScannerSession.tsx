import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';

interface ScannerSessionProps {
  sessionId: string;
  products: Product[];
  onProductFound: (product: Product) => void;
}

export const ScannerSession: React.FC<ScannerSessionProps> = ({
  sessionId,
  products,
  onProductFound
}) => {
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!sessionId) return;

    setIsPolling(true);
    console.log('[ScannerSession] Polling started for session:', sessionId);
    const interval = setInterval(async () => {
      try {
        const renderUrl = 'https://retail-india-pos-master.onrender.com';
        const response = await fetch(`${renderUrl}/scanner-session/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          const scans = data.scans || [];
          if (scans.length > 0) {
            const latestScan = scans[scans.length - 1];
            if (latestScan.barcode !== lastScannedBarcode) {
              setLastScannedBarcode(latestScan.barcode);
              console.log('[ScannerSession] Barcode received from backend:', latestScan.barcode);
              console.log('[ScannerSession] Current products array:', products);
              // Find product by barcode
              const product = products.find(p => {
                const match = p.barcode && p.barcode.toString() === latestScan.barcode;
                if (match) {
                  console.log('[ScannerSession] Product matched:', p);
                }
                return match;
              });
              if (product) {
                onProductFound(product);
                toast({
                  title: "Product Scanned",
                  description: `${product.name} added to cart`,
                  variant: "success",
                });
              } else {
                console.warn('[ScannerSession] No product found with barcode:', latestScan.barcode);
                toast({
                  title: "Product Not Found",
                  description: `No product found with barcode: ${latestScan.barcode}`,
                  variant: "destructive",
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('[ScannerSession] Error polling scanner session:', error);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
      console.log('[ScannerSession] Polling stopped for session:', sessionId);
    };
  }, [sessionId, lastScannedBarcode, products, onProductFound, toast]);

  if (!sessionId) return null;

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
        <span className="text-sm font-medium text-blue-800">
          Mobile Scanner Active
        </span>
      </div>
      {lastScannedBarcode && (
        <div className="text-xs text-blue-600">
          Last scanned: {lastScannedBarcode}
        </div>
      )}
      <div className="text-xs text-blue-500 mt-1">
        Session: {sessionId.substring(0, 8)}...
      </div>
    </div>
  );
}; 