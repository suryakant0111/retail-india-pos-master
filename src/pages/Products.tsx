
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from '@/components/products/ProductCard';
import { Product } from '@/types';
import { mockProducts } from '@/data/mockData';
import { PlusCircle, Search, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Barcode } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const { toast } = useToast();
  
  useEffect(() => {
    // Try to load products from localStorage
    try {
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts);
        if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
          setProducts([...mockProducts, ...parsedProducts]);
        }
      }
    } catch (error) {
      console.error('Error loading products from localStorage:', error);
    }
  }, []);
  
  // Get unique categories from products
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  
  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
    
    const matchesCategory = category === 'all' || product.category === category;
    
    return matchesSearch && matchesCategory;
  });

  // Form for adding a new product
  const productForm = useForm({
    defaultValues: {
      name: '',
      category: '',
      price: '',
      stock: '',
      description: '',
      barcode: ''
    }
  });

  const handleAddProductSubmit = (data: any) => {
    const newProduct: Product = {
      id: `PRD${Date.now().toString().slice(-6)}`,
      name: data.name,
      description: data.description || `Description for ${data.name}`,
      category: data.category,
      price: parseFloat(data.price),
      tax: 18, // Default tax percentage
      stock: parseInt(data.stock),
      barcode: data.barcode || "",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setProducts([...products, newProduct]);
    
    // Update localStorage to persist the new product
    try {
      const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
      localStorage.setItem('products', JSON.stringify([...existingProducts, newProduct]));
    } catch (error) {
      console.error('Error saving product to localStorage:', error);
    }
    
    toast({
      title: "Product Added",
      description: `The product ${data.name} has been added successfully.`,
      variant: "default",
    });
    setShowAddProductDialog(false);
    productForm.reset();
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setShowAddProductDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>
      
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={category} onValueChange={setCategory}>
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
      </div>
      
      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No products found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      
      {/* Add Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new product to inventory.
            </DialogDescription>
          </DialogHeader>
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(handleAddProductSubmit)} className="space-y-4">
              <FormField
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={productForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={productForm.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="Enter product barcode" {...field} />
                        <Button type="button" variant="outline" size="icon" title="Generate Random Barcode" 
                          onClick={() => {
                            const randomBarcode = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
                            field.onChange(randomBarcode);
                          }}>
                          <Barcode className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={productForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter price" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={productForm.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter stock quantity" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Add Product</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
