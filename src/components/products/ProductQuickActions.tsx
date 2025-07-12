import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scan, Copy, Plus, Camera } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generateNextBarcode } from '@/lib/barcode-utils';

interface ProductQuickActionsProps {
  onQuickAdd: (productData: any) => void;
  onDuplicate: (productId: string) => void;
  onBarcodeScan: (barcode: string) => void;
  products: any[];
}

export const ProductQuickActions: React.FC<ProductQuickActionsProps> = ({
  onQuickAdd,
  onDuplicate,
  onBarcodeScan,
  products
}) => {
  const [showQuickAddDialog, setShowQuickAddDialog] = useState(false);
  const [quickProductData, setQuickProductData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '1',
    barcode: ''
  });
  const { toast } = useToast();

  const handleQuickAdd = () => {
    if (!quickProductData.name || !quickProductData.price) {
      toast({
        title: "Missing Information",
        description: "Please provide at least product name and price.",
        variant: "destructive"
      });
      return;
    }

    onQuickAdd({
      ...quickProductData,
      price: parseFloat(quickProductData.price),
      stock: parseInt(quickProductData.stock),
      description: `Quick added: ${quickProductData.name}`,
      tax: 0,
      barcode: quickProductData.barcode,
      isActive: true
    });

    setShowQuickAddDialog(false);
    setQuickProductData({ name: '', price: '', category: '', stock: '1', barcode: '' });
  };

  const handleBarcodeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = e.currentTarget.value.trim();
      if (barcode) {
        onBarcodeScan(barcode);
        e.currentTarget.value = '';
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button variant="outline" size="sm" onClick={() => setShowQuickAddDialog(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Quick Add
      </Button>
      
      <div className="relative">
        <Input
          placeholder="Scan barcode..."
          className="w-48"
          onKeyPress={handleBarcodeInput}
        />
        <Scan className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Mobile QR Scan button removed - now available in main header */}

      {/* Quick Add Dialog */}
      <Dialog open={showQuickAddDialog} onOpenChange={setShowQuickAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Quick Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quick-name">Product Name *</Label>
              <Input
                id="quick-name"
                value={quickProductData.name}
                onChange={(e) => setQuickProductData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
              />
            </div>
            
            <div>
              <Label htmlFor="quick-price">Price (₹) *</Label>
              <Input
                id="quick-price"
                type="number"
                value={quickProductData.price}
                onChange={(e) => setQuickProductData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Enter price"
              />
            </div>
            
            <div>
              <Label htmlFor="quick-category">Category</Label>
              <Input
                id="quick-category"
                value={quickProductData.category}
                onChange={(e) => setQuickProductData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Enter category"
              />
            </div>
            
            <div>
              <Label htmlFor="quick-stock">Initial Stock</Label>
              <Input
                id="quick-stock"
                type="number"
                value={quickProductData.stock}
                onChange={(e) => setQuickProductData(prev => ({ ...prev, stock: e.target.value }))}
                placeholder="Enter stock quantity"
              />
            </div>
            
            <div>
              <Label htmlFor="quick-barcode">Barcode</Label>
              <div className="flex gap-2">
                <Input
                  id="quick-barcode"
                  value={quickProductData.barcode}
                  onChange={(e) => setQuickProductData(prev => ({ ...prev, barcode: e.target.value }))}
                  placeholder="Enter barcode"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  title="Generate Sequential Barcode" 
                  onClick={() => {
                    const nextBarcode = generateNextBarcode(products);
                    setQuickProductData(prev => ({ ...prev, barcode: nextBarcode }));
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleQuickAdd}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 