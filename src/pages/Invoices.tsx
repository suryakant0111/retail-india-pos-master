
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

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load invoices from localStorage
    try {
      const storedInvoices = localStorage.getItem('invoices');
      if (storedInvoices) {
        const parsedInvoices = JSON.parse(storedInvoices);
        // Convert string dates back to Date objects
        const processedInvoices = parsedInvoices.map((invoice: any) => ({
          ...invoice,
          createdAt: new Date(invoice.createdAt)
        }));
        
        setInvoices([...mockInvoices, ...processedInvoices]);
      } else {
        setInvoices([...mockInvoices]);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([...mockInvoices]);
    }
  }, []);
  
  // Filter invoices based on search term and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer && invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || invoice.paymentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const generateInvoicePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('RETAIL POS', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('123 Main Street, City', 105, 30, { align: 'center' });
    doc.text('Phone: 123-456-7890', 105, 35, { align: 'center' });
    
    // Add invoice details
    doc.setFontSize(12);
    doc.text(`Invoice: #${invoice.invoiceNumber}`, 14, 45);
    doc.text(`Date: ${invoice.createdAt.toLocaleString('en-IN')}`, 14, 50);
    
    if (invoice.customer) {
      doc.text(`Customer: ${invoice.customer.name}`, 14, 55);
      if (invoice.customer.phone) doc.text(`Phone: ${invoice.customer.phone}`, 14, 60);
    }
    
    // Create table with items
    const tableColumn = ["Item", "Price", "Qty", "Total"];
    const tableRows: any[] = [];
    
    invoice.items.forEach(item => {
      const itemData = [
        item.product.name,
        `₹${item.price.toFixed(2)}`,
        item.quantity,
        `₹${(item.price * item.quantity).toFixed(2)}`
      ];
      tableRows.push(itemData);
    });
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: invoice.customer ? 65 : 55,
      theme: 'grid',
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Add totals
    doc.text(`Subtotal: ₹${invoice.subtotal.toFixed(2)}`, 150, finalY, { align: 'right' });
    doc.text(`Tax: ₹${invoice.taxTotal.toFixed(2)}`, 150, finalY + 5, { align: 'right' });
    
    if (invoice.discountValue > 0) {
      const discountAmount = invoice.discountType === 'percentage' 
        ? (invoice.subtotal + invoice.taxTotal) * (invoice.discountValue / 100) 
        : invoice.discountValue;
      
      doc.text(`Discount: -₹${discountAmount.toFixed(2)}`, 150, finalY + 10, { align: 'right' });
      doc.text(`Total: ₹${invoice.total.toFixed(2)}`, 150, finalY + 15, { align: 'right' });
      doc.text(`Payment Method: ${invoice.paymentMethod.toUpperCase()}`, 150, finalY + 20, { align: 'right' });
    } else {
      doc.text(`Total: ₹${invoice.total.toFixed(2)}`, 150, finalY + 10, { align: 'right' });
      doc.text(`Payment Method: ${invoice.paymentMethod.toUpperCase()}`, 150, finalY + 15, { align: 'right' });
    }
    
    // Add thank you note
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 105, finalY + 30, { align: 'center' });
    
    // Save the PDF
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
