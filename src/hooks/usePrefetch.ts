import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

interface PrefetchData {
  products?: any[];
  customers?: any[];
  invoices?: any[];
  transactions?: any[];
  settings?: any;
}

interface PrefetchState {
  [key: string]: {
    data: any;
    loading: boolean;
    error: string | null;
    timestamp: number;
  };
}

export const usePrefetch = () => {
  const [prefetchState, setPrefetchState] = useState<PrefetchState>({});
  const { profile } = useProfile();
  const prefetchTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const prefetchDelay = 300; // 300ms delay before prefetching

  const prefetchData = useCallback(async (route: string) => {
    if (!profile?.shop_id) {
      console.log("No shop_id, skipping prefetch for", route);
      return;
    }

    // Clear existing timeout for this route
    if (prefetchTimeouts.current[route]) {
      clearTimeout(prefetchTimeouts.current[route]);
    }

    // Set a new timeout
    prefetchTimeouts.current[route] = setTimeout(async () => {
      // Check if we already have fresh data (less than 5 minutes old)
      const existing = prefetchState[route];
      if (existing && Date.now() - existing.timestamp < 5 * 60 * 1000) {
        console.log("Prefetched data for", route, "is still fresh.");
        return; // Data is fresh, no need to refetch
      }

      setPrefetchState(prev => ({
        ...prev,
        [route]: { ...prev[route], loading: true, error: null }
      }));

      try {
        console.log("Prefetching data for", route);
        let data;
        
        switch (route) {
          case '/products':
            const { data: products, error: productsError } = await supabase
              .from('products')
              .select('*')
              .eq('shop_id', profile.shop_id)
              .limit(50); // Limit to avoid overwhelming
            data = productsError ? null : products;
            break;

          case '/customers':
            const { data: customers, error: customersError } = await supabase
              .from('customers')
              .select('*')
              .eq('shop_id', profile.shop_id)
              .limit(50);
            data = customersError ? null : customers;
            break;

          case '/invoices':
            const { data: invoices, error: invoicesError } = await supabase
              .from('invoices')
              .select('*')
              .eq('shop_id', profile.shop_id)
              .order('createdAt', { ascending: false })
              .limit(20);
            data = invoicesError ? null : invoices;
            break;

          case '/transactions':
            const { data: transactions, error: transactionsError } = await supabase
              .from('invoices')
              .select('*')
              .eq('shop_id', profile.shop_id)
              .order('createdAt', { ascending: false })
              .limit(30);
            data = transactionsError ? null : transactions;
            break;

          case '/dashboard':
            // For dashboard, prefetch multiple data sources
            const [productsRes, customersRes, invoicesRes] = await Promise.all([
              supabase.from('products').select('*').eq('shop_id', profile.shop_id).limit(20),
              supabase.from('customers').select('*').eq('shop_id', profile.shop_id).limit(20),
              supabase.from('invoices').select('*').eq('shop_id', profile.shop_id).order('createdAt', { ascending: false }).limit(10)
            ]);
            
            data = {
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
            data = settingsError ? null : settings;
            break;

          default:
            return;
        }

        setPrefetchState(prev => ({
          ...prev,
          [route]: {
            data,
            loading: false,
            error: null,
            timestamp: Date.now()
          }
        }));

      } catch (error) {
        console.error("Prefetch error for", route, error);
        setPrefetchState(prev => ({
          ...prev,
          [route]: {
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now()
          }
        }));
      }
    }, prefetchDelay);
  }, [profile?.shop_id, prefetchState]);

  const cancelPrefetch = useCallback((route: string) => {
    if (prefetchTimeouts.current[route]) {
      clearTimeout(prefetchTimeouts.current[route]);
      delete prefetchTimeouts.current[route];
    }
  }, []);

  const getPrefetchedData = useCallback((route: string) => {
    return prefetchState[route]?.data || null;
  }, [prefetchState]);

  const isPrefetching = useCallback((route: string) => {
    return prefetchState[route]?.loading || false;
  }, [prefetchState]);

  return {
    prefetchData,
    cancelPrefetch,
    getPrefetchedData,
    isPrefetching,
    prefetchState
  };
}; 