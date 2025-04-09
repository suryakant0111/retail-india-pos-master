
import React from 'react';
import { BarChart, PieChart, LineChart, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon,
  description,
  trend,
  color
}) => {
  // Format currency if it's a number
  const formattedValue = typeof value === 'number' 
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    : value;

  return (
    <Card className={cn("overflow-hidden", `border-l-4 border-${color}`)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{formattedValue}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className={`flex items-center text-sm mt-2 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                <span>{trend.positive ? '↑' : '↓'} {trend.value}%</span>
                <span className="ml-1">{trend.positive ? 'increase' : 'decrease'}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}/10 text-${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface StatCardsProps {
  dailySales: number;
  weeklySales: number;
  monthlySales: number;
  avgOrderValue: number;
}

export const StatCards: React.FC<StatCardsProps> = ({
  dailySales,
  weeklySales,
  monthlySales,
  avgOrderValue
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Today's Sales"
        value={dailySales}
        icon={<IndianRupee size={20} />}
        color="pos-green"
        trend={{ value: 12, positive: true }}
      />
      <StatCard
        title="Weekly Sales"
        value={weeklySales}
        icon={<BarChart size={20} />}
        color="pos-blue"
        trend={{ value: 8, positive: true }}
      />
      <StatCard
        title="Monthly Sales"
        value={monthlySales}
        icon={<LineChart size={20} />}
        color="pos-purple"
        trend={{ value: 5, positive: true }}
      />
      <StatCard
        title="Avg. Order Value"
        value={avgOrderValue}
        icon={<PieChart size={20} />}
        color="pos-yellow"
        description="Per transaction"
      />
    </div>
  );
};
