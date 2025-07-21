import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PlusCircle, Camera } from 'lucide-react';

const ProductDialog = ({
  open,
  onOpenChange,
  onSubmit,
  product,
  productForm,
  categories,
  generateNextBarcode,
  products,
  setShowBarcodeScanner
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            Fill out the form below to {product ? 'edit' : 'add'} a product.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Tax</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(onSubmit)}>
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
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
                        <Textarea placeholder="Enter product description" {...field} />
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
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            title="Generate Sequential Barcode" 
                            onClick={() => {
                              const nextBarcode = generateNextBarcode(products);
                              field.onChange(nextBarcode);
                            }}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            title="Scan Real Barcode" 
                            onClick={() => setShowBarcodeScanner(true)}
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Add more fields as needed */}
              </TabsContent>
              {/* Add TabsContent for pricing and advanced as needed */}
              <div className="flex justify-end mt-4">
                <Button type="submit">{product ? 'Update Product' : 'Add Product'}</Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog; 