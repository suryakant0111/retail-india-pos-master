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

      const rows = data.map((inv: any) => {
        const customer = inv.customer || {};
        const items = inv.items || [];
        let taxableValue = 0, igst = 0, cgst = 0, sgst = 0, hsn = '', taxRate = 0;

        items.forEach((item: any) => {
          taxableValue += item.price * item.quantity;
          hsn = item.product?.hsn || '';
          taxRate = item.product?.tax || 0;
        });

        cgst = inv.taxTotal / 2;
        sgst = inv.taxTotal / 2;

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
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!gstr1Data.length) return;
    const header = Object.keys(gstr1Data[0]);
    const csvRows = [header.join(',')];
    for (const row of gstr1Data) {
      csvRows.push(
        header
          .map((h) => {
            const val = row[h];
            // Escape quotes and commas for CSV
            if (typeof val === 'string') {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return `"${val ?? ''}"`;
          })
          .join(',')
      );
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `GSTR-1_${fromDate || 'all'}_${toDate || 'all'}.csv`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">GST Filing & Reports</h1>
      <p className="mb-6 text-muted-foreground max-w-2xl">
        Generate and download GST-compliant sales reports (GSTR-1) for your business.
      </p>

      <section className="border rounded-lg p-6 bg-muted mb-8 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchGSTR1();
          }}
          className="flex flex-wrap gap-4 items-end"
          aria-label="GST Report Filters"
        >
          <div className="flex flex-col">
            <label htmlFor="fromDate" className="block text-sm font-medium mb-1">
              From Date
            </label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={toDate || undefined}
              aria-required="false"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="toDate" className="block text-sm font-medium mb-1">
              To Date
            </label>
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate || undefined}
              aria-required="false"
            />
          </div>
          <Button type="submit" disabled={loading} className="h-10 min-w-[140px]">
            {loading ? 'Generating...' : 'Generate GSTR-1'}
          </Button>
          <Button
            onClick={downloadCSV}
            disabled={!gstr1Data.length}
            variant="outline"
            className="h-10 min-w-[140px]"
            type="button"
          >
            Download CSV
          </Button>
        </form>

        {error && (
          <p role="alert" className="text-red-600 mt-4 font-semibold">
            {error}
          </p>
        )}

        {gstr1Data.length > 0 && (
          <div className="overflow-auto max-h-96 border rounded mt-6 bg-white shadow-inner">
            <table className="min-w-full text-xs border-collapse border border-gray-300">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  {Object.keys(gstr1Data[0]).map((h) => (
                    <th
                      key={h}
                      className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700"
                      scope="col"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gstr1Data.map((row, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    tabIndex={0}
                    aria-rowindex={i + 2}
                  >
                    {Object.keys(row).map((h) => (
                      <td key={h} className="border border-gray-300 px-2 py-1 whitespace-nowrap">
                        {typeof row[h] === 'number'
                          ? row[h].toLocaleString('en-IN')
                          : row[h] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default GSTFiling;
