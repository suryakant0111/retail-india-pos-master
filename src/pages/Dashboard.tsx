
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
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
  const [filterTransactionStartDate, setFilterTransactionStartDate] = useState('');
  const [filterTransactionEndDate, setFilterTransactionEndDate] = useState('');
  const [filterTransactionCity, setFilterTransactionCity] = useState('all');
  const [filterTransactionPaymentMethod, setFilterTransactionPaymentMethod] = useState('all');
  const [filterTransactionProduct, setFilterTransactionProduct] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(50);
  const [chartTimeFilter, setChartTimeFilter] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [chartCustomStartDate, setChartCustomStartDate] = useState('');
  const [chartCustomEndDate, setChartCustomEndDate] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchLowStockProducts();
    fetchInvoices();
    // Load sales target from Supabase
    async function fetchSalesTarget() {
      if (!profile?.shop_id) return;
      const { data, error } = await supabase
        .from('shop_settings')
        .select('sales_target')
        .eq('shop_id', profile.shop_id)
        .single();
      if (data && data.sales_target) {
        setSalesTarget(Number(data.sales_target));
      } else {
        setSalesTarget(10000); // Default value
      }
    }
    fetchSalesTarget();
  }, [profile?.shop_id]);

  // Recalculate sales summary when invoices or payments change
  useEffect(() => {
    if (invoices.length > 0 || payments.length > 0) {
      calculateSalesSummary(payments);
    }
  }, [invoices, payments]);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    if (!profile?.shop_id) return;
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('shop_id', profile.shop_id)
      .order('created_at', { ascending: false });
    if (error) {
      setError('Failed to load payments');
      setPayments([]);
      setLoading(false);
      return;
    }
    setPayments(data || []);
    calculateSalesSummary(data || []);
    setLoading(false);
  };

  const calculateSalesSummary = (paymentData: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    // Filter payments for different time periods
    const todayPayments = paymentData.filter(payment => {
      const paymentDate = new Date(payment.created_at);
      return paymentDate >= today;
    });
    
    const weekPayments = paymentData.filter(payment => {
      const paymentDate = new Date(payment.created_at);
      return paymentDate >= oneWeekAgo;
    });
    
    const monthPayments = paymentData.filter(payment => {
      const paymentDate = new Date(payment.created_at);
      return paymentDate >= oneMonthAgo;
    });

    // Calculate sales totals
    const dailySales = todayPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const weeklySales = weekPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const monthlySales = monthPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

    // Calculate top products from invoices
    const productSales = new Map();
    
    // Get invoices from the last month for top products calculation
    const oneMonthAgoDate = new Date();
    oneMonthAgoDate.setMonth(oneMonthAgoDate.getMonth() - 1);
    
    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.createdAt);
      if (invoiceDate >= oneMonthAgoDate) {
        (invoice.items || []).forEach((item: any) => {
          const productName = item.product?.name || 'Unknown Product';
          const currentSales = productSales.get(productName) || 0;
          const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
          productSales.set(productName, currentSales + itemTotal);
        });
      }
    });
    
    // Convert to array and sort by sales
    const topProducts = Array.from(productSales.entries())
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => Number(b.sales) - Number(a.sales))
      .slice(0, 5); // Top 5 products

    setSalesSummary({
      dailySales,
      weeklySales,
      monthlySales,
      topProducts
    });
  };

  // Update weekly sales data to use payments
  const generateWeeklySalesData = (paymentData: any[]) => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      const dayPayments = paymentData.filter(payment => {
        const paymentDate = new Date(payment.created_at);
        return paymentDate >= startOfDay && paymentDate <= endOfDay;
      });
      const sales = dayPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
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
    setInvoices(data || []);
    
    // Calculate average order value
    if (data && data.length > 0) {
      const totalSales = data.reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
      setAvgOrderValue(totalSales / data.length);
    }
    
    setLoading(false);
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
      matches = matches && inv.items?.some((item: any) => item.paymentMethod === filterPaymentMethod);
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

  // Get all invoices for filtering (no limit to show all transactions)
  const allInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayInvoices = allInvoices;

  // Debug: Log all available invoices and their dates
  useEffect(() => {
    if (displayInvoices.length > 0) {
      console.log('Available invoices for filtering:', displayInvoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        createdAt: inv.createdAt,
        parsedDate: new Date(inv.createdAt).toISOString(),
        localDate: getLocalDateString(inv.createdAt)
      })));
    }
  }, [displayInvoices]);

  const topProductsData = salesSummary.topProducts.map(product => ({
    name: product.name,
    sales: product.sales,
  }));

  const targetForm = useForm({
    defaultValues: {
      target: salesTarget.toString()
    }
  });

  const handleTargetSubmit = async (data: any) => {
    const newTarget = parseFloat(data.target);
    setSalesTarget(newTarget);
    // Save sales target to Supabase
    if (profile?.shop_id) {
      await supabase
        .from('shop_settings')
        .upsert([
          {
            shop_id: profile.shop_id,
            sales_target: newTarget
          }
        ], { onConflict: 'shop_id' });
    }
    toast({
      title: "Sales Target Updated",
      description: `Weekly sales target has been set to ₹${newTarget.toLocaleString('en-IN')}`,
      variant: "success",
    });
    setShowTargetDialog(false);
  };

  const targetProgress = Math.min(100, (salesSummary.weeklySales / salesTarget) * 100);

  // Update weekly sales data to use payments
  useEffect(() => {
    generateWeeklySalesData(payments);
  }, [payments, salesTarget]);

  // Get all unique products and categories from invoices
  const allProducts = Array.from(new Set(invoices.flatMap(inv => inv.items?.map((item: any) => item.product?.name).filter(Boolean) || [])));
  const allCategories = Array.from(new Set(invoices.flatMap(inv => inv.items?.map((item: any) => item.product?.category).filter(Boolean) || [])));

  // Get all unique cities from invoices
  const allCities = Array.from(new Set(invoices.map(inv => inv.customer?.city || inv.customer?.address || '').filter(Boolean)));
  // Get all unique products from invoices for the product filter
  const allTransactionProducts = Array.from(new Set(invoices.flatMap(inv => (inv.items || []).map((item: any) => item.product?.name).filter(Boolean))));

  // Helper to get YYYY-MM-DD from a date in local time
  const getLocalDateString = (date: string) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper to check if a date is within range
  const isDateInRange = (invoiceDate: string, startDate: string, endDate: string) => {
    // Handle different date formats
    const invoice = new Date(invoiceDate);
    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;
    
    // Debug logging
    console.log('Date comparison:', {
      invoiceDate: invoiceDate,
      invoiceParsed: invoice.toISOString(),
      startDate: startDate,
      startParsed: start?.toISOString(),
      endDate: endDate,
      endParsed: end?.toISOString(),
      isAfterStart: start ? invoice >= start : true,
      isBeforeEnd: end ? invoice <= end : true
    });
    
    if (start && invoice < start) return false;
    if (end && invoice > end) return false;
    return true;
  };

  // Filter recent transactions based on filters
  const filteredDisplayInvoices = displayInvoices.filter(inv => {
    let matches = true;
    
    // Date filtering with proper range checking
    if (filterTransactionStartDate || filterTransactionEndDate) {
      const inRange = isDateInRange(inv.createdAt, filterTransactionStartDate, filterTransactionEndDate);
      matches = matches && inRange;
      
      // Debug logging for date filtering
      if (filterTransactionStartDate || filterTransactionEndDate) {
        console.log('Date filtering:', {
          invoiceDate: inv.createdAt,
          startDate: filterTransactionStartDate,
          endDate: filterTransactionEndDate,
          inRange: inRange,
          invoiceNumber: inv.invoiceNumber
        });
      }
    }
    
    if (filterTransactionCity !== 'all') {
      matches = matches && ((inv.customer?.city || inv.customer?.address || '') === filterTransactionCity);
    }
    if (filterTransactionPaymentMethod !== 'all') {
      matches = matches && (inv.paymentMethod === filterTransactionPaymentMethod);
    }
    if (filterTransactionProduct !== 'all') {
      matches = matches && (inv.items || []).some((item: any) => item.product?.name === filterTransactionProduct);
    }
    return matches;
  });

  // Show individual transactions for chart with time-based filtering
  const salesTrendData = (() => {
    // Use ALL invoices for chart (not filtered ones)
    const allInvoices = invoices;
    
    // Filter transactions based on chart time filter
    let filteredChartInvoices = allInvoices;
    
    if (chartTimeFilter === 'today') {
      // Show only today's transactions
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      filteredChartInvoices = allInvoices.filter(inv => {
        const invoiceDateString = getLocalDateString(inv.createdAt);
        const isToday = invoiceDateString === todayString;
        
        console.log('Today filtering:', {
          invoiceDate: inv.createdAt,
          invoiceDateString,
          todayString,
          isToday,
          filter: chartTimeFilter
        });
        
        return isToday;
      });
    } else if (chartTimeFilter === 'custom') {
      // Custom date range filtering
      if (chartCustomStartDate || chartCustomEndDate) {
        filteredChartInvoices = allInvoices.filter(inv => {
          const invoiceDateString = getLocalDateString(inv.createdAt);
          let isInRange = true;
          
          if (chartCustomStartDate) {
            isInRange = isInRange && invoiceDateString >= chartCustomStartDate;
          }
          if (chartCustomEndDate) {
            isInRange = isInRange && invoiceDateString <= chartCustomEndDate;
          }
          
          console.log('Custom filtering:', {
            invoiceDate: inv.createdAt,
            invoiceDateString,
            startDate: chartCustomStartDate,
            endDate: chartCustomEndDate,
            isInRange,
            filter: chartTimeFilter
          });
          
          return isInRange;
        });
      }
    } else {
      // Week, Month, Year filtering
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (chartTimeFilter) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      // Convert to local date strings for proper comparison
      const cutoffDateString = cutoffDate.toISOString().split('T')[0];
      
      filteredChartInvoices = allInvoices.filter(inv => {
        const invoiceDateString = getLocalDateString(inv.createdAt);
        const isInRange = invoiceDateString >= cutoffDateString;
        
        console.log('Chart filtering:', {
          invoiceDate: inv.createdAt,
          invoiceDateString,
          cutoffDateString,
          isInRange,
          filter: chartTimeFilter
        });
        
        return isInRange;
      });
    }
    
    // For "today" filter, always show individual transactions
    if (chartTimeFilter === 'today') {
      return filteredChartInvoices
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((inv, index) => ({
          date: getLocalDateString(inv.createdAt),
          sales: Number(inv.total) || 0,
          formattedDate: new Date(inv.createdAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          invoiceNumber: inv.invoiceNumber,
          isAggregated: false
        }));
    }
    
    // For other filters, aggregate by day if we have many transactions
    if (filteredChartInvoices.length > 10) {
      const dailyAggregated = new Map();
      
      filteredChartInvoices.forEach(inv => {
        const dateKey = getLocalDateString(inv.createdAt);
        const currentTotal = dailyAggregated.get(dateKey) || 0;
        dailyAggregated.set(dateKey, currentTotal + (Number(inv.total) || 0));
      });
      
      // Convert to array and sort by date
      return Array.from(dailyAggregated.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, total]) => ({
          date,
          sales: total,
          formattedDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isAggregated: true
        }));
    } else {
      // For fewer transactions, show individual transactions
      return filteredChartInvoices
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((inv, index) => ({
          date: getLocalDateString(inv.createdAt),
          sales: Number(inv.total) || 0,
          formattedDate: new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          invoiceNumber: inv.invoiceNumber,
          isAggregated: false
        }));
    }
  })();

  // Debug: Log chart data
  useEffect(() => {
    console.log('Chart data:', salesTrendData);
    console.log('Filtered invoices count:', filteredDisplayInvoices.length);
    console.log('Chart time filter:', chartTimeFilter);
    console.log('Total invoices available:', displayInvoices.length);
  }, [salesTrendData, filteredDisplayInvoices.length, chartTimeFilter, displayInvoices.length]);

  // Add a function to clear all transaction filters
  const clearTransactionFilters = () => {
    setFilterTransactionStartDate('');
    setFilterTransactionEndDate('');
    setFilterTransactionCity('all');
    setFilterTransactionPaymentMethod('all');
    setFilterTransactionProduct('all');
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Pagination calculations
  const totalFilteredTransactions = filteredDisplayInvoices.length;
  const totalPages = Math.ceil(totalFilteredTransactions / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const paginatedTransactions = filteredDisplayInvoices.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTransactionStartDate, filterTransactionEndDate, filterTransactionCity, filterTransactionPaymentMethod, filterTransactionProduct]);

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
                   <Card className="col-span-full mb-6">
                     <CardHeader>
                       <div className="flex items-center justify-between">
                         <div>
                           <CardTitle>Sales Trend Analysis</CardTitle>
                           <CardDescription>
                             {salesTrendData.length > 0 
                               ? chartTimeFilter === 'today' 
                                 ? `Showing ${salesTrendData.length} transactions from today`
                                 : chartTimeFilter === 'custom'
                                 ? `Showing ${salesTrendData.length} transactions from custom date range`
                                 : salesTrendData[0]?.isAggregated
                                 ? `Showing ${salesTrendData.length} daily totals from last ${chartTimeFilter}${chartTimeFilter === 'week' || chartTimeFilter === 'month' || chartTimeFilter === 'year' ? 's' : ''}`
                                 : `Showing ${salesTrendData.length} transactions from last ${chartTimeFilter}${chartTimeFilter === 'week' || chartTimeFilter === 'month' || chartTimeFilter === 'year' ? 's' : ''}`
                               : 'No data available'
                             }
                           </CardDescription>
                         </div>
                         <div className="flex gap-1">
                           <Button
                             variant={chartTimeFilter === 'today' ? 'default' : 'outline'}
                             size="sm"
                             onClick={() => {
                               setChartTimeFilter('today');
                               console.log('Today filter clicked');
                             }}
                           >
                             Today ({salesTrendData.length})
                           </Button>
                           <Button
                             variant={chartTimeFilter === 'week' ? 'default' : 'outline'}
                             size="sm"
                             onClick={() => {
                               setChartTimeFilter('week');
                               console.log('Week filter clicked');
                             }}
                           >
                             Week ({salesTrendData.length})
                           </Button>
                           <Button
                             variant={chartTimeFilter === 'month' ? 'default' : 'outline'}
                             size="sm"
                             onClick={() => {
                               setChartTimeFilter('month');
                               console.log('Month filter clicked');
                             }}
                           >
                             Month ({salesTrendData.length})
                           </Button>
                           <Button
                             variant={chartTimeFilter === 'year' ? 'default' : 'outline'}
                             size="sm"
                             onClick={() => {
                               setChartTimeFilter('year');
                               console.log('Year filter clicked');
                             }}
                           >
                             Year ({salesTrendData.length})
                           </Button>
                         </div>
                         
                         {/* Custom Date Range Inputs - Always visible on left side */}
                         <div className="flex gap-2 mt-2">
                           <div>
                             <label className="block text-xs font-medium mb-1">Start Date</label>
                             <input 
                               type="date" 
                               value={chartCustomStartDate} 
                               onChange={e => {
                                 setChartCustomStartDate(e.target.value);
                                 setChartTimeFilter('custom');
                               }} 
                               className="border p-1 rounded text-xs"
                               placeholder="Start date"
                             />
                           </div>
                           <div>
                             <label className="block text-xs font-medium mb-1">End Date</label>
                             <input 
                               type="date" 
                               value={chartCustomEndDate} 
                               onChange={e => {
                                 setChartCustomEndDate(e.target.value);
                                 setChartTimeFilter('custom');
                               }} 
                               className="border p-1 rounded text-xs"
                               placeholder="End date"
                             />
                           </div>
                         </div>
                       </div>
                     </CardHeader>
                     <CardContent>
                       <div className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                           <LineChart
                             data={salesTrendData}
                             margin={{
                               top: 20,
                               left: 12,
                               right: 12,
                               bottom: 20,
                             }}
                           >
                             <CartesianGrid strokeDasharray="3 3" />
                             <XAxis
                               dataKey="formattedDate"
                               tickLine={false}
                               axisLine={false}
                               tickMargin={8}
                               fontSize={12}
                             />
                             <YAxis
                               tickFormatter={(value) => `₹${value / 1000}K`}
                               fontSize={12}
                             />
                             <Tooltip
                               formatter={(value) => new Intl.NumberFormat('en-IN', { 
                                 style: 'currency', 
                                 currency: 'INR', 
                                 maximumFractionDigits: 0 
                               }).format(Number(value))}
                             />
                             <Line
                               type="monotone"
                               dataKey="sales"
                               stroke="#2563eb"
                               strokeWidth={3}
                               dot={{
                                 fill: "#2563eb",
                                 r: 4,
                                 strokeWidth: 2,
                                 stroke: "white"
                               }}
                               activeDot={{
                                 r: 6,
                                 strokeWidth: 2,
                                 stroke: "white"
                               }}
                             />
                           </LineChart>
                         </ResponsiveContainer>
                       </div>
                     </CardContent>
                     <CardFooter className="flex-col items-start gap-2 text-sm">
                       <div className="flex gap-2 leading-none font-medium">
                         {salesTrendData.length > 1 ? (
                           <>
                             {(() => {
                               const firstValue = salesTrendData[0]?.sales || 0;
                               const lastValue = salesTrendData[salesTrendData.length - 1]?.sales || 0;
                               const change = lastValue - firstValue;
                               const percentage = firstValue > 0 ? ((change / firstValue) * 100) : 0;
                               return (
                                 <>
                                   {change >= 0 ? 'Trending up' : 'Trending down'} by {Math.abs(percentage).toFixed(1)}% this period
                                   <TrendingUp className={`h-4 w-4 ${change < 0 ? 'rotate-180' : ''}`} />
                                 </>
                               );
                             })()}
                           </>
                         ) : (
                           'No trend data available'
                         )}
                       </div>
                       <div className="text-muted-foreground leading-none">
                         {salesTrendData.length > 0 
                           ? chartTimeFilter === 'today'
                             ? 'Showing individual transaction amounts from today'
                             : chartTimeFilter === 'custom'
                             ? 'Showing individual transaction amounts from custom date range'
                             : salesTrendData[0]?.isAggregated
                             ? `Showing daily aggregated totals from last ${chartTimeFilter}${chartTimeFilter === 'week' || chartTimeFilter === 'month' || chartTimeFilter === 'year' ? 's' : ''}`
                             : `Showing individual transaction amounts from last ${chartTimeFilter}${chartTimeFilter === 'week' || chartTimeFilter === 'month' || chartTimeFilter === 'year' ? 's' : ''}`
                           : 'No data available'
                         }
                       </div>
                     </CardFooter>
                   </Card>
                                     {/* Debug Info */}
                   {filterTransactionStartDate || filterTransactionEndDate ? (
                     <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 mb-2">
                       <div className="text-xs text-yellow-800">
                         <strong>Debug Info:</strong> Filtering {displayInvoices.length} invoices. 
                         Start: {filterTransactionStartDate || 'None'}, 
                         End: {filterTransactionEndDate || 'None'}. 
                         Showing {filteredDisplayInvoices.length} results.
                       </div>
                     </div>
                   ) : null}
                   
                   {/* Chart Filter Info */}
                   <div className="p-2 bg-blue-50 border-l-4 border-blue-400 mb-2">
                     <div className="text-xs text-blue-800">
                       <strong>Chart Filter:</strong> {chartTimeFilter.toUpperCase()} - Showing {salesTrendData.length} transactions 
                       (from {invoices.length} total available)
                     </div>
                   </div>
                  
                  {/* Pagination Info */}
                  {totalFilteredTransactions > transactionsPerPage && (
                    <div className="p-2 bg-blue-50 border-l-4 border-blue-400 mb-2">
                      <div className="text-xs text-blue-800">
                        <strong>Pagination:</strong> Showing {startIndex + 1}-{Math.min(endIndex, totalFilteredTransactions)} of {totalFilteredTransactions} transactions 
                        (Page {currentPage} of {totalPages})
                      </div>
                    </div>
                  )}
                  
                  {/* Transaction Filters */}
                  <div className="flex flex-wrap gap-4 p-4 items-end bg-gray-50 border-b mb-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Start Date</label>
                      <input type="date" value={filterTransactionStartDate} onChange={e => setFilterTransactionStartDate(e.target.value)} className="border p-1 rounded text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">End Date</label>
                      <input type="date" value={filterTransactionEndDate} onChange={e => setFilterTransactionEndDate(e.target.value)} className="border p-1 rounded text-xs" />
                    </div>
                    <div className="flex flex-col justify-end">
                      <button
                        type="button"
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                        onClick={() => {
                          const today = new Date();
                          const yyyy = today.getFullYear();
                          const mm = String(today.getMonth() + 1).padStart(2, '0');
                          const dd = String(today.getDate()).padStart(2, '0');
                          const todayStr = `${yyyy}-${mm}-${dd}`;
                          setFilterTransactionStartDate(todayStr);
                          setFilterTransactionEndDate(todayStr);
                        }}
                      >
                        Today
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">City</label>
                      <select value={filterTransactionCity} onChange={e => setFilterTransactionCity(e.target.value)} className="border p-1 rounded text-xs">
                        <option value="all">All</option>
                        {allCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Payment</label>
                      <select value={filterTransactionPaymentMethod} onChange={e => setFilterTransactionPaymentMethod(e.target.value)} className="border p-1 rounded text-xs">
                        <option value="all">All</option>
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Product</label>
                      <select value={filterTransactionProduct} onChange={e => setFilterTransactionProduct(e.target.value)} className="border p-1 rounded text-xs">
                        <option value="all">All</option>
                        {allTransactionProducts.map(product => (
                          <option key={product} value={product}>{product}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 flex justify-end items-end">
                      <button
                        type="button"
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs mr-2"
                        onClick={() => {
                          // Download filteredDisplayInvoices as Excel
                          const data = filteredDisplayInvoices.flatMap(inv =>
                            (inv.items || []).map((item: any) => ({
                              'Invoice #': inv.invoiceNumber,
                              'Date': inv.createdAt ? new Date(inv.createdAt).toLocaleString() : '',
                              'Customer': inv.customer?.name || 'Walk-in Customer',
                              'City': inv.customer?.city || inv.customer?.address || '-',
                              'Product': item.product?.name || '',
                              'Category': item.product?.category || '',
                              'Quantity': item.quantity,
                              'Unit Price': item.price,
                              'Total': item.price * item.quantity,
                              'Payment Method': inv.paymentMethod,
                              'Status': inv.paymentStatus,
                            })
                          )
                          );
                          const ws = XLSX.utils.json_to_sheet(data);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
                          XLSX.writeFile(wb, 'transactions-export.xlsx');
                        }}
                      >
                        Download Excel
                      </button>
                      <button
                        type="button"
                        className="bg-gray-300 text-gray-800 px-3 py-1 rounded text-xs"
                        onClick={clearTransactionFilters}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                  <table className="w-full pos-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>City</th>
                        <th>Product</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((invoice) => (
                        <tr key={invoice.id}>
                          <td>{invoice.invoiceNumber}</td>
                          <td>{
                            invoice.createdAt
                              ? new Date(invoice.createdAt).toLocaleDateString()
                              : '-'
                          }</td>
                          <td>{invoice.customer?.name || 'Walk-in Customer'}</td>
                          <td>{invoice.customer?.city || invoice.customer?.address || '-'}</td>
                          <td>
                            {(invoice.items || []).map((item: any, idx: number) => (
                              <span key={idx} className="block whitespace-nowrap">
                                {item.product?.name || '-'}
                                {item.quantity !== undefined && (
                                  <span className="ml-1 text-xs text-muted-foreground">x{item.quantity}</span>
                                )}
                                {item.price !== undefined && (
                                  <span className="ml-1 text-xs text-muted-foreground">@ ₹{item.price}</span>
                                )}
                              </span>
                            ))}
                          </td>
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
                    {paginatedTransactions.length > 0 && (
                      <tfoot>
                        <tr>
                          <td colSpan={5} className="text-right font-semibold">
                            {totalPages > 1 ? 'Total (This Page)' : 'Total'}
                          </td>
                          <td className="font-bold">
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                            }).format(
                              paginatedTransactions.reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0)
                            )}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                        {totalPages > 1 && (
                          <tr>
                            <td colSpan={5} className="text-right font-semibold">Total (All Filtered)</td>
                            <td className="font-bold">
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                              }).format(
                                filteredDisplayInvoices.reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0)
                              )}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        )}
                      </tfoot>
                    )}
                  </table>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                          Showing {startIndex + 1} to {Math.min(endIndex, totalFilteredTransactions)} of {totalFilteredTransactions} results
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          First
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  )}
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
