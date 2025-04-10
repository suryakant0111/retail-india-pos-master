
import React from 'react';
import { ShoppingCart } from 'lucide-react';

export const EmptyCart: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="bg-muted rounded-full p-3 mb-4">
        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium">Cart is empty</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Add products from the left panel or use the barcode scanner
      </p>
    </div>
  );
};
