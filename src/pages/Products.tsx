
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from '@/components/products/ProductCard';
import { Product } from '@/types';
import { supabase } from "../integrations/supabase/client";
import { PlusCircle, Search, Filter, Image, Upload, Barcode, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productImage, setProductImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const productRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Fetch products from Supabase on mount or when shop_id changes
  useEffect(() => {
    async function fetchProducts() {
      if (!profile?.shop_id) return;
      const { data, error } = await supabase.from('products').select('*').eq('shop_id', profile.shop_id);
      if (error) {
        console.error('Error fetching products:', error);
      } else if (data) {
        setProducts(data);
      }
    }
    fetchProducts();
  }, [profile?.shop_id]);

  // Highlight and scroll to product if highlight param is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlight = params.get('highlight');
    if (highlight) {
      setHighlightedId(highlight);
      setTimeout(() => setHighlightedId(null), 2500);
      setTimeout(() => {
        const ref = productRefs.current[highlight];
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300); // Wait for render
    }
  }, [location.search, products]);
  
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

  const CLOUDINARY_CLOUD_NAME = "dka53t4ym";
  const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset";

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        if (data.secure_url) {
          setProductImage(data.secure_url);
          toast({
            title: "Image Uploaded",
            description: "Image uploaded to Cloudinary successfully.",
            variant: "default",
          });
        } else {
          throw new Error(data.error?.message || "Cloudinary upload failed");
        }
      } catch (error: any) {
        toast({
          title: "Image Upload Error",
          description: error.message || "Failed to upload image to Cloudinary.",
          variant: "destructive",
        });
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Add product to Supabase
  const handleAddProductSubmit = async (data: any) => {
    const newProduct = {
      name: data.name,
      description: data.description || `Description for ${data.name}`,
      category: data.category,
      price: parseFloat(data.price),
      stock: parseInt(data.stock),
      image_url: productImage || null,
      barcode: data.barcode || '',
      shop_id: profile.shop_id,
      // Add other fields as needed
    };
    const { error } = await supabase.from('products').insert([newProduct]);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Product Added",
        description: `The product ${data.name} has been added successfully.`,
        variant: "default",
      });
      setShowAddProductDialog(false);
      setProductImage(null);
      productForm.reset();
      // Refresh product list
      const { data: updatedProducts } = await supabase.from('products').select('*').eq('shop_id', profile.shop_id);
      setProducts(updatedProducts || []);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Product Deleted',
        description: 'The product has been deleted successfully.',
        variant: 'default',
      });
      setProducts(products.filter((p) => p.id !== id));
    }
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
          {filteredProducts.map(product => (
            <div
              key={product.id}
              ref={el => (productRefs.current[product.id] = el)}
              className={highlightedId === product.id ? 'ring-4 ring-amber-400 transition-all duration-500' : ''}
            >
              <ProductCard
                product={product}
                showAddToCart={false}
                showDeleteButton={!!profile && profile.role === 'admin'}
                onDelete={handleDeleteProduct}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Add Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="max-w-md">
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
              
              <FormItem>
                <FormLabel>Product Image</FormLabel>
                <div className="mt-1 flex flex-col items-center justify-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  
                  {productImage ? (
                    <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={productImage} 
                        alt="Product preview" 
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={() => setProductImage(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-40 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={triggerFileInput}
                    >
                      <Image className="h-10 w-10 text-gray-300" />
                      <div className="text-sm text-muted-foreground text-center">
                        <p>Click to upload image</p>
                        <p className="text-xs">JPG, PNG, GIF up to 5MB</p>
                      </div>
                    </div>
                  )}
                  
                  {!productImage && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={triggerFileInput}
                      className="mt-2"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </Button>
                  )}
                </div>
              </FormItem>
              
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
