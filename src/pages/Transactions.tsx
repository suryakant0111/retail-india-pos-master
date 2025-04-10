
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockInvoices } from '@/data/mockData';
import { Search, Calendar, ArrowDownUp, PieChart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const { toast } = useToast();
  
  // Generate transaction data from invoices
  const transactions = mockInvoices.map(invoice => ({
    id: invoice.id,
    date: invoice.createdAt,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.total,
    paymentMethod: invoice.paymentMethod,
    customer: invoice.customer ? invoice.customer.name : 'Walk-in Customer',
    status: invoice.paymentStatus
  }));
  
  // Filter transactions based on search term and payment method
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPaymentMethod = paymentMethod === 'all' || transaction.paymentMethod === paymentMethod;
    
    return matchesSearch && matchesPaymentMethod;
  });
  
  const handleViewTransaction = (id: string) => {
    toast({
      title: "View Transaction",
      description: `Opening transaction details for ID: ${id}`,
      variant: "default",
    });
  };
  
  // Calculate transaction statistics
  const totalTransactions = filteredTransactions.length;
  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const cashTransactions = filteredTransactions.filter(t => t.paymentMethod === 'cash').length;
  const upiTransactions = filteredTransactions.filter(t => t.paymentMethod === 'upi').length;
  const cardTransactions = filteredTransactions.filter(t => t.paymentMethod === 'card').length;
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">Today: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
      
      {/* Transaction Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <h3 className="text-2xl font-bold mt-1">{totalTransactions}</h3>
              </div>
              <ArrowDownUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <h3 className="text-2xl font-bold mt-1">₹{totalAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</h3>
              </div>
              <PieChart className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payment Methods</p>
                <div className="mt-2 space-y-1">
                  <div className="text-sm">Cash: {cashTransactions}</div>
                  <div className="text-sm">UPI: {upiTransactions}</div>
                  <div className="text-sm">Card: {cardTransactions}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Average Transaction</p>
                <h3 className="text-2xl font-bold mt-1">
                  ₹{(totalAmount / (totalTransactions || 1)).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View all payment transactions</CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
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
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Payment Method</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.invoiceNumber}</TableCell>
                    <TableCell>{transaction.customer}</TableCell>
                    <TableCell>{transaction.date.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">₹{transaction.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</TableCell>
                    <TableCell className="text-right capitalize">{transaction.paymentMethod}</TableCell>
                    <TableCell className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.status === 'paid' ? 'bg-green-100 text-green-800' : 
                        transaction.status === 'partial' ? 'bg-amber-100 text-amber-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewTransaction(transaction.id)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <p className="text-muted-foreground">No transactions found</p>
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

export default Transactions;
