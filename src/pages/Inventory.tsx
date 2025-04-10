
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Product } from '@/types';
import { mockProducts } from '@/data/mockData';
import { useToast } from '@/components/ui/use-toast';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productMinStock, setProductMinStock] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load products from localStorage and merge with mock data
    try {
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts);
        if (Array.isArray(parsedProducts)) {
          setProducts([...mockProducts, ...parsedProducts]);
        } else {
          setProducts([...mockProducts]);
        }
      } else {
        setProducts([...mockProducts]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([...mockProducts]);
    }
  }, []);
  
  // Get unique categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  
  // Filter products based on search term and low stock filter
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchTerm));
      
      const matchesLowStock = lowStockFilter ? 
        (product.minStock && product.stock <= product.minStock) : true;
      
      return matchesSearch && matchesLowStock;
    })
    .sort((a, b) => {
      // Sort by stock status (low stock first)
      if (lowStockFilter) {
        const aIsLow = a.minStock && a.stock <= a.minStock;
        const bIsLow = b.minStock && b.stock <= b.minStock;
        
        if (aIsLow && !bIsLow) return -1;
        if (!aIsLow && bIsLow) return 1;
      }
      
      // Then by name
      return a.name.localeCompare(b.name);
    });

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setProductCategory(product.category);
    setProductPrice(product.price.toString());
    setProductStock(product.stock.toString());
    setProductMinStock(product.minStock?.toString() || '');
    setOpenDialog(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setOpenAlertDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedProduct) return;
    
    const updatedProducts = products.filter(p => p.id !== selectedProduct.id);
    setProducts(updatedProducts);
    
    // Update localStorage
    try {
      const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const updatedStoredProducts = storedProducts.filter((p: Product) => p.id !== selectedProduct.id);
      localStorage.setItem('products', JSON.stringify(updatedStoredProducts));
      
      toast({
        title: "Product Deleted",
        description: `${selectedProduct.name} has been removed from inventory.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
    
    setOpenAlertDialog(false);
  };

  const saveProductChanges = () => {
    if (!selectedProduct) return;
    
    const updatedProduct = {
      ...selectedProduct,
      name: productName,
      category: productCategory,
      price: parseFloat(productPrice),
      stock: parseInt(productStock),
      minStock: productMinStock ? parseInt(productMinStock) : undefined,
      updatedAt: new Date(),
    };
    
    const updatedProducts = products.map(p => 
      p.id === selectedProduct.id ? updatedProduct : p
    );
    
    setProducts(updatedProducts);
    
    // Update localStorage
    try {
      const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const updatedStoredProducts = storedProducts.map((p: Product) => 
        p.id === selectedProduct.id ? updatedProduct : p
      );
      localStorage.setItem('products', JSON.stringify(updatedStoredProducts));
      
      toast({
        title: "Product Updated",
        description: `${updatedProduct.name} has been updated.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
    
    setOpenDialog(false);
  };

  const toggleLowStockFilter = () => {
    setLowStockFilter(!lowStockFilter);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Stock Levels</CardTitle>
              <CardDescription>Monitor and update your inventory</CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                variant={lowStockFilter ? "default" : "outline"} 
                onClick={toggleLowStockFilter}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Low Stock Items
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Min Stock</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isLowStock = product.minStock !== undefined && product.stock <= product.minStock;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.stock}</TableCell>
                      <TableCell className="text-right">{product.minStock || '-'}</TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <p className="text-muted-foreground">No products found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit Product Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Name
              </label>
              <Input
                id="name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category" className="text-right">
                Category
              </label>
              <Input
                id="category"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="price" className="text-right">
                Price
              </label>
              <Input
                id="price"
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="stock" className="text-right">
                Stock
              </label>
              <Input
                id="stock"
                type="number"
                value={productStock}
                onChange={(e) => setProductStock(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="minStock" className="text-right">
                Min Stock
              </label>
              <Input
                id="minStock"
                type="number"
                value={productMinStock}
                onChange={(e) => setProductMinStock(e.target.value)}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveProductChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openAlertDialog} onOpenChange={setOpenAlertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <span className="font-semibold">{selectedProduct?.name}</span> from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Inventory;
