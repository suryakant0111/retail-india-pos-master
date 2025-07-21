import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import BillPreview from '@/components/pos/BillPreview';
import { useAuth } from '@/contexts/AuthContext';
import React, { useRef, forwardRef } from 'react';
import { Printer, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import html2pdf from 'html2pdf.js';

const BillsPage = () => {
  const { profile } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [shopDetails, setShopDetails] = useState<any>(null);
  const billRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchBills() {
      if (!profile?.shop_id) return;
      const { data } = await supabase
        .from('bills')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('created_at', { ascending: false });
      if (data) setBills(data);
    }
    fetchBills();
  }, [profile?.shop_id]);

  useEffect(() => {
    if (selectedBill?.shop_id) {
      supabase
        .from('shops')
        .select('name, address, phone, gstin, state')
        .eq('id', selectedBill.shop_id)
        .single()
        .then(({ data }) => {
          setShopDetails({
            name: data?.name || '',
            address: data?.address || '',
            phone: data?.phone || '',
            gstin: data?.gstin || '',
            state: data?.state || '',
          });
        });
    } else {
      setShopDetails(null);
    }
  }, [selectedBill]);

  function amountInWords(amount: number): string {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const formatted = amount.toFixed(2);
    const parts = formatted.split('.');
    const rupees = parseInt(parts[0]);
    const paise = parseInt(parts[1]);
    if (rupees === 0) return 'Zero Rupees Only';
    let result = '';
    const thousands = Math.floor(rupees / 1000);
    if (thousands > 0) {
      result += (thousands > 9 ? amountInWords(thousands) : units[thousands]) + ' Thousand ';
      if (rupees % 1000 === 0) result += 'Rupees Only';
    }
    const hundreds = Math.floor((rupees % 1000) / 100);
    if (hundreds > 0) {
      result += units[hundreds] + ' Hundred ';
      if (rupees % 100 === 0) result += 'Rupees Only';
    }
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
  }

  return (
    <div className="p-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Bills</h1>
      {selectedBill ? (
        <div>
          <Button variant="outline" onClick={() => setSelectedBill(null)} className="mb-4">← Back to list</Button>
          <div className="flex flex-col items-center justify-center">
            {/* Print/Download Actions */}
            <BillActions selectedBill={selectedBill} billRef={billRef} />
            {/* Bill Preview */}
            <div className="max-w-fit md:max-w-[350px] w-full flex justify-center">
              <BillPreviewWithRef
                ref={billRef}
                selectedBill={selectedBill}
                shopDetails={shopDetails}
                profile={profile}
                amountInWords={amountInWords}
              />
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Bills</CardTitle>
            <CardDescription>View and manage all bills</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.bill_number}</TableCell>
                    <TableCell>{new Date(bill.created_at).toLocaleString()}</TableCell>
                    <TableCell>{bill.customer?.name || 'Walk-in Customer'}</TableCell>
                    <TableCell>₹{bill.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelectedBill(bill)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Wrapper for BillPreview with ref forwarding
const BillPreviewWithRef = forwardRef<HTMLDivElement, {
  selectedBill: any;
  shopDetails: any;
  profile: any;
  amountInWords: (amount: number) => string;
}>(({ selectedBill, shopDetails, profile, amountInWords }, ref) => {
  // --- BEGIN: Exact Invoice Calculation Logic ---
  const subtotal = selectedBill.subtotal;
  const discount = selectedBill.discount;
  const discountType = selectedBill.discount_type || 'percentage';
  const taxRate =
    selectedBill.taxes && selectedBill.taxes.length > 0
      ? selectedBill.taxes[0].rate + selectedBill.taxes[1].rate
      : 0;

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = subtotal * (discount / 100);
  } else {
    discountAmount = discount;
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  let cgst = 0,
    sgst = 0;
  if (taxRate > 0 && discountedSubtotal > 0) {
    const cgstRate = taxRate / 2;
    const sgstRate = taxRate / 2;
    cgst = discountedSubtotal * (cgstRate / 100);
    sgst = discountedSubtotal * (sgstRate / 100);
  }

  const total = discountedSubtotal + cgst + sgst;
  // --- END: Exact Invoice Calculation Logic ---

  return (
    <div
      ref={ref}
      id="bill-preview-print-area"
      className="w-full flex justify-center print:flex print:justify-center print:items-start print:bg-white"
      style={{ padding: '1rem' }}
    >
      <div className="w-full max-w-md bg-white print:w-full print:max-w-md">
        <BillPreview
          shopName={shopDetails?.name ?? ''}
          addressLines={[shopDetails?.address ?? '']}
          phone={shopDetails?.phone ?? ''}
          gstin={shopDetails?.gstin ?? ''}
          state={shopDetails?.state ?? ''}
          billNo={selectedBill.bill_number}
          date={new Date(selectedBill.created_at).toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
          })}
          time={new Date(selectedBill.created_at).toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
          })}
          cashier={selectedBill.cashier || profile?.name || ''}
          customer={selectedBill.customer}
          items={selectedBill.items}
          subtotal={subtotal}
          discount={discount}
          discountType={discountType}
          taxableAmount={discountedSubtotal}
          taxes={[
            {
              name: `CGST@${taxRate / 2}%`,
              rate: taxRate / 2,
              taxable: discountedSubtotal,
              amount: cgst,
            },
            {
              name: `SGST@${taxRate / 2}%`,
              rate: taxRate / 2,
              taxable: discountedSubtotal,
              amount: sgst,
            },
          ]}
          total={total}
          amountInWords={amountInWords(total)}
          paymentMethod={selectedBill.payment_method}
          cashReceived={total}
          change={selectedBill.change}
        />
      </div>
    </div>
  );
});


// Print/Download Actions
const BillActions = ({ selectedBill, billRef }: { selectedBill: any, billRef: React.RefObject<HTMLDivElement> }) => {
  // Print handler
  const handlePrint = useReactToPrint({
    content: () => billRef.current,
    documentTitle: `Bill-${selectedBill.bill_number}`,
  } as any);
  // PDF Download handler
  const handleDownloadPDF = () => {
    const element = billRef.current;
    if (element) {
      html2pdf().from(element).set({
        margin: 0.2,
        filename: `Bill-${selectedBill.bill_number}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      }).save();
    }
  };
  return (
    <div className="flex gap-2 mb-4">
      <Button onClick={handlePrint} variant="outline" className="flex items-center gap-1">
        <Printer className="w-4 h-4" /> Print
      </Button>
      <Button onClick={handleDownloadPDF} variant="outline" className="flex items-center gap-1">
        <Download className="w-4 h-4" /> Download PDF
      </Button>
    </div>
  );
};

export default BillsPage; 