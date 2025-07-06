
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCards } from '@/components/dashboard/StatCards';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import * as XLSX from 'xlsx';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const { profile: currentProfile } = useProfile();
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchInvoices();
    fetchLowStockProducts();
    // Load sales target from localStorage
    const savedTarget = localStorage.getItem('salesTarget');
    if (savedTarget) {
      setSalesTarget(parseFloat(savedTarget));
    } else {
      setSalesTarget(10000); // Default value
      localStorage.setItem('salesTarget', '10000');
    }
  }, [profile?.shop_id]);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    if (!profile?.shop_id) return;
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', profile.shop_id)
      .order('createdAt', { ascending: false });
    if (error) {
      setError('Failed to load invoices');
      setInvoices([]);
      setLoading(false);
      return;
    }
    // Map date fields to Date objects
    const mappedInvoices = (data || []).map((inv: any) => ({
      ...inv,
      createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
      items: inv.items || [],
      customer: inv.customer || undefined,
    }));
    setInvoices(mappedInvoices);
    calculateSalesSummary(mappedInvoices);
    if (mappedInvoices.length > 0) {
      const total = mappedInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
      setAvgOrderValue(total / mappedInvoices.length);
    } else {
      setAvgOrderValue(0);
    }
    // generateWeeklySalesData(mappedInvoices); // Now handled by useEffect
    setLoading(false);
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
    const dailySales = todayInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const weeklySales = weekInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const monthlySales = monthInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);

    // Calculate top products
    const productSales: Record<string, { name: string, sales: number, quantity: number }> = {};
    monthInvoices.forEach(invoice => {
      (invoice.items || []).forEach((item: any) => {
        const productId = item.product?.id;
        if (!productId) return;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name,
            sales: 0,
            quantity: 0
          };
        }
        productSales[productId].sales += (item.price || 0) * (item.quantity || 0);
        productSales[productId].quantity += item.quantity || 0;
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
    setSalesSummary({
      dailySales,
      weeklySales,
      monthlySales,
      topProducts
    });
  };

  const generateWeeklySalesData = (invoiceData: any[]) => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      const dayInvoices = invoiceData.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate >= startOfDay && invoiceDate <= endOfDay;
      });
      const sales = dayInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
      data.push({
        name: dayName,
        sales: sales,
        target: salesTarget / 7
      });
    }
    setWeeklySalesData(data);
  };

  const fetchLowStockProducts = async () => {
    if (!profile?.shop_id) return;
    const { data, error } = await supabase.from('products').select('*').eq('shop_id', profile.shop_id);
    if (!error && data) {
      setLowStockProducts(data.filter((p: any) => p.minStock !== undefined && p.stock <= p.minStock));
    } else {
      setLowStockProducts([]);
    }
  };

  // Filter invoices based on filters
  const filteredInvoices = invoices.filter(inv => {
    let matches = true;
    if (filterStartDate) {
      matches = matches && new Date(inv.createdAt) >= new Date(filterStartDate);
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      matches = matches && new Date(inv.createdAt) <= end;
    }
    if (filterPaymentMethod !== 'all') {
      matches = matches && inv.paymentMethod === filterPaymentMethod;
    }
    if (filterProduct !== 'all') {
      matches = matches && inv.items?.some((item: any) => item.product?.name === filterProduct);
    }
    if (filterCategory !== 'all') {
      matches = matches && inv.items?.some((item: any) => item.product?.category === filterCategory);
    }
    return matches;
  });

  // Excel export function
  const handleDownloadExcel = () => {
    const data = filteredInvoices.flatMap(inv =>
      (inv.items || []).map((item: any) => ({
        'Invoice #': inv.invoiceNumber,
        'Date': inv.createdAt instanceof Date ? inv.createdAt.toLocaleString() : inv.createdAt,
        'Customer': inv.customer?.name || 'Walk-in Customer',
        'Product': item.product?.name || '',
        'Category': item.product?.category || '',
        'Quantity': item.quantity,
        'Unit Price': item.price,
        'Total': item.price * item.quantity,
        'Payment Method': inv.paymentMethod,
        'Status': inv.paymentStatus,
      }))
    );
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, 'sales-export.xlsx');
  };

  // Get recent invoices, limited to 5 most recent
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const displayInvoices = recentInvoices;

  const topProductsData = salesSummary.topProducts.map(product => ({
    name: product.name,
    sales: product.sales,
  }));

  const targetForm = useForm({
    defaultValues: {
      target: salesTarget.toString()
    }
  });

  const handleTargetSubmit = (data: any) => {
    const newTarget = parseFloat(data.target);
    setSalesTarget(newTarget);
    localStorage.setItem('salesTarget', newTarget.toString());
    toast({
      title: "Sales Target Updated",
      description: `Weekly sales target has been set to ₹${newTarget.toLocaleString('en-IN')}`,
      variant: "success",
    });
    setShowTargetDialog(false);
  };

  const targetProgress = Math.min(100, (salesSummary.weeklySales / salesTarget) * 100);

  // Update weekly sales data whenever invoices or salesTarget changes
  useEffect(() => {
    generateWeeklySalesData(invoices);
  }, [invoices, salesTarget]);

  // Get all unique products and categories from invoices
  const allProducts = Array.from(new Set(invoices.flatMap(inv => inv.items?.map((item: any) => item.product?.name).filter(Boolean) || [])));
  const allCategories = Array.from(new Set(invoices.flatMap(inv => inv.items?.map((item: any) => item.product?.category).filter(Boolean) || [])));

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
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Payment Method</label>
          <select value={filterPaymentMethod} onChange={e => setFilterPaymentMethod(e.target.value)} className="border p-2 rounded">
            <option value="all">All</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Product</label>
          <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="border p-2 rounded">
            <option value="all">All</option>
            {allProducts.map(product => (
              <option key={product} value={product}>{product}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border p-2 rounded">
            <option value="all">All</option>
            {allCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <button onClick={handleDownloadExcel} className="bg-blue-600 text-white px-4 py-2 rounded">Download Excel</button>
      </div>
      {/* Stock Alerts Section */}
      {lowStockProducts.length > 0 && (
        <Card className="mb-6 border-l-4 border-amber-500 bg-amber-50">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="text-amber-500" />
            <CardTitle className="text-amber-700">Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <Link to={`/products?highlight=${product.id}`} className="font-medium text-blue-700 hover:underline">
                    {product.name}
                  </Link>
                  <span className="text-amber-700">Stock: {product.stock} (Min: {product.minStock})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Stats Cards Section */}
      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading dashboard...</div>
      ) : error ? (
        <div className="py-10 text-center text-destructive">{error}</div>
      ) : (
        <>
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
                          <td>{invoice.createdAt instanceof Date ? invoice.createdAt.toLocaleDateString() : ''}</td>
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
        </>
      )}
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
