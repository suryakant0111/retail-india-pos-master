
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DailySalesSummary: React.FC = () => {
  const [todaySales, setTodaySales] = useState<{
    totalAmount: number;
    transactionCount: number;
    cashSales: number;
    upiSales: number;
    cardSales: number;
  }>({
    totalAmount: 0,
    transactionCount: 0,
    cashSales: 0,
    upiSales: 0,
    cardSales: 0
  });
  
  useEffect(() => {
    loadDailySales();
  }, []);
  
  const loadDailySales = () => {
    try {
      // Load transactions from localStorage
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      
      // Filter for today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTransactions = transactions.filter((tx: any) => {
        const txDate = new Date(tx.createdAt);
        txDate.setHours(0, 0, 0, 0);
        return txDate.getTime() === today.getTime();
      });
      
      // Calculate totals
      const totalAmount = todayTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
      const transactionCount = todayTransactions.length;
      
      // Calculate by payment method
      const cashSales = todayTransactions
        .filter((tx: any) => tx.paymentMethod === 'cash')
        .reduce((sum: number, tx: any) => sum + tx.amount, 0);
        
      const upiSales = todayTransactions
        .filter((tx: any) => tx.paymentMethod === 'upi')
        .reduce((sum: number, tx: any) => sum + tx.amount, 0);
        
      const cardSales = todayTransactions
        .filter((tx: any) => tx.paymentMethod === 'card')
        .reduce((sum: number, tx: any) => sum + tx.amount, 0);
      
      setTodaySales({
        totalAmount,
        transactionCount,
        cashSales,
        upiSales,
        cardSales
      });
    } catch (error) {
      console.error('Error loading daily sales summary:', error);
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Today's Sales Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold">
              ₹{todaySales.totalAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Transactions</p>
            <p className="text-xl font-bold">{todaySales.transactionCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cash</p>
            <p className="text-xl font-bold">
              ₹{todaySales.cashSales.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">UPI</p>
            <p className="text-xl font-bold">
              ₹{todaySales.upiSales.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Card</p>
            <p className="text-xl font-bold">
              ₹{todaySales.cardSales.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
