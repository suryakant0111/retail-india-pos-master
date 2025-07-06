
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { CartItem, Customer } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const { profile } = useAuth();
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: ''
  });
  const [loadingBusiness, setLoadingBusiness] = useState(false);

  useEffect(() => {
    async function fetchBusinessSettings() {
      if (!profile?.shop_id) return;
      setLoadingBusiness(true);
      const { data, error } = await supabase
        .from('shops')
        .select('name, address, phone, email, gstin')
        .eq('id', profile.shop_id)
        .single();
      if (data) {
        setBusinessSettings({
          businessName: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          gstNumber: data.gstin || '',
        });
      }
      setLoadingBusiness(false);
    }
    if (open) fetchBusinessSettings();
  }, [open, profile?.shop_id]);
  
  const generatePDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 40;

    // Shop/Business Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(businessSettings.businessName, pageWidth / 2, y, { align: 'center' });
    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(businessSettings.address, pageWidth / 2, y, { align: 'center' });
    y += 16;
    doc.text(`Phone: ${businessSettings.phone}    Email: ${businessSettings.email}`, pageWidth / 2, y, { align: 'center' });
    y += 16;
    if (businessSettings.gstNumber) {
      doc.text(`GSTIN: ${businessSettings.gstNumber}`, pageWidth / 2, y, { align: 'center' });
      y += 16;
    }
    y += 8;
    doc.setDrawColor(200);
    doc.line(40, y, pageWidth - 40, y);
    y += 18;

    // Invoice Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TAX INVOICE', 40, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Invoice #: ${reference}`, 40, y + 18);
    doc.text(`Date: ${new Date().toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })}`, 40, y + 36);
    let customerY = y + 18;
    if (customer) {
      doc.text(`Customer: ${customer.name}`, pageWidth - 220, customerY);
      customerY += 18;
      if (customer.phone) doc.text(`Phone: ${customer.phone}`, pageWidth - 220, customerY);
      if (customer.email) doc.text(`Email: ${customer.email}`, pageWidth - 220, customerY + 18);
    }
    y += 54;
    doc.line(40, y, pageWidth - 40, y);
    y += 18;

    // Items Table
    const tableColumn = ["#", "Item Description", "Price", "Qty", "HSN", "Tax", "Amount"];
    const tableRows: any[] = [];
    items.forEach((item, index) => {
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
      startY: y,
      theme: 'striped',
      headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 160 },
        2: { cellWidth: 60 },
        3: { cellWidth: 36 },
        4: { cellWidth: 48 },
        5: { cellWidth: 48 },
        6: { cellWidth: 64 },
      },
      margin: { left: 40, right: 40 },
    });
    let finalY = (doc as any).lastAutoTable.finalY + 16;

    // Totals Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Summary', 40, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    finalY += 14;
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 40, finalY);
    finalY += 14;
    const sgst = taxTotal / 2;
    const cgst = taxTotal / 2;
    doc.text(`SGST (${items.length > 0 ? (items[0].product.taxRate || 0) / 2 : 0}%): ₹${sgst.toFixed(2)}`, 40, finalY);
    finalY += 14;
    doc.text(`CGST (${items.length > 0 ? (items[0].product.taxRate || 0) / 2 : 0}%): ₹${cgst.toFixed(2)}`, 40, finalY);
    finalY += 14;
    if (discountValue > 0) {
      const discountAmount = discountType === 'percentage'
        ? (subtotal + taxTotal) * (discountValue / 100)
        : discountValue;
      doc.text(`Discount${discountType === 'percentage' ? ` (${discountValue}%)` : ''}: -₹${discountAmount.toFixed(2)}`, 40, finalY);
      finalY += 14;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ₹${total.toFixed(2)}`, 40, finalY);
    finalY += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Amount in words: ${amountInWords(total)}`, 40, finalY);
    finalY += 24;
    doc.setDrawColor(200);
    doc.line(40, finalY, pageWidth - 40, finalY);
    finalY += 18;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.text('Thank you for your business!', pageWidth / 2, finalY, { align: 'center' });
    finalY += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Terms & Conditions:', 40, finalY);
    doc.text('1. Goods once sold will not be taken back or exchanged.', 40, finalY + 12);
    doc.text('2. This is a computer generated invoice and does not require a signature.', 40, finalY + 24);
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
      <DialogContent className="max-w-md print:max-w-full print:p-0">
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
        {loadingBusiness ? (
          <div className="text-center py-8">Loading business details...</div>
        ) : (
        <div className="border-t border-b py-4 my-4 print:border-none print:py-2">
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg">{businessSettings.businessName}</h3>
            <p className="text-sm text-muted-foreground">{businessSettings.address}</p>
            <p className="text-sm text-muted-foreground">Phone: {businessSettings.phone}</p>
            <p className="text-sm text-muted-foreground">Email: {businessSettings.email}</p>
            <p className="text-sm text-muted-foreground">GSTIN: {businessSettings.gstNumber}</p>
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
        )}
        
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
