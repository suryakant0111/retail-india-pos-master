import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, Edit, Trash2, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ProductBulkActionsProps {
  selectedProducts: string[];
  onBulkDelete: (ids: string[]) => void;
  onBulkUpdate: (ids: string[], updates: any) => void;
  onImport: (file: File) => void;
  onExport: () => void;
}

export const ProductBulkActions: React.FC<ProductBulkActionsProps> = ({
  selectedProducts,
  onBulkDelete,
  onBulkUpdate,
  onImport,
  onExport
}) => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState({
    category: '',
    price: '',
    stock: '',
    tax: ''
  });
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      setShowImportDialog(false);
    }
  };

  const handleBulkUpdate = () => {
    const updates = Object.fromEntries(
      Object.entries(bulkUpdates).filter(([_, value]) => value !== '')
    );
    if (Object.keys(updates).length > 0) {
      onBulkUpdate(selectedProducts, updates);
      setShowBulkEditDialog(false);
      setBulkUpdates({ category: '', price: '', stock: '', tax: '' });
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>
      
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      
      {selectedProducts.length > 0 && (
        <>
          <Button variant="outline" size="sm" onClick={() => setShowBulkEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Bulk Edit ({selectedProducts.length})
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onBulkDelete(selectedProducts)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedProducts.length})
          </Button>
        </>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="import-file">Upload CSV/Excel file</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Download template: <Button variant="link" size="sm">CSV Template</Button></p>
              <p>Supported formats: CSV, Excel (.xlsx, .xls)</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-category">Category</Label>
              <Input
                id="bulk-category"
                placeholder="Leave empty to skip"
                value={bulkUpdates.category}
                onChange={(e) => setBulkUpdates(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bulk-price">Price (₹)</Label>
              <Input
                id="bulk-price"
                type="number"
                placeholder="Leave empty to skip"
                value={bulkUpdates.price}
                onChange={(e) => setBulkUpdates(prev => ({ ...prev, price: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bulk-stock">Stock</Label>
              <Input
                id="bulk-stock"
                type="number"
                placeholder="Leave empty to skip"
                value={bulkUpdates.stock}
                onChange={(e) => setBulkUpdates(prev => ({ ...prev, stock: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bulk-tax">GST/Tax Rate (%)</Label>
              <Input
                id="bulk-tax"
                type="number"
                placeholder="Leave empty to skip"
                value={bulkUpdates.tax}
                onChange={(e) => setBulkUpdates(prev => ({ ...prev, tax: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleBulkUpdate}>Update Selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 