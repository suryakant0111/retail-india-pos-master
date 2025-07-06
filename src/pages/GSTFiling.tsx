import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveAs } from 'file-saver';
import { useProfile } from '@/hooks/useProfile';

const GSTFiling: React.FC = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [gstr1Data, setGstr1Data] = useState<any[]>([]);
  const [error, setError] = useState('');
  const { profile } = useProfile();

  const fetchGSTR1 = async () => {
    setLoading(true);
    setError('');
    setGstr1Data([]);
    try {
      let query = supabase.from('invoices').select('*');
      if (profile?.shop_id) query = query.eq('shop_id', profile.shop_id);
      if (fromDate) query = query.gte('createdAt', fromDate);
      if (toDate) query = query.lte('createdAt', toDate + 'T23:59:59');
      const { data, error } = await query;
      if (error) throw error;
      if (!data) return;
      // Map invoices to GSTR-1 format
      const rows = data.map((inv: any) => {
        const customer = inv.customer || {};
        const items = inv.items || [];
        // Sum up taxable value and tax
        let taxableValue = 0, igst = 0, cgst = 0, sgst = 0, hsn = '', taxRate = 0;
        items.forEach((item: any) => {
          taxableValue += item.price * item.quantity;
          hsn = item.product?.hsn || '';
          taxRate = item.product?.tax || 0;
        });
        // For simplicity, split total tax equally as CGST/SGST (for intra-state)
        cgst = inv.taxTotal / 2;
        sgst = inv.taxTotal / 2;
        // If you want to handle IGST, add logic for inter-state
        return {
          'Invoice No': inv.invoiceNumber,
          'Date': new Date(inv.createdAt).toLocaleDateString('en-IN'),
          'Customer Name': customer.name || 'Walk-in',
          'GSTIN': customer.gstin || '',
          'Place of Supply': customer.address || '',
          'Invoice Value': inv.total,
          'Taxable Value': taxableValue,
          'IGST': igst,
          'CGST': cgst,
          'SGST': sgst,
          'Total Tax': inv.taxTotal,
          'HSN/SAC': hsn,
          'Tax Rate': taxRate,
        };
      });
      setGstr1Data(rows);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    if (!gstr1Data.length) return;
    const header = Object.keys(gstr1Data[0]);
    const csvRows = [header.join(',')];
    for (const row of gstr1Data) {
      csvRows.push(header.map(h => '"' + (row[h] ?? '') + '"').join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    saveAs(blob, `GSTR-1_${fromDate || 'all'}_${toDate || 'all'}.csv`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">GST Filing & Reports</h1>
      <p className="mb-6 text-muted-foreground">
        Generate and download GST-compliant sales reports (GSTR-1) for your business.
      </p>
      <div className="border rounded p-6 bg-muted mb-8">
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div>
            <label className="block text-sm mb-1">From Date</label>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">To Date</label>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <Button onClick={fetchGSTR1} disabled={loading} className="h-10">
            {loading ? 'Loading...' : 'Generate GSTR-1'}
          </Button>
          <Button onClick={downloadCSV} disabled={!gstr1Data.length} variant="outline" className="h-10">
            Download CSV
          </Button>
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {gstr1Data.length > 0 && (
          <div className="overflow-auto max-h-96 border rounded bg-white">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  {Object.keys(gstr1Data[0]).map(h => (
                    <th key={h} className="border-b px-2 py-1 text-left bg-muted-foreground text-white">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gstr1Data.map((row, i) => (
                  <tr key={i}>
                    {Object.keys(row).map(h => (
                      <td key={h} className="border-b px-2 py-1">{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GSTFiling; 