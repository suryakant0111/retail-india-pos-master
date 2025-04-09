
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { CartItem, Customer } from '@/types';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  customer: Customer | null;
  subtotal: number;
  taxTotal: number;
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  reference: string;
  onPrintReceipt: () => void;
  onFinalize: () => void;
  isPrintingReceipt: boolean;
}

export const ReceiptDialog: React.FC<ReceiptDialogProps> = ({
  open,
  onOpenChange,
  items,
  customer,
  subtotal,
  taxTotal,
  discountValue,
  discountType,
  total,
  paymentMethod,
  reference,
  onPrintReceipt,
  onFinalize,
  isPrintingReceipt
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>
            Transaction #{reference}
            <span className="block text-xs mt-1">
              {new Date().toLocaleString('en-IN')}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="border-t border-b py-4 my-4">
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg">RETAIL POS</h3>
            <p className="text-sm text-muted-foreground">123 Main Street, City</p>
            <p className="text-sm text-muted-foreground">Phone: 123-456-7890</p>
            {customer && <p className="text-sm mt-2">Customer: {customer.name}</p>}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Item</span>
              <div className="flex">
                <span className="w-16 text-right">Qty</span>
                <span className="w-20 text-right">Amount</span>
              </div>
            </div>
            
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex-1">
                  <div>{item.product.name}</div>
                  {item.variant && (
                    <div className="text-xs text-muted-foreground">
                      {Object.entries(item.variant.attributes)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    ₹{item.price.toFixed(2)} x {item.quantity}
                  </div>
                </div>
                <div className="flex">
                  <span className="w-16 text-right">{item.quantity}</span>
                  <span className="w-20 text-right">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t mt-4 pt-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>₹{taxTotal.toFixed(2)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-sm">
                <span>Discount {discountType === 'percentage' ? `(${discountValue}%)` : ''}</span>
                <span>-₹{(discountType === 'percentage' ? (subtotal + taxTotal) * (discountValue / 100) : discountValue).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 text-base">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2">
              <span>Payment Method</span>
              <span>{paymentMethod.toUpperCase()}</span>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">Thank you for your purchase!</p>
            <p className="text-xs text-muted-foreground">Visit again</p>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onPrintReceipt}
              disabled={isPrintingReceipt}
            >
              {isPrintingReceipt ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </>
              )}
            </Button>
            <Button onClick={onFinalize}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
