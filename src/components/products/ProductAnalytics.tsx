import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Package, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';
import { Product } from '@/types';

interface ProductAnalyticsProps {
  products: Product[];
}

export const ProductAnalytics: React.FC<ProductAnalyticsProps> = ({ products }) => {
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.minStock && p.stock <= p.minStock).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const avgPrice = totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0;
  
  const categories = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topCategories = Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const stockUtilization = totalProducts > 0 ? ((totalProducts - outOfStock) / totalProducts) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            {activeProducts} active, {totalProducts - activeProducts} inactive
          </p>
        </CardContent>
      </Card>

      {/* Total Inventory Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{totalValue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-muted-foreground">
            Avg: ₹{avgPrice.toFixed(2)} per item
          </p>
        </CardContent>
      </Card>

      {/* Stock Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Status</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>In Stock</span>
              <span className="text-green-600">{totalProducts - outOfStock}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Out of Stock</span>
              <span className="text-red-600">{outOfStock}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Low Stock</span>
              <span className="text-amber-600">{lowStock}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Utilization */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Utilization</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stockUtilization.toFixed(1)}%</div>
          <Progress value={stockUtilization} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {totalProducts - outOfStock} of {totalProducts} products in stock
          </p>
        </CardContent>
      </Card>
    </div>
  );
}; 