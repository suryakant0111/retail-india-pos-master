
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { CartItem, Customer } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
}

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
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'RETAIL POS',
    address: '123 Main Street, City',
    phone: '123-456-7890',
    email: 'contact@example.com',
    gstNumber: 'GST1234567890'
  });
  
  useEffect(() => {
    // Load business settings from localStorage whenever the dialog opens
    if (open) {
      try {
        const storedSettings = localStorage.getItem('businessSettings');
        if (storedSettings) {
          const settings = JSON.parse(storedSettings) as BusinessSettings;
          setBusinessSettings(settings);
        }
      } catch (error) {
        console.error('Error loading business settings:', error);
      }
    }
  }, [open]);
  
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add header with business details - industry standard
    doc.setFontSize(18);
    doc.text(businessSettings.businessName, 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(businessSettings.address, 105, 23, { align: 'center' });
    doc.text(`Phone: ${businessSettings.phone}`, 105, 28, { align: 'center' });
    doc.text(`Email: ${businessSettings.email}`, 105, 33, { align: 'center' });
    
    // GST Information - important for business invoices
    if (businessSettings.gstNumber) {
      doc.text(`GSTIN: ${businessSettings.gstNumber}`, 105, 38, { align: 'center' });
    }
    
    doc.line(10, 42, 200, 42); // Separator line
    
    // Invoice details - clear section
    doc.setFontSize(11);
    doc.text(`Invoice: #${reference}`, 14, 50);
    doc.text(`Date: ${new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 14, 56);
    
    // Customer details
    let yPos = 62;
    if (customer) {
      doc.text('Bill To:', 14, yPos);
      yPos += 6;
      doc.text(`${customer.name}`, 14, yPos);
      yPos += 5;
      if (customer.phone) {
        doc.text(`Phone: ${customer.phone}`, 14, yPos);
        yPos += 5;
      }
      if (customer.email) {
        doc.text(`Email: ${customer.email}`, 14, yPos);
        yPos += 5;
      }
      if (customer.address) {
        doc.text(`Address: ${customer.address}`, 14, yPos);
        yPos += 5;
      }
    } else {
      doc.text('Bill To: Walk-in Customer', 14, yPos);
      yPos += 10;
    }
    
    doc.line(10, yPos, 200, yPos); // Separator line
    yPos += 5;
    
    // Payment information
    doc.text(`Payment Method: ${paymentMethod.toUpperCase()}`, 140, 50, { align: 'right' });
    doc.text(`Status: PAID`, 140, 56, { align: 'right' });
    
    // Create table with items - well formatted
    const tableColumn = ["#", "Item Description", "Price", "Qty", "HSN", "Tax", "Amount"];
    const tableRows: any[] = [];
    
    items.forEach((item, index) => {
      const taxPerItem = (item.product.taxRate || 0) * item.price / 100;
      const itemData = [
        index + 1,
        item.variant ? 
          `${item.product.name} (${Object.entries(item.variant.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')})` 
          : item.product.name,
        `₹${item.price.toFixed(2)}`,
        item.quantity,
        item.product.hsn || 'N/A',
        `${item.product.taxRate || 0}%`,
        `₹${(item.price * item.quantity).toFixed(2)}`
      ];
      tableRows.push(itemData);
    });
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 10 }, // #
        1: { cellWidth: 60 }, // Description
        2: { cellWidth: 25 }, // Price
        3: { cellWidth: 15 }, // Qty
        4: { cellWidth: 20 }, // HSN
        5: { cellWidth: 20 }, // Tax
        6: { cellWidth: 30 }, // Amount
      },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Add totals section with tax breakdown - important for GST invoices
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 150, finalY, { align: 'right' });
    
    // Tax breakdown - often required for legal compliance
    const sgst = taxTotal / 2;
    const cgst = taxTotal / 2;
    
    doc.text(`SGST (${items.length > 0 ? (items[0].product.taxRate || 0) / 2 : 0}%): ₹${sgst.toFixed(2)}`, 150, finalY + 7, { align: 'right' });
    doc.text(`CGST (${items.length > 0 ? (items[0].product.taxRate || 0) / 2 : 0}%): ₹${cgst.toFixed(2)}`, 150, finalY + 14, { align: 'right' });
    
    // Discount information
    if (discountValue > 0) {
      const discountAmount = discountType === 'percentage' 
        ? (subtotal + taxTotal) * (discountValue / 100) 
        : discountValue;
      doc.text(`Discount${discountType === 'percentage' ? ` (${discountValue}%)` : ''}: -₹${discountAmount.toFixed(2)}`, 150, finalY + 21, { align: 'right' });
      doc.text(`Total: ₹${total.toFixed(2)}`, 150, finalY + 28, { align: 'right' });
      
      // Amount in words - common in formal invoices
      doc.text(`Amount in words: ${amountInWords(total)}`, 14, finalY + 35);
    } else {
      doc.text(`Total: ₹${total.toFixed(2)}`, 150, finalY + 21, { align: 'right' });
      
      // Amount in words - common in formal invoices
      doc.text(`Amount in words: ${amountInWords(total)}`, 14, finalY + 28);
    }
    
    // Add terms and conditions - standard in formal invoices
    doc.setFontSize(9);
    const termsY = finalY + 45;
    doc.text('Terms & Conditions:', 14, termsY);
    doc.text('1. Goods once sold will not be taken back or exchanged.', 14, termsY + 5);
    doc.text('2. This is a computer generated invoice and does not require a signature.', 14, termsY + 10);
    
    // Add footer with thank you note
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    
    // Save the PDF
    doc.save(`invoice-${reference}.pdf`);
  };
  
  const amountInWords = (amount: number): string => {
    // Basic implementation for amount in words (can be expanded)
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    // Format amount to 2 decimal places and split into rupees and paise
    const formatted = amount.toFixed(2);
    const parts = formatted.split('.');
    const rupees = parseInt(parts[0]);
    const paise = parseInt(parts[1]);
    
    if (rupees === 0) return 'Zero Rupees Only';
    
    let result = '';
    
    // Process thousands
    const thousands = Math.floor(rupees / 1000);
    if (thousands > 0) {
      result += (thousands > 9 ? amountInWords(thousands) : units[thousands]) + ' Thousand ';
      if (rupees % 1000 === 0) result += 'Rupees Only';
    }
    
    // Process hundreds
    const hundreds = Math.floor((rupees % 1000) / 100);
    if (hundreds > 0) {
      result += units[hundreds] + ' Hundred ';
      if (rupees % 100 === 0) result += 'Rupees Only';
    }
    
    // Process tens and units
    const remaining = rupees % 100;
    if (remaining > 0) {
      if (result !== '') result += 'and ';
      
      if (remaining < 10) {
        result += units[remaining] + ' Rupees';
      } else if (remaining < 20) {
        result += teens[remaining - 10] + ' Rupees';
      } else {
        result += tens[Math.floor(remaining / 10)];
        if (remaining % 10 > 0) {
          result += ' ' + units[remaining % 10];
        }
        result += ' Rupees';
      }
    }
    
    // Add paise if present
    if (paise > 0) {
      result += ' and ';
      if (paise < 10) {
        result += units[paise] + ' Paise';
      } else if (paise < 20) {
        result += teens[paise - 10] + ' Paise';
      } else {
        result += tens[Math.floor(paise / 10)];
        if (paise % 10 > 0) {
          result += ' ' + units[paise % 10];
        }
        result += ' Paise';
      }
    }
    
    return result + ' Only';
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tax Invoice</DialogTitle>
          <DialogDescription>
            Invoice #{reference}
            <span className="block text-xs mt-1">
              {new Date().toLocaleString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="border-t border-b py-4 my-4">
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg">{businessSettings.businessName}</h3>
            <p className="text-sm text-muted-foreground">{businessSettings.address}</p>
            <p className="text-sm text-muted-foreground">Phone: {businessSettings.phone}</p>
            <p className="text-sm text-muted-foreground">GSTIN: {businessSettings.gstNumber}</p>
            <div className="border-t border-dashed my-2"></div>
            {customer && <p className="text-sm mt-2">Customer: {customer.name}</p>}
            {customer && customer.phone && <p className="text-sm">Phone: {customer.phone}</p>}
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
            
            {/* Tax breakdown - important for GST invoices */}
            <div className="flex justify-between text-sm">
              <span>SGST ({items.length > 0 ? (items[0].product.taxRate || 0) / 2 : 0}%)</span>
              <span>₹{(taxTotal / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>CGST ({items.length > 0 ? (items[0].product.taxRate || 0) / 2 : 0}%)</span>
              <span>₹{(taxTotal / 2).toFixed(2)}</span>
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
            <div className="flex justify-between text-sm">
              <span>Payment Status</span>
              <span className="text-green-600 font-medium">PAID</span>
            </div>
          </div>
          
          <div className="text-center mt-6 border-t border-dashed pt-3">
            <p className="text-xs text-muted-foreground">Thank you for your business!</p>
            <p className="text-xs text-muted-foreground">This is a computer generated invoice.</p>
            <p className="text-xs text-muted-foreground mt-1">Authorized Signatory</p>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={generatePDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
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
