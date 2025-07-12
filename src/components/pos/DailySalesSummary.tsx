
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

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
  
  const { profile } = useProfile();

  // Recalculate sales when profile.shop_id changes or when a transaction is added
  useEffect(() => {
    loadDailySales();
    // Listen for custom event to refresh summary after transaction
    const handler = () => loadDailySales();
    window.addEventListener('transactionAdded', handler);
    return () => {
      window.removeEventListener('transactionAdded', handler);
    };
  }, [profile?.shop_id]);

  const loadDailySales = async () => {
    try {
      if (!profile?.shop_id) return;
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      // Fetch payments from Supabase for today and this shop
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());
      if (error) {
        throw error;
      }
      const todayTransactions = data || [];
      // Calculate totals
      const totalAmount = todayTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
      const transactionCount = todayTransactions.length;
      // Calculate by payment method
      const cashSales = todayTransactions
        .filter((tx: any) => tx.method === 'cash')
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
      const upiSales = todayTransactions
        .filter((tx: any) => tx.method === 'upi')
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
      const cardSales = todayTransactions
        .filter((tx: any) => tx.method === 'card')
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
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
