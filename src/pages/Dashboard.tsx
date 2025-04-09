
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCards } from '@/components/dashboard/StatCards';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { mockSalesSummary, mockInvoices } from '@/data/mockData';

// Calculate average order value
const avgOrderValue = mockInvoices.length > 0
  ? mockInvoices.reduce((sum, invoice) => sum + invoice.total, 0) / mockInvoices.length
  : 0;

const Dashboard = () => {
  // Sample sales data by weekday for the last week
  const weeklySalesData = [
    { name: 'Monday', sales: 12500, target: 10000 },
    { name: 'Tuesday', sales: 8300, target: 10000 },
    { name: 'Wednesday', sales: 9800, target: 10000 },
    { name: 'Thursday', sales: 15200, target: 10000 },
    { name: 'Friday', sales: 22800, target: 10000 },
    { name: 'Saturday', sales: 28000, target: 10000 },
    { name: 'Sunday', sales: 18400, target: 10000 },
  ];
  
  // Top selling products
  const topProductsData = mockSalesSummary.topProducts.map(product => ({
    name: product.name,
    sales: product.sales,
  }));
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats Cards Section */}
      <StatCards
        dailySales={mockSalesSummary.dailySales}
        weeklySales={mockSalesSummary.weeklySales}
        monthlySales={mockSalesSummary.monthlySales}
        avgOrderValue={avgOrderValue}
      />
      
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
                  </tr>
                </thead>
                <tbody>
                  {mockInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.invoiceNumber}</td>
                      <td>{invoice.createdAt.toLocaleDateString()}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
