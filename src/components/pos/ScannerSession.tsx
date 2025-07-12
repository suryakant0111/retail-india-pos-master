import React, { useEffect, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';
import { CheckCircle, AlertCircle } from 'lucide-react';

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

  // Poll for new scanned barcodes
  useEffect(() => {
    if (!sessionId) return;

    setIsPolling(true);
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
              
              // Find product by barcode
              const product = products.find(p => 
                p.barcode && p.barcode.toString() === latestScan.barcode
              );
              
              if (product) {
                onProductFound(product);
                toast({
                  title: "Product Scanned",
                  description: `${product.name} added to cart`,
                  variant: "success",
                });
              } else {
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
        console.error('Error polling scanner session:', error);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [sessionId, lastScannedBarcode, products, onProductFound, toast]);

  if (!sessionId) return null;

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        {isPolling ? (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        ) : (
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        )}
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