
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useProfile } from '@/hooks/useProfile';

interface Transaction {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  customer: string;
  createdAt: Date;
}

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();
  const { profile } = useProfile();

  useEffect(() => {
    // Load transactions from localStorage
    try {
      const storedTransactions = localStorage.getItem('transactions');
      if (storedTransactions) {
        const parsed = JSON.parse(storedTransactions);
        // Filter by shop_id if available
        const filteredByShop = profile?.shop_id
          ? parsed.filter((tx: any) => tx.shop_id === profile.shop_id)
          : parsed;
        // Convert string dates back to Date objects
        const processedTransactions = filteredByShop.map((tx: any) => ({
          ...tx,
          createdAt: new Date(tx.createdAt)
        }));
        setTransactions(processedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    }
  }, [profile?.shop_id]);
  
  // Filter transactions based on search term and payment method
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = methodFilter === 'all' || tx.paymentMethod === methodFilter;
    
    return matchesSearch && matchesMethod;
  });
  
  // Sort transactions by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  
  // Calculate summary statistics
  const totalValue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const cashValue = transactions
    .filter(tx => tx.paymentMethod === 'cash')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const upiValue = transactions
    .filter(tx => tx.paymentMethod === 'upi')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const cardValue = transactions
    .filter(tx => tx.paymentMethod === 'card')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">Today: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="grid gap-6 mb-6 md:grid-cols-4">
        <Card>
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(totalValue)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cash Payments</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(cashValue)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">UPI Payments</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(upiValue)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Card Payments</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(cardValue)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Complete record of sales transactions</CardDescription>
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
              <Select value={methodFilter} onValueChange={setMethodFilter}>
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
                <TableHead>Transaction Date</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.createdAt.toLocaleString()}</TableCell>
                    <TableCell>{transaction.invoiceNumber}</TableCell>
                    <TableCell>{transaction.customer}</TableCell>
                    <TableCell className="capitalize">{transaction.paymentMethod}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      }).format(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
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
