import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { supabase } from '../integrations/supabase/client';
import { useProfile } from './useProfile';
import { useToast } from '@/components/ui/use-toast';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();
  const { toast } = useToast();

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!profile?.shop_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('id', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error fetching products",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.shop_id, toast]);

  // Add product
  const addProduct = useCallback(async (productData: Partial<Product>) => {
    console.log('🔍 [useProducts] addProduct called with data:', productData);
    console.log('🔍 [useProducts] profile?.shop_id:', profile?.shop_id);
    
    if (!profile?.shop_id) {
      console.error('🔍 [useProducts] No shop_id available, cannot add product');
      return;
    }
    
    try {
      const newProduct = {
        ...productData,
        shop_id: profile.shop_id,
        isActive: true
      };
      
      console.log('🔍 [useProducts] Attempting to insert product:', newProduct);
      
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();
      
      if (error) {
        console.error('🔍 [useProducts] Supabase error:', error);
        throw error;
      }
      
      setProducts(prev => [data, ...prev]);
      toast({
        title: "Product Added",
        description: `The product ${productData.name} has been added successfully.`,
        variant: "default"
      });
      
      return data;
    } catch (err: any) {
      toast({
        title: "Error adding product",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  }, [profile?.shop_id, toast]);

  // Update product
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setProducts(prev => prev.map(p => p.id === id ? data : p));
      toast({
        title: "Product Updated",
        description: `The product ${updates.name} has been updated successfully.`,
        variant: "default"
      });
      
      return data;
    } catch (err: any) {
      toast({
        title: "Error updating product",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  // Delete product
  const deleteProduct = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Product Deleted",
        description: "The product has been deleted successfully.",
        variant: "default"
      });
    } catch (err: any) {
      toast({
        title: "Error deleting product",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  // Bulk operations
  const bulkDelete = useCallback(async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      
      setProducts(prev => prev.filter(p => !ids.includes(p.id)));
      toast({
        title: "Products Deleted",
        description: `${ids.length} products have been deleted successfully.`,
        variant: "default"
      });
    } catch (err: any) {
      toast({
        title: "Error deleting products",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  const bulkUpdate = useCallback(async (ids: string[], updates: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .in('id', ids);
      
      if (error) throw error;
      
      setProducts(prev => prev.map(p => 
        ids.includes(p.id) ? { ...p, ...updates } : p
      ));
      
      toast({
        title: "Products Updated",
        description: `${ids.length} products have been updated successfully.`,
        variant: "default"
      });
    } catch (err: any) {
      toast({
        title: "Error updating products",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  // Duplicate product
  const duplicateProduct = useCallback(async (product: Product) => {
    const duplicatedProduct = {
      ...product,
      id: undefined,
      name: `${product.name} (Copy)`
    };
    
    delete duplicatedProduct.id;
    
    return await addProduct(duplicatedProduct);
  }, [addProduct]);

  // Search by barcode
  const searchByBarcode = useCallback((barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      toast({
        title: "Product Found",
        description: `Found: ${product.name}`,
        variant: "default"
      });
      return product;
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive"
      });
      return null;
    }
  }, [products, toast]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    bulkDelete,
    bulkUpdate,
    duplicateProduct,
    searchByBarcode
  };
}; 