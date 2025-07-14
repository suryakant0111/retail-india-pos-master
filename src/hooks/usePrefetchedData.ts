import { useEffect, useState } from 'react';
import { usePrefetchContext } from '@/contexts/PrefetchContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export const usePrefetchedData = (route: string) => {
  const { getPrefetchedData, isPrefetching } = usePrefetchContext();
  const { profile } = useProfile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // First, try to get prefetched data
    const prefetchedData = getPrefetchedData(route);
    
    if (prefetchedData) {
      setData(prefetchedData);
      setLoading(false);
      setError(null);
      return;
    }

    // If no prefetched data, check if prefetching is in progress
    if (isPrefetching(route)) {
      setLoading(true);
      return;
    }

    // If no prefetched data and not prefetching, load data normally
    if (!profile?.shop_id) return;

    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        let result;
        
        switch (route) {
          case '/products':
            const { data: products, error: productsError } = await supabase
              .from('products')
              .select('*')
              .eq('shop_id', profile.shop_id);
            result = productsError ? null : products;
            break;

          case '/customers':
            const { data: customers, error: customersError } = await supabase
              .from('customers')
              .select('*')
              .eq('shop_id', profile.shop_id);
            result = customersError ? null : customers;
            break;

          case '/invoices':
            const { data: invoices, error: invoicesError } = await supabase
              .from('invoices')
              .select('*')
              .eq('shop_id', profile.shop_id)
              .order('createdAt', { ascending: false });
            result = invoicesError ? null : invoices;
            break;

          case '/transactions':
            const { data: transactions, error: transactionsError } = await supabase
              .from('invoices')
              .select('*')
              .eq('shop_id', profile.shop_id)
              .order('createdAt', { ascending: false });
            result = transactionsError ? null : transactions;
            break;

          case '/dashboard':
            const [productsRes, customersRes, invoicesRes] = await Promise.all([
              supabase.from('products').select('*').eq('shop_id', profile.shop_id),
              supabase.from('customers').select('*').eq('shop_id', profile.shop_id),
              supabase.from('invoices').select('*').eq('shop_id', profile.shop_id).order('createdAt', { ascending: false })
            ]);
            
            result = {
              products: productsRes.data,
              customers: customersRes.data,
              invoices: invoicesRes.data
            };
            break;

          case '/settings':
            const { data: settings, error: settingsError } = await supabase
              .from('shop_settings')
              .select('*')
              .eq('shop_id', profile.shop_id)
              .single();
            result = settingsError ? null : settings;
            break;

          default:
            result = null;
        }

        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    loadData();
  }, [route, profile?.shop_id, getPrefetchedData, isPrefetching]);

  return { data, loading, error };
}; 