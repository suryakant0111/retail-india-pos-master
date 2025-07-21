import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

const StockHistoryModal = ({ open, onClose }) => {
  const { profile } = useProfile();
  const [stockHistory, setStockHistory] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStockAdjustments = async () => {
      if (!open || !profile?.shop_id) return;
      setLoading(true);

      try {
        // Fetch stock adjustments
        const { data: adjustments, error: adjError } = await supabase
          .from('stock_adjustments')
          .select('*')
          .eq('shop_id', profile.shop_id)
          .order('created_at', { ascending: false });

        if (adjError) throw adjError;

        setStockHistory(adjustments || []);

        // Extract product & user IDs
        const productIds = [...new Set(adjustments.map(a => a.product_id))];
        const userIds = [...new Set(adjustments.map(a => a.user_id))];

        // Fetch product names
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);

        const productMap = {};
        products?.forEach(p => {
          productMap[p.id] = p.name;
        });
        setProductMap(productMap);

        // Fetch user names
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', userIds);

        const userMap = {};
        users?.forEach(u => {
          userMap[u.id] = u.full_name;
        });
        setUserMap(userMap);

      } catch (err) {
        console.error('Error fetching stock history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStockAdjustments();
  }, [open, profile?.shop_id]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>All Stock Adjustments</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center p-4 text-sm">Loading stock adjustments...</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs border">
              <thead>
                <tr>
                  <th className="p-2 border">Product</th>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Qty</th>
                  <th className="p-2 border">Note</th>
                  <th className="p-2 border">User</th>
                  <th className="p-2 border">Date</th>
                </tr>
              </thead>
              <tbody>
                {stockHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4">No adjustments found</td>
                  </tr>
                ) : (
                  stockHistory.map((h) => (
                    <tr key={h.id}>
                      <td className="p-2 border">{productMap[h.product_id] || h.product_id}</td>
                      <td className="p-2 border">{h.type}</td>
                      <td className="p-2 border">{h.quantity}</td>
                      <td className="p-2 border">{h.note || '-'}</td>
                      <td className="p-2 border">{userMap[h.user_id] || h.user_id}</td>
                      <td className="p-2 border">{new Date(h.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockHistoryModal;
