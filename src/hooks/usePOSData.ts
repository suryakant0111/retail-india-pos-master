import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useProfile } from '@/hooks/useProfile';
import { Product, Customer } from '@/types';

// Add normalization helper
function normalizePaymentSettings(settings: any) {
  return {
    ...settings,
    enableUpi: settings?.enableUpi === true || settings?.enableUpi === 'true',
    enableCash: settings?.enableCash === true || settings?.enableCash === 'true',
    enableCard: settings?.enableCard === true || settings?.enableCard === 'true',
  };
}

export function usePOSData() {
  const { 
    items, 
    subtotal, 
    taxTotal, 
    total, 
    customer,
    clearCart,
    discountValue,
    discountType,
    addItem,
    setTaxRate,
    removeItem,
    updateQuantity,
    updateQuantityWithUnit,
    updatePrice,
    setCustomer,
    taxRate
  } = useCart();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceReference, setInvoiceReference] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businessSettings, setBusinessSettings] = useState<any>({});
  const [paymentSettings, setPaymentSettings] = useState<any>({});
  const [posMode, setPosMode] = useState<'retail' | 'kirana'>('retail');
  const { profile } = useProfile();
  const [recentSalesProducts, setRecentSalesProducts] = useState<Product[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  // Initialize cartType from localStorage if available
  const getInitialCartType = () => {
    const saved = localStorage.getItem('cartType');
    if (saved === 'excel' || saved === 'pos') return saved;
    return 'pos';
  };
  const [cartType, setCartType] = useState<'pos' | 'excel'>(getInitialCartType());
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({});
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');

  const fetchProducts = async () => {
    if (!profile?.shop_id) return;
    setLoadingProducts(true);
    const { data, error } = await supabase.from('products').select('*').eq('shop_id', profile.shop_id);
    if (!error && data) setProducts(data);
    setLoadingProducts(false);
  };

  const fetchRecentSales = async () => {
    if (!profile?.shop_id) return;
    const { data, error } = await supabase
      .from('invoices')
      .select('items')
      .eq('shop_id', profile.shop_id)
      .order('createdAt', { ascending: false })
      .limit(10);
    if (!error && data) {
      const products = data.flatMap(inv =>
        Array.isArray(inv.items)
          ? inv.items.map((item: any) => item && item.product ? item.product : null).filter(Boolean)
          : []
      );
      const uniqueProducts = Array.from(new Map(products.map(p => [p.id, p])).values());
      setRecentSalesProducts(uniqueProducts);
    }
  };

  const fetchRecentInvoices = async () => {
    if (!profile?.shop_id) return;
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', profile.shop_id)
      .order('createdAt', { ascending: false })
      .limit(10);
    if (!error && data) setRecentInvoices(data);
  };

  useEffect(() => {
    if (profile?.shop_id) {
      fetchProducts();
      fetchRecentInvoices();
      async function fetchCustomers() {
        if (!profile?.shop_id) return;
        setLoadingCustomers(true);
        const { data, error } = await supabase.from('customers').select('*').eq('shop_id', profile.shop_id);
        if (!error && data) setCustomers(data);
        setLoadingCustomers(false);
      }
      async function fetchSettings() {
        setLoadingSettings(true);
        const { data, error } = await supabase.from('shop_settings').select('*').eq('shop_id', profile.shop_id).single();
        if (!error && data) {
          setBusinessSettings(data.business_settings || {});
          setPaymentSettings(normalizePaymentSettings(data.payment_settings || {}));
          setPosMode(data.pos_mode || 'retail');
        } else {
          setBusinessSettings({});
          setPaymentSettings({});
          setPosMode('retail');
        }
        setLoadingSettings(false);
      }
      fetchCustomers();
      fetchSettings();

      // Auto-refresh settings when tab becomes visible
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchSettings();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [profile?.shop_id]);

  useEffect(() => {
    (window as any).products = products;
  }, [products]);

  // Persist cartType to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartType', cartType);
  }, [cartType]);

  const refreshCustomers = async () => {
    if (!profile?.shop_id) return;
    const { data, error } = await supabase.from('customers').select('*').eq('shop_id', profile.shop_id);
    if (!error && data) setCustomers(data);
  };

  const handleAddNewCustomer = async () => {
    if (!profile?.shop_id) return;
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...newCustomer, shop_id: profile.shop_id, created_at: new Date().toISOString() }])
        .select()
        .single();
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Success', description: 'Customer added successfully' });
      setNewCustomer({});
      setNewCustomerDialog(false);
      await refreshCustomers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add customer', variant: 'destructive' });
    }
  };

  return {
    items,
    subtotal,
    taxTotal,
    total,
    customer,
    clearCart,
    discountValue,
    discountType,
    addItem,
    setTaxRate,
    removeItem,
    updateQuantity,
    updateQuantityWithUnit,
    updatePrice,
    setCustomer,
    taxRate,
    toast,
    searchTerm,
    setSearchTerm,
    category,
    setCategory,
    activeTab,
    setActiveTab,
    showPaymentDialog,
    setShowPaymentDialog,
    paymentMethod,
    setPaymentMethod,
    showReceiptDialog,
    setShowReceiptDialog,
    paymentSuccess,
    setPaymentSuccess,
    isPrintingReceipt,
    setIsPrintingReceipt,
    products,
    setProducts,
    invoiceReference,
    setInvoiceReference,
    customers,
    setCustomers,
    businessSettings,
    setBusinessSettings,
    paymentSettings,
    setPaymentSettings,
    posMode,
    setPosMode,
    profile,
    recentSalesProducts,
    setRecentSalesProducts,
    recentInvoices,
    setRecentInvoices,
    cartType,
    setCartType,
    newCustomerDialog,
    setNewCustomerDialog,
    newCustomer,
    setNewCustomer,
    paymentStatus,
    setPaymentStatus,
    fetchProducts,
    fetchRecentSales,
    fetchRecentInvoices,
    refreshCustomers,
    handleAddNewCustomer,
    loadingProducts,
    loadingCustomers,
    loadingSettings
  };
} 