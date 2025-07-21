import { useState, useEffect, useCallback } from 'react';
import {
  addOfflineSale, getOfflineSales, removeOfflineSale,
  addOfflineCustomer, getOfflineCustomers, removeOfflineCustomer,
  addOfflineProductUpdate, getOfflineProductUpdates, removeOfflineProductUpdate,
  addOfflineBill, getOfflineBills, removeOfflineBill,
  addOfflinePayment, getOfflinePayments, removeOfflinePayment,
  addOfflineConflict
} from '@/lib/offlineDB';

export function useOfflineSync({ toast, supabase, profile, businessSettings, safePaymentSettings }) {
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync all offline data
  const syncOfflineData = useCallback(async () => {
    setIsSyncing(true);
    // Customers
    const unsyncedCustomers = await getOfflineCustomers();
    if (unsyncedCustomers.length > 0) {
      for (const customer of unsyncedCustomers) {
        try {
          const { error } = await supabase.from('customers').insert([customer.data]);
          if (!error) {
            await removeOfflineCustomer(customer.id);
          } else {
            toast({ title: 'Sync Error', description: `Failed to sync customer ${customer.id}: ${error.message}`, variant: 'destructive' });
          }
        } catch {
          toast({ title: 'Sync Error', description: `Failed to sync customer ${customer.id}`, variant: 'destructive' });
        }
      }
      toast({ title: 'Offline Customers Synced', description: 'All offline customers have been uploaded.', variant: 'success' });
    }
    // Invoices
    const unsyncedSales = await getOfflineSales();
    if (unsyncedSales.length > 0) {
      for (const sale of unsyncedSales) {
        try {
          const { error } = await supabase.from('invoices').insert([sale.data]);
          if (!error) {
            await removeOfflineSale(sale.id);
          } else {
            toast({ title: 'Sync Error', description: `Failed to sync sale ${sale.id}: ${error.message}`, variant: 'destructive' });
          }
        } catch {
          toast({ title: 'Sync Error', description: `Failed to sync sale ${sale.id}`, variant: 'destructive' });
        }
      }
      toast({ title: 'Offline Sales Synced', description: 'All offline sales have been uploaded.', variant: 'success' });
    }
    // Bills
    const unsyncedBills = await getOfflineBills();
    if (unsyncedBills.length > 0) {
      for (const bill of unsyncedBills) {
        try {
          const { error } = await supabase.from('bills').insert([bill.data]);
          if (!error) {
            await removeOfflineBill(bill.id);
          } else {
            toast({ title: 'Sync Error', description: `Failed to sync bill ${bill.id}: ${error.message}`, variant: 'destructive' });
          }
        } catch {
          toast({ title: 'Sync Error', description: `Failed to sync bill ${bill.id}`, variant: 'destructive' });
        }
      }
      toast({ title: 'Offline Bills Synced', description: 'All offline bills have been uploaded.', variant: 'success' });
    }
    // Payments
    const unsyncedPayments = await getOfflinePayments();
    if (unsyncedPayments.length > 0) {
      for (const payment of unsyncedPayments) {
        try {
          const { error } = await supabase.from('payments').insert([payment.data]);
          if (!error) {
            await removeOfflinePayment(payment.id);
          } else {
            toast({ title: 'Sync Error', description: `Failed to sync payment ${payment.id}: ${error.message}`, variant: 'destructive' });
          }
        } catch {
          toast({ title: 'Sync Error', description: `Failed to sync payment ${payment.id}`, variant: 'destructive' });
        }
      }
      toast({ title: 'Offline Payments Synced', description: 'All offline payments have been uploaded.', variant: 'success' });
    }
    // Product Updates
    const unsyncedProductUpdates = await getOfflineProductUpdates();
    if (unsyncedProductUpdates.length > 0) {
      for (const update of unsyncedProductUpdates) {
        try {
          // Fetch current product from Supabase
          const { data: productData, error: fetchError } = await supabase.from('products').select('stock').eq('id', update.data.id).single();
          if (fetchError || !productData) {
            toast({ title: 'Sync Error', description: `Failed to fetch product ${update.data.id} for conflict check.`, variant: 'destructive' });
            continue;
          }
          // If the update includes an expected stock, check for conflict
          if (typeof update.data.expectedStock === 'number' && productData.stock !== update.data.expectedStock) {
            // Conflict detected
            await addOfflineConflict({
              id: `${update.data.id}-${Date.now()}`,
              type: 'product-stock',
              data: {
                productId: update.data.id,
                expected: update.data.expectedStock,
                actual: productData.stock,
                update: update.data.update,
                timestamp: update.createdAt,
              },
              createdAt: Date.now(),
            });
            toast({ title: 'Stock Conflict', description: `Conflict for product ${update.data.id}: expected ${update.data.expectedStock}, actual ${productData.stock}. Update skipped.`, variant: 'destructive' });
            continue;
          }
          // No conflict, apply the update
          const { error } = await supabase.from('products').update(update.data.update).eq('id', update.data.id);
          if (!error) {
            await removeOfflineProductUpdate(update.id);
          } else {
            toast({ title: 'Sync Error', description: `Failed to sync product update ${update.id}: ${error.message}`, variant: 'destructive' });
          }
        } catch {
          toast({ title: 'Sync Error', description: `Failed to sync product update ${update.id}`, variant: 'destructive' });
        }
      }
      toast({ title: 'Offline Product Updates Synced', description: 'All offline product updates have been uploaded.', variant: 'success' });
    }
    setIsSyncing(false);
  }, [toast, supabase]);

  // Listen for online/offline events and auto-sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineData();
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineData]);

  return { isOffline, isSyncing, syncOfflineData };
} 