import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockProducts, mockCustomers, mockInvoices } from '@/data/mockData';
import { Search, Plus, BarChart4, Trash2, Edit, Package, Users, FileText, Barcode } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Product } from '@/types';

const AdminPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [products, setProducts] = useState(mockProducts);
  const [customers, setCustomers] = useState(mockCustomers);
  const { toast } = useToast();
  
  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter customers based on search term
  const filteredCustomers = mockCustomers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );
  
  // Filter invoices based on search term
  const filteredInvoices = mockInvoices.filter(invoice => 
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.customer && invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleAddNew = (type: string) => {
    if (type === 'Product') {
      setShowAddProductDialog(true);
    } else if (type === 'Customer') {
      setShowAddCustomerDialog(true);
    } else {
      toast({
        title: `Add New ${type}`,
        description: `This would open a form to add a new ${type.toLowerCase()}`,
        variant: "default",
      });
    }
  };
  
  const handleEdit = (id: string, type: string) => {
    toast({
      title: `Edit ${type}`,
      description: `This would open a form to edit ${type.toLowerCase()} with ID: ${id}`,
      variant: "default",
    });
  };
  
  const handleDelete = (id: string, type: string) => {
    if (type === 'Product') {
      setProducts(products.filter(product => product.id !== id));
      toast({
        title: `Delete ${type}`,
        description: `Product has been removed from the database.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: `Delete ${type}`,
        description: `This action would remove this ${type.toLowerCase()} from the database.`,
        variant: "destructive",
      });
    }
  };

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

  const handleAddCustomerSubmit = (data: any) => {
    toast({
      title: "Customer Added",
      description: `The customer ${data.name} has been added successfully.`,
      variant: "default",
    });
    setShowAddCustomerDialog(false);
  };

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

  // Form for adding a new customer
  const customerForm = useForm({
    defaultValues: {
      name: '',
      phone: '',
      email: ''
    }
  });

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your products, customers, and orders</p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <BarChart4 className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">Sales this month: ₹155,000</span>
        </div>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Orders
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>Manage your inventory and products</CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-8 w-full md:w-auto"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={() => handleAddNew('Product')}>
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.barcode || '-'}</TableCell>
                      <TableCell className="text-right">₹{product.price.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">{product.stock}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(product.id, 'Product')}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id, 'Product')}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
              <div>
                <CardTitle>Customers</CardTitle>
                <CardDescription>Manage your customer database</CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    className="pl-8 w-full md:w-auto"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={() => handleAddNew('Customer')}>
                  <Plus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Loyalty Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell className="text-right">{customer.loyaltyPoints || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(customer.id, 'Customer')}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id, 'Customer')}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
              <div>
                <CardTitle>Orders</CardTitle>
                <CardDescription>View and manage order history</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-8 w-full md:w-auto"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customer ? invoice.customer.name : 'Walk-in Customer'}</TableCell>
                      <TableCell>{invoice.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">₹{invoice.total.toLocaleString('en-IN', {maximumFractionDigits: 2})}</TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                          invoice.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(invoice.id, 'Order')}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomerDialog} onOpenChange={setShowAddCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(handleAddCustomerSubmit)} className="space-y-4">
              <FormField
                control={customerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={customerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={customerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Add Customer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
