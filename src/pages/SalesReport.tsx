import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesChart } from '@/components/dashboard/SalesChart';

interface Invoice {
  id: string;
  total: number;
  createdAt: string;
}

const SalesReport: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, total, createdAt');
      if (!error && data) {
        setInvoices(data);
      }
      setLoading(false);
    };
    fetchInvoices();
  }, []);

  // Calculate total sales and sales count
  const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const salesCount = invoices.length;

  // Prepare data for chart (sales by date)
  const salesByDate: { [date: string]: number } = {};
  invoices.forEach(inv => {
    const date = inv.createdAt?.slice(0, 10);
    if (date) {
      salesByDate[date] = (salesByDate[date] || 0) + (inv.total || 0);
    }
  });
  const chartData = Object.entries(salesByDate).map(([date, total]) => ({ name: date, sales: total }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sales Report</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalSales.toLocaleString('en-IN')}</div>
              <div className="text-muted-foreground mt-1">Total revenue from all sales</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Number of Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesCount}</div>
              <div className="text-muted-foreground mt-1">Total number of invoices</div>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Sales Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={chartData} title="Sales by Date" description="Total sales per day" />
          </CardContent>
        </Card>
      </div>
      {/* Placeholder for top products, best customers, etc. */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Top Products (Coming Soon)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">This section will show your best-selling products.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesReport; 