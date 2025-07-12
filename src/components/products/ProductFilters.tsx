import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  stockFilter: string;
  onStockFilterChange: (filter: string) => void;
  dateFilter: Date | undefined;
  onDateFilterChange: (date: Date | undefined) => void;
  onClearFilters: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  priceRange,
  onPriceRangeChange,
  stockFilter,
  onStockFilterChange,
  dateFilter,
  onDateFilterChange,
  onClearFilters
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const hasActiveFilters = searchTerm || category !== 'all' || priceRange[0] > 0 || priceRange[1] < 10000 || stockFilter !== 'all' || dateFilter;

  return (
    <div className="space-y-4">
      {/* Basic Search and Category */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Advanced
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
          {/* Price Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Price Range (₹)</label>
            <div className="px-2">
              <Slider
                value={priceRange}
                onValueChange={onPriceRangeChange}
                max={10000}
                step={100}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>
          </div>

          {/* Stock Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Stock Status</label>
            <Select value={stockFilter} onValueChange={onStockFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter - Disabled since createdAt column doesn't exist */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Added Date</label>
            <Button variant="outline" className="w-full justify-start text-left font-normal" disabled>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Not Available
            </Button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchTerm}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onSearchChange('')} />
            </Badge>
          )}
          {category !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Category: {category}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onCategoryChange('all')} />
            </Badge>
          )}
          {(priceRange[0] > 0 || priceRange[1] < 10000) && (
            <Badge variant="secondary" className="gap-1">
              Price: ₹{priceRange[0]} - ₹{priceRange[1]}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onPriceRangeChange([0, 10000])} />
            </Badge>
          )}
          {stockFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Stock: {stockFilter.replace('-', ' ')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onStockFilterChange('all')} />
            </Badge>
          )}
          {dateFilter && (
            <Badge variant="secondary" className="gap-1">
              Date: {format(dateFilter, "MMM dd")}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onDateFilterChange(undefined)} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}; 