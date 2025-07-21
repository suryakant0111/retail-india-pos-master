import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { X, Search } from 'lucide-react';

const ProductSearchBar = ({
  searchTerm,
  setSearchTerm,
  category,
  setCategory,
  categories,
  onClearFilters
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center">
      <div className="relative w-full sm:w-64">
        <Input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-8"
        />
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        {searchTerm && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2.5 top-2.5 h-5 w-5"
            onClick={() => setSearchTerm('')}
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map(cat => (
            <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={onClearFilters} className="ml-0 sm:ml-2">
        Clear Filters
      </Button>
    </div>
  );
};

export default ProductSearchBar; 