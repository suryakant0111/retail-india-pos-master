
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Barcode } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';

interface ProductSearchProps {
  products: Product[];
  onSearch: (term: string) => void;
  searchTerm: string;
  category: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  products,
  onSearch,
  searchTerm,
  category,
  onCategoryChange,
  categories
}) => {
  const [barcodeScannerMode, setBarcodeScannerMode] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState('');
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (barcodeScannerMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [barcodeScannerMode]);
  
  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcodeValue(e.target.value);
  };
  
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeValue) {
      e.preventDefault();
      processBarcodeInput();
    }
  };
  
  const processBarcodeInput = () => {
    if (!barcodeValue.trim()) return;
    
    const product = products.find(p => p.barcode === barcodeValue.trim());
    
    if (product) {
      addItem(product, 1);
      setBarcodeValue('');
      toast({
        title: "Product Added",
        description: `${product.name} added to cart via barcode`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode ${barcodeValue}`,
        variant: "destructive",
      });
    }
    
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };
  
  return (
    <>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[150px]">
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
        
        <Button 
          variant={barcodeScannerMode ? "default" : "outline"} 
          size="icon" 
          onClick={() => setBarcodeScannerMode(!barcodeScannerMode)}
          title="Toggle barcode scanner"
        >
          <Barcode className="h-4 w-4" />
        </Button>
      </div>
      
      {barcodeScannerMode && (
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={barcodeInputRef}
              placeholder="Scan barcode..."
              className="pl-9"
              value={barcodeValue}
              onChange={handleBarcodeInput}
              onKeyDown={handleBarcodeKeyDown}
              autoFocus
            />
          </div>
          <Button onClick={processBarcodeInput} disabled={!barcodeValue.trim()}>
            Add Item
          </Button>
        </div>
      )}
    </>
  );
};
