
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCards } from '@/components/dashboard/StatCards';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { mockSalesSummary, mockInvoices } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState({
    dailySales: 0,
    weeklySales: 0,
    monthlySales: 0,
    topProducts: [] as any[]
  });
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [weeklySalesData, setWeeklySalesData] = useState<any[]>([]);
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [salesTarget, setSalesTarget] = useState<number>(0);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadData();
    // Load sales target from localStorage
    const savedTarget = localStorage.getItem('salesTarget');
    if (savedTarget) {
      setSalesTarget(parseFloat(savedTarget));
    } else {
      setSalesTarget(10000); // Default value
      localStorage.setItem('salesTarget', '10000');
    }
  }, []);

  const loadData = () => {
    try {
      // Load invoices from localStorage
      const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const allInvoices = [...mockInvoices, ...storedInvoices];
      setInvoices(allInvoices);

      // Calculate sales summaries
      calculateSalesSummary(allInvoices);
      
      // Calculate average order value
      if (allInvoices.length > 0) {
        const total = allInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
        setAvgOrderValue(total / allInvoices.length);
      } else {
        setAvgOrderValue(0);
      }
      
      // Generate weekly sales data
      generateWeeklySalesData(allInvoices);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setInvoices([]);
    }
  };

  const calculateSalesSummary = (invoiceData: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    // Filter invoices for different time periods
    const todayInvoices = invoiceData.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt);
      return invoiceDate >= today;
    });
    
    const weekInvoices = invoiceData.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt);
      return invoiceDate >= oneWeekAgo;
    });
    
    const monthInvoices = invoiceData.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt);
      return invoiceDate >= oneMonthAgo;
    });

    // Calculate sales totals
    const dailySales = todayInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const weeklySales = weekInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const monthlySales = monthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

    // Calculate top products
    const productSales: Record<string, { name: string, sales: number, quantity: number }> = {};
    
    monthInvoices.forEach(invoice => {
      invoice.items.forEach((item: any) => {
        const productId = item.product.id;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name,
            sales: 0,
            quantity: 0
          };
        }
        productSales[productId].sales += item.price * item.quantity;
        productSales[productId].quantity += item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map(product => ({
        name: product.name,
        sales: product.sales,
        quantity: product.quantity
      }));

    // If we have no data yet, use mock data
    setSalesSummary({
      dailySales: dailySales || mockSalesSummary.dailySales,
      weeklySales: weeklySales || mockSalesSummary.weeklySales,
      monthlySales: monthlySales || mockSalesSummary.monthlySales,
      topProducts: topProducts.length > 0 ? topProducts : mockSalesSummary.topProducts
    });
  };

  const generateWeeklySalesData = (invoiceData: any[]) => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = [];
    
    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      // Start and end of the day
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      // Find invoices for this day
      const dayInvoices = invoiceData.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate >= startOfDay && invoiceDate <= endOfDay;
      });
      
      // Calculate total sales for the day
      const sales = dayInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
      
      data.push({
        name: dayName,
        sales: sales || Math.random() * 10000 + 5000, // Fallback to random if no data
        target: salesTarget / 7 // Daily target (weekly target divided by 7)
      });
    }
    
    setWeeklySalesData(data);
  };
  
  // Get recent invoices, limited to 5 most recent
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  // If no real data, use mock data
  const displayInvoices = recentInvoices.length > 0 ? recentInvoices : mockInvoices;
  
  // Get top products data for display
  const topProductsData = salesSummary.topProducts.map(product => ({
    name: product.name,
    sales: product.sales,
  }));

  // Form for updating sales target
  const targetForm = useForm({
    defaultValues: {
      target: salesTarget.toString()
    }
  });

  const handleTargetSubmit = (data: any) => {
    const newTarget = parseFloat(data.target);
    setSalesTarget(newTarget);
    localStorage.setItem('salesTarget', newTarget.toString());
    
    // Regenerate sales data with new target
    generateWeeklySalesData(invoices);
    
    toast({
      title: "Sales Target Updated",
      description: `Weekly sales target has been set to ₹${newTarget.toLocaleString('en-IN')}`,
      variant: "success",
    });
    
    setShowTargetDialog(false);
  };

  // Calculate progress towards target
  const targetProgress = Math.min(100, (salesSummary.weeklySales / salesTarget) * 100);
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {isAdmin && (
          <Button onClick={() => setShowTargetDialog(true)} className="mt-4 md:mt-0">
            Set Sales Target
          </Button>
        )}
      </div>
      
      {/* Stats Cards Section */}
      <StatCards
        dailySales={salesSummary.dailySales}
        weeklySales={salesSummary.weeklySales}
        monthlySales={salesSummary.monthlySales}
        avgOrderValue={avgOrderValue}
      />
      
      {/* Target Progress */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Weekly Sales Target</CardTitle>
              <CardDescription>Progress towards weekly goal</CardDescription>
            </div>
            <div className="text-2xl font-bold">
              {targetProgress.toFixed(1)}%
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <div>₹{salesSummary.weeklySales.toLocaleString('en-IN')}</div>
              <div>₹{salesTarget.toLocaleString('en-IN')}</div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${targetProgress >= 100 ? 'bg-green-500' : targetProgress > 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                style={{ width: `${targetProgress}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 mt-6 grid-cols-1 lg:grid-cols-3">
        {/* Weekly Sales Chart */}
        <div className="lg:col-span-2">
          <SalesChart
            title="Weekly Sales"
            description="Sales performance for the last 7 days"
            data={weeklySalesData}
          />
        </div>
        
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProductsData.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-pos-${index === 0 ? 'blue' : index === 1 ? 'green' : index === 2 ? 'purple' : 'yellow'}/20 text-pos-${index === 0 ? 'blue' : index === 1 ? 'green' : index === 2 ? 'purple' : 'yellow'}`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(product.sales)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Transactions Section */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your recent sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full pos-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {displayInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.invoiceNumber}</td>
                      <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                      <td>{invoice.customer?.name || 'Walk-in Customer'}</td>
                      <td>
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                        }).format(invoice.total)}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.paymentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="capitalize">{invoice.paymentMethod || 'Cash'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Set Target Dialog */}
      <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Weekly Sales Target</DialogTitle>
          </DialogHeader>
          <Form {...targetForm}>
            <form onSubmit={targetForm.handleSubmit(handleTargetSubmit)} className="space-y-4">
              <FormField
                control={targetForm.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly Sales Target (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter target amount" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Set Target</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
