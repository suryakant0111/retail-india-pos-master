import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { UnitSelector } from '@/components/pos/UnitSelector';
import { convertUnit } from '@/lib/utils';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// ExcelCartQuantityInput moved here for encapsulation
const ExcelCartQuantityInput = ({
  value,
  unitType,
  convertedUnitLabel,
  index,
  updateQuantity,
  updateQuantityWithUnit,
  toast
}: {
  value: number,
  unitType?: string,
  convertedUnitLabel?: string,
  index: number,
  updateQuantity: (index: number, qty: number) => void,
  updateQuantityWithUnit: (index: number, qty: number, unitLabel: string) => void,
  toast: any
}) => {
  const [inputValue, setInputValue] = React.useState(value.toString());
  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);
  const handleCommit = () => {
    let newQty = parseFloat(inputValue);
    if (isNaN(newQty) || newQty <= 0) {
      newQty = (unitType === 'weight' || unitType === 'volume') ? 0.01 : 1;
      setInputValue(newQty.toString());
      toast({
        title: 'Invalid Quantity',
        description: 'Quantity must be at least 1',
        variant: 'destructive',
      });
    }
    if (convertedUnitLabel) {
      updateQuantityWithUnit(index, newQty, convertedUnitLabel);
    } else {
      updateQuantity(index, newQty);
    }
  };
  const step = (unitType === 'weight' || unitType === 'volume') ? 0.01 : 1;
  const min = (unitType === 'weight' || unitType === 'volume') ? 0.01 : 1;
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold"
        onClick={() => {
          let newQty = parseFloat(inputValue) - step;
          if (newQty < min) newQty = min;
          setInputValue(newQty.toString());
          if (convertedUnitLabel) {
            updateQuantityWithUnit(index, newQty, convertedUnitLabel);
          } else {
            updateQuantity(index, newQty);
          }
        }}
        tabIndex={-1}
      >
        -
      </button>
      <Input
        type="number"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={e => {
          if (e.key === 'Enter') handleCommit();
        }}
        className="w-20 border-0 p-0 bg-transparent text-center"
        min={min}
        step={step}
      />
      <button
        type="button"
        className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold"
        onClick={() => {
          let newQty = parseFloat(inputValue) + step;
          setInputValue(newQty.toString());
          if (convertedUnitLabel) {
            updateQuantityWithUnit(index, newQty, convertedUnitLabel);
          } else {
            updateQuantity(index, newQty);
          }
        }}
        tabIndex={-1}
      >
        +
      </button>
    </div>
  );
};

export const ExcelCart = ({
  items,
  customers,
  customer,
  setCustomer,
  newCustomerDialog,
  setNewCustomerDialog,
  newCustomer,
  setNewCustomer,
  handleAddNewCustomer,
  refreshCustomers,
  updateQuantity,
  updateQuantityWithUnit,
  updatePrice,
  removeItem,
  toast,
  cartType,
  subtotal,
  taxRate,
  setTaxRate,
  taxTotal,
  discountValue,
  setDiscountValue,
  discountType,
  setDiscountType,
  total,
  openPaymentDialog,
  products,
  addItem
}: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: '', unit: 'pcs' });
  const filteredProducts = products?.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  ) || [];

  // Discounted subtotal calculation
  let discountedSubtotal = subtotal;
  if (discountType === 'percentage') {
    discountedSubtotal = subtotal * (1 - (discountValue / 100));
  } else {
    discountedSubtotal = subtotal - discountValue;
  }
  discountedSubtotal = Math.max(0, discountedSubtotal);

  // Tax calculation based on discounted subtotal
  const calculatedTax = discountedSubtotal * (taxRate / 100);
  const calculatedTotal = discountedSubtotal + calculatedTax;

  const handleAddNewProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.quantity) return;
    addItem({
      id: `adhoc-${Date.now()}`,
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      stock: 0,
      unitLabel: newProduct.unit,
      isAdhoc: true,
    }, parseFloat(newProduct.quantity));
    setShowNewProduct(false);
    setNewProduct({ name: '', price: '', quantity: '', unit: 'pcs' });
  };

  return (
    <div className="mt-8 p-4 bg-gray-50 rounded-lg transition-all duration-300">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-2">Excel Cart</h2>
          <p className="text-sm text-gray-600">Table-style cart layout</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddProduct(true)}>
            + Add Product
          </Button>
          {/* Removed 'New Product' button */}
        </div>
      </div>
      {/* Add Product Modal */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product to Cart</DialogTitle>
          </DialogHeader>
          <Input
            type="text"
            placeholder="Search product by name or barcode..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full mb-2"
          />
          <div className="max-h-64 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No products found.</div>
            ) : (
              filteredProducts.slice(0, 12).map((product: any) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 cursor-pointer border-b"
                  onClick={() => {
                    addItem(product, 1);
                    setShowAddProduct(false);
                    setSearchTerm('');
                  }}
                >
                  <span>{product.name} {product.barcode && <span className="text-xs text-gray-400 ml-2">({product.barcode})</span>}</span>
                  <Button size="sm" variant="outline">Add</Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Always-visible Ad-hoc Product Inputs */}
      <div className="mb-4 p-3 bg-white rounded-lg border shadow-sm flex flex-col md:flex-row gap-2 items-end">
        <Input
          type="text"
          placeholder="Product name"
          value={newProduct.name}
          onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
          required
          className="md:w-40"
        />
        <Input
          type="number"
          placeholder="Price"
          value={newProduct.price}
          onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
          min="0"
          step="0.01"
          required
          className="md:w-28"
        />
        <Input
          type="number"
          placeholder="Quantity"
          value={newProduct.quantity}
          onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })}
          min="0.01"
          step="0.01"
          required
          className="md:w-28"
        />
        <select
          value={newProduct.unit}
          onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}
          className="border rounded px-2 py-1 text-sm md:w-24"
        >
          <option value="pcs">pcs</option>
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="L">L</option>
          <option value="ml">ml</option>
        </select>
        <Button onClick={handleAddNewProduct} className="md:w-32" disabled={!newProduct.name || !newProduct.price || !newProduct.quantity}>
          Add to Cart
        </Button>
      </div>
      {/* Forgotten Items Quick Add (search bar) */}
      <div className="mb-4 p-3 bg-white rounded-lg border shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-1">Quick Add by Name/Barcode</label>
        <div className="flex gap-2 items-center relative">
          <Input
            type="text"
            placeholder="Search product by name or barcode..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-64"
          />
          {searchTerm && filteredProducts.length > 0 && (
            <div className="absolute left-0 top-10 bg-white border rounded shadow z-10 w-64 max-h-48 overflow-y-auto">
              {filteredProducts.slice(0, 8).map((product: any) => (
                <div
                  key={product.id}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
                  onClick={() => {
                    addItem(product, 1);
                    setSearchTerm('');
                  }}
                >
                  <span className="flex-1">{product.name} {product.barcode && <span className="text-xs text-gray-400 ml-2">({product.barcode})</span>}</span>
                  <Button size="sm" variant="outline" className="ml-2">+</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Excel-style Cart Layout */}
      <div className="space-y-4">
        {/* Customer Selection */}
        <div className="flex gap-2">
          <Select 
            value={customer?.id || ''} 
            onValueChange={(value) => {
              if (value === 'walkin') {
                setCustomer(null);
              } else {
                const selectedCustomer = customers.find((c: any) => c.id === value);
                if (selectedCustomer) {
                  setCustomer(selectedCustomer);
                }
              }
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walkin">Walk-in Customer</SelectItem>
              {customers.map((customer: any) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setNewCustomerDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Customer
          </Button>
        </div>
        {/* Cart Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Qty</th>
                <th className="px-4 py-2 text-left">Price</th>
                <th className="px-4 py-2 text-left">Total</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No items in cart
                  </td>
                </tr>
              ) : (
                items.map((item: any, index: number) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium">{item.product.name && item.product.name !== "0" ? item.product.name : ""}</div>
                        {(item.unitType === 'weight' || item.unitType === 'volume') && (
                          <div className="text-xs text-gray-500">
                            {item.unitLabel} • Price per {item.unitLabel}: ₹{item.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <ExcelCartQuantityInput
                          value={item.convertedQuantity || item.quantity}
                          unitType={item.unitType}
                          convertedUnitLabel={item.convertedUnitLabel}
                          index={index}
                          updateQuantity={updateQuantity}
                          updateQuantityWithUnit={updateQuantityWithUnit}
                          toast={toast}
                        />
                        {(item.unitType === 'weight' || item.unitType === 'volume') ? (
                          <UnitSelector
                            value={item.convertedUnitLabel || item.unitLabel || 'kg'}
                            onChange={(newUnit: string) => {
                              const currentDisplayQty = item.convertedQuantity || item.quantity;
                              const currentUnit = item.convertedUnitLabel || item.unitLabel || 'kg';
                              const originalUnit = item.originalUnitLabel || item.unitLabel || 'kg';
                              const convertedQty = convertUnit(currentDisplayQty, currentUnit, newUnit);
                              updateQuantityWithUnit(index, convertedQty, newUnit);
                            }}
                            unitType={item.unitType}
                            className="w-12"
                          />
                        ) : (
                          <span className="text-xs text-gray-500">{item.unitLabel || 'pcs'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            updatePrice(index, newPrice);
                          }}
                          className="w-24 border-0 p-0 bg-transparent"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-xs text-gray-500">₹/{item.unitLabel || 'pcs'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">
                        ₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                      </div>
                      {(item.unitType === 'weight' || item.unitType === 'volume') && item.product.tareWeight && item.product.tareWeight > 0 && (
                        <div className="text-xs text-gray-500">
                          Net: {item.quantity - item.product.tareWeight} {item.unitLabel}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          removeItem(index);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Summary */}
        {items.length > 0 && (
          <div className="space-y-4 bg-white p-4 rounded-lg border">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {/* Discount Section */}
              <div className="flex items-center gap-2">
                <span>Discount</span>
                <Input
                  type="number"
                  className="w-20"
                  value={discountValue}
                  onChange={e => setDiscountValue(Number(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">₹</option>
                </select>
              </div>
              <div className="flex justify-between">
                <span>Discounted Subtotal</span>
                <span>₹{discountedSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Tax Rate (%)</span>
                <Input 
                  type="number" 
                  className="w-20" 
                  value={taxRate}
                  onChange={(e) => {
                    const newTaxRate = parseFloat(e.target.value) || 0;
                    setTaxRate(newTaxRate);
                  }}
                  min="0"
                  max="100"
                  step="0.01"
                />
                <span>%</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>₹{calculatedTax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{calculatedTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={() => openPaymentDialog('cash')} className="w-full">
                Pay with Cash
              </Button>
              <Button onClick={() => openPaymentDialog('upi')} variant="outline" className="w-full">
                Pay with UPI
              </Button>
              <Button onClick={() => openPaymentDialog('card')} variant="outline" className="w-full">
                Pay with Card
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 