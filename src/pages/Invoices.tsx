
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockInvoices } from '@/data/mockData';
import { Search, Eye, Download, Calendar, FileDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Invoice } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useProfile();
  // Business/shop details state
  const [businessSettings, setBusinessSettings] = useState({
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
    fetchBusinessSettings();
  }, [profile?.shop_id]);

  const fetchInvoices = async () => {
    setLoading(true);
    if (!profile?.shop_id) return;
    const { data, error } = await supabase.from('invoices').select('*').eq('shop_id', profile.shop_id);
    if (error) {
      console.error('Error fetching invoices:', error);
    } else if (data) {
      setInvoices(data.map(inv => ({ ...inv, createdAt: new Date(inv.createdAt) })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, [profile?.shop_id]);
  
  // Filter invoices based on search term and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice.customer && invoice.customer.name && invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || invoice.paymentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Helper: Amount in words (simple, can be improved)
  const amountInWords = (amount: number): string => {
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
  };

  const generateInvoicePDF = (invoice: Invoice) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 40;
    // Business Header
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
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 40, y + 18);
    doc.text(`Date: ${invoice.createdAt.toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })}`, 40, y + 36);
    let customerY = y + 18;
    if (invoice.customer) {
      doc.text(`Customer: ${invoice.customer.name}`, pageWidth - 220, customerY);
      customerY += 18;
      if (invoice.customer.phone) doc.text(`Phone: ${invoice.customer.phone}`, pageWidth - 220, customerY);
      if (invoice.customer.email) doc.text(`Email: ${invoice.customer.email}`, pageWidth - 220, customerY + 18);
    }
    y += 54;
    doc.line(40, y, pageWidth - 40, y);
    y += 18;
    // Items Table
    const tableColumn = ["#", "Item Description", "Price", "Qty", "HSN", "Tax", "Amount"];
    const tableRows: any[] = [];
    invoice.items.forEach((item, index) => {
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
    doc.text(`Subtotal: ₹${invoice.subtotal.toFixed(2)}`, 40, finalY);
    finalY += 14;
    const sgst = invoice.taxTotal / 2;
    const cgst = invoice.taxTotal / 2;
    doc.text(`SGST (${invoice.items.length > 0 ? (invoice.items[0].product.taxRate || 0) / 2 : 0}%): ₹${sgst.toFixed(2)}`, 40, finalY);
    finalY += 14;
    doc.text(`CGST (${invoice.items.length > 0 ? (invoice.items[0].product.taxRate || 0) / 2 : 0}%): ₹${cgst.toFixed(2)}`, 40, finalY);
    finalY += 14;
    if (invoice.discountValue > 0) {
      const discountAmount = invoice.discountType === 'percentage'
        ? (invoice.subtotal + invoice.taxTotal) * (invoice.discountValue / 100)
        : invoice.discountValue;
      doc.text(`Discount${invoice.discountType === 'percentage' ? ` (${invoice.discountValue}%)` : ''}: -₹${discountAmount.toFixed(2)}`, 40, finalY);
      finalY += 14;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ₹${invoice.total.toFixed(2)}`, 40, finalY);
    finalY += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Amount in words: ${amountInWords(invoice.total)}`, 40, finalY);
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
    doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
  };
  
  const handleViewInvoice = (invoice: Invoice) => {
    // In a real app, this would open a detailed view
    toast({
      title: "View Invoice",
      description: `Viewing details for invoice #${invoice.invoiceNumber}`,
      variant: "default",
    });
  };
  
  const handleDownloadInvoice = (invoice: Invoice) => {
    generateInvoicePDF(invoice);
    
    toast({
      title: "Invoice Downloaded",
      description: `Invoice #${invoice.invoiceNumber} has been downloaded as PDF`,
      variant: "default",
    });
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">Today: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>View and download invoice records</CardDescription>
            </div>
            <Button onClick={fetchInvoices} disabled={loading} variant="outline">
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partially Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Payment Method</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customer ? invoice.customer.name : 'Walk-in Customer'}</TableCell>
                    <TableCell>{invoice.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">₹{invoice.total.toLocaleString('en-IN', {maximumFractionDigits: 2})}</TableCell>
                    <TableCell className="text-right capitalize">{invoice.paymentMethod}</TableCell>
                    <TableCell className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                        invoice.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(invoice)}>
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <p className="text-muted-foreground">No invoices found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;
