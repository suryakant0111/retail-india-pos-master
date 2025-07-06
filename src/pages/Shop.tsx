import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Store } from 'lucide-react';

export default function ShopPage() {
  const { profile } = useAuth();
  const [shop, setShop] = useState<any>(null);

  useEffect(() => {
    async function fetchShop() {
      if (!profile?.shop_id) return;
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', profile.shop_id)
        .single();
      if (!error) setShop(data);
    }
    fetchShop();
  }, [profile?.shop_id]);

  if (!shop) return <div>Loading shop details...</div>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Store className="w-8 h-8 text-blue-600" />
          <div>
            <CardTitle className="text-2xl font-bold">{shop.name}</CardTitle>
            <div className="text-sm text-muted-foreground">Shop Details</div>
          </div>
        </CardHeader>
        <CardContent>
          {/* <div className="mb-2"><b>Shop Code:</b> <span className="font-mono">{shop.id}</span></div> */}
          <div className="mb-2"><b>Created At:</b> {new Date(shop.created_at).toLocaleString()}</div>
          {/* Add more shop info here if needed */}
        </CardContent>
      </Card>
    </div>
  );
} 