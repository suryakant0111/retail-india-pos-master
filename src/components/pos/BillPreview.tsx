import React from 'react';
import { Customer, CartItem } from '@/types';

export interface BillPreviewProps {
  shopName: string;
  addressLines: string[];
  phone: string;
  gstin: string;
  state: string;
  billNo: string;
  date: string;
  time: string;
  cashier: string;
  counter?: string; // Make counter optional
  customer: Partial<Customer>;
  items: Array<{
    name: string;
    quantity: number;
    unitLabel?: string;
    price: number;
    totalPrice: number;
    taxRate?: number;
    taxAmount?: number;
  }>;
  subtotal: number;
  discount: number;
  taxableAmount: number;
  taxes: Array<{ name: string; rate: number; taxable: number; amount: number }>;
  total: number;
  amountInWords: string;
  paymentMethod: string;
  cashReceived: number;
  change: number;
  terms?: string[];
  discountType: 'percentage' | 'fixed';
}

export const BillPreview: React.FC<BillPreviewProps> = ({
  shopName,
  addressLines,
  phone,
  gstin,
  state,
  billNo,
  date,
  time,
  cashier,
  counter,
  customer,
  items,
  subtotal,
  discount,
  taxableAmount,
  taxes,
  total,
  amountInWords,
  paymentMethod,
  cashReceived,
  change,
  terms = [
    '* Goods once sold will not be taken back',
    '* All disputes subject to local jurisdiction',
  ],
  discountType,
}) => {
  // Debug log for all props
  console.log('BillPreview received props:', {
    shopName,
    addressLines,
    phone,
    gstin,
    state,
    billNo,
    date,
    time,
    cashier,
    counter,
    customer,
    items,
    subtotal,
    discount,
    taxableAmount,
    taxes,
    total,
    amountInWords,
    paymentMethod,
    cashReceived,
    change,
    terms,
    discountType,
  });
  if (!shopName || !addressLines?.[0] || !phone || !gstin || !state) {
    console.warn('BillPreview: One or more shop details are missing!', { shopName, addressLines, phone, gstin, state });
  }

  // Calculate values to match CartContext logic
  const computedTaxableAmount = taxableAmount;
  // Try to get a single tax rate from taxes array, fallback to 0
  const computedTaxTotal = taxes.reduce((sum, tax) => sum + tax.amount, 0);

  const computedTotal = computedTaxableAmount + computedTaxTotal;

  return (
    <div className="invoice" style={{ width: '80mm', fontFamily: 'Courier New, monospace', fontSize: 10, margin: 0, padding: 0, lineHeight: 1.2 }}>
      {/* Header */}
      <div className="header" style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: 5, marginBottom: 8 }}>
        <div className="shop-name" style={{ fontSize: 14, fontWeight: 'bold', margin: '2px 0' }}>{shopName}</div>
        {addressLines.map((line, i) => (
          <div className="address" style={{ fontSize: 9, margin: '1px 0' }} key={i}>{line}</div>
        ))}
        <div className="address" style={{ fontSize: 9, margin: '1px 0' }}>Phone: {phone}</div>
        <div className="gst-info" style={{ fontSize: 9, margin: '2px 0' }}>GSTIN: {gstin}</div>
        <div className="gst-info" style={{ fontSize: 9, margin: '2px 0' }}>State: {state}</div>
        <div className="invoice-title" style={{ fontSize: 12, fontWeight: 'bold', margin: '5px 0', textDecoration: 'underline' }}>TAX INVOICE</div>
      </div>

      {/* Bill Details */}
      <div className="bill-details" style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', fontSize: 9 }}>
        <div>
          <strong>Bill No:</strong> {billNo}<br />
          <strong>Date:</strong> {date}<br />
          <strong>Time:</strong> {time}
        </div>
        <div>
          <strong>Cashier:</strong> {cashier}<br />
          {counter ? (<><strong>Counter:</strong> {counter}</>) : null}
        </div>
      </div>

      {/* Customer Info */}
      <div className="customer-info" style={{ margin: '5px 0', fontSize: 9, borderBottom: '1px dashed #000', paddingBottom: 5 }}>
        <strong>Bill To:</strong> {customer?.name || 'Walk-in Customer'}<br />
        <strong>Phone:</strong> {customer?.phone || '-'}<br />
        <strong>GSTIN:</strong> {customer?.gstin || 'Unregistered'}
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '5px 0' }}>
        <thead className="table-header" style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: 9 }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '3px 2px' }}>Item Description</th>
            <th style={{ width: '18%', textAlign: 'center', padding: '3px 2px' }}>Qty</th>
            <th style={{ width: '18%', textAlign: 'right', padding: '3px 2px' }}>Rate</th>
            <th style={{ width: '18%', textAlign: 'right', padding: '3px 2px' }}>Amount</th>
            <th style={{ width: '18%', textAlign: 'right', padding: '3px 2px' }}>Tax</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: '2px 2px', fontSize: 9, borderBottom: '1px dotted #ccc' }}>{item.name}</td>
              <td className="qty" style={{ textAlign: 'center', padding: '2px 2px', fontSize: 9, borderBottom: '1px dotted #ccc' }}>{item.quantity} {item.unitLabel}</td>
              <td className="rate" style={{ textAlign: 'right', padding: '2px 2px', fontSize: 9, borderBottom: '1px dotted #ccc' }}>₹{item.price.toFixed(2)}</td>
              <td className="amount" style={{ textAlign: 'right', padding: '2px 2px', fontSize: 9, borderBottom: '1px dotted #ccc' }}>₹{item.totalPrice?.toFixed(2) ?? (item.price * item.quantity).toFixed(2)}</td>
              <td className="tax" style={{ textAlign: 'right', padding: '2px 2px', fontSize: 9, borderBottom: '1px dotted #ccc' }}>{item.taxRate ? `${item.taxRate}%` : '-'}{item.taxAmount ? ` (₹${item.taxAmount.toFixed(2)})` : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Subtotal Section */}
      <div className="subtotal-section" style={{ borderTop: '1px solid #000', marginTop: 5, paddingTop: 3 }}>
        <div className="subtotal-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: 9 }}>
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="subtotal-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: 9 }}>
          <span>
            Discount{discountType === 'percentage' ? ` (${discount}%)` : ''}:
          </span>
          <span>
            -₹{discountType === 'percentage'
              ? (subtotal * (discount / 100)).toFixed(2)
              : discount.toFixed(2)}
          </span>
        </div>
        <div className="subtotal-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: 9 }}>
          <span>Taxable Amount:</span>
          <span>₹{computedTaxableAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="tax-summary" style={{ margin: '5px 0', fontSize: 8, border: '1px solid #000', padding: 3 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: '1px 2px', fontSize: 8, textAlign: 'center' }}>Tax</th>
              <th style={{ padding: '1px 2px', fontSize: 8, textAlign: 'center' }}>Rate</th>
              <th style={{ padding: '1px 2px', fontSize: 8, textAlign: 'center' }}>Taxable Amt</th>
              <th style={{ padding: '1px 2px', fontSize: 8, textAlign: 'center' }}>Tax Amt</th>
            </tr>
          </thead>
          <tbody>
            {taxes.map((tax, idx) => (
              <tr key={idx}>
                <td style={{ padding: '1px 2px', fontSize: 8, textAlign: 'center' }}>{tax.name}</td>
                <td style={{ padding: '1px 2px', fontSize: 8, textAlign: 'center' }}>{tax.rate}%</td>
                <td style={{ padding: '1px 2px', fontSize: 8, textAlign: 'center' }}>₹{computedTaxableAmount.toFixed(2)}</td>
                <td style={{ padding: '1px 2px', fontSize: 8, textAlign: 'center' }}>₹{(computedTaxableAmount * (tax.rate / 100)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: 10, fontWeight: 'bold', borderTop: '1px dashed #000', paddingTop: 3 }}>
        <span>TOTAL AMOUNT:</span>
        <span>₹{computedTotal.toFixed(2)}</span>
      </div>

      {/* Amount in Words */}
      <div className="amount-words" style={{ margin: '5px 0', fontSize: 9, fontWeight: 'bold' }}>
        Amount in Words: {amountInWords}
      </div>

      {/* Payment Method */}
      <div className="subtotal-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: 9 }}>
        <span>Payment Method:</span>
        <span>{paymentMethod}</span>
      </div>
      <div className="subtotal-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: 9 }}>
        <span>Cash Received:</span>
        <span>₹{cashReceived.toFixed(2)}</span>
      </div>
      <div className="subtotal-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: 9 }}>
        <span>Change:</span>
        <span>₹{change.toFixed(2)}</span>
      </div>

      {/* Terms */}
      <div className="terms" style={{ marginTop: 5, fontSize: 8, textAlign: 'center' }}>
        {terms.map((t, i) => (
          <div key={i}>{t}</div>
        ))}
      </div>

      {/* Signature */}
      <div className="signature" style={{ textAlign: 'right', marginTop: 10, fontSize: 9 }}>
        <br />
        _______________<br />
        Authorized Signatory
      </div>

      {/* Footer */}
      <div className="footer" style={{ textAlign: 'center', marginTop: 8, fontSize: 9, borderTop: '1px dashed #000', paddingTop: 5 }}>
        <p>Thank you for shopping with us!</p>
        <p>Visit again</p>
        <p style={{ fontSize: 8 }}>This is a computer generated invoice</p>
      </div>
    </div>
  );
};

export default BillPreview; 