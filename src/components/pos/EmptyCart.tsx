
import React from 'react';

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

const ShoppingCart = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="8" cy="21" r="1"/>
    <circle cx="19" cy="21" r="1"/>
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
  </svg>
);
