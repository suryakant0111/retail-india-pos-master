
import React from 'react';
import { CartItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { UnitSelector } from './UnitSelector';
import { convertUnit } from '@/lib/utils';

interface CartItemCardProps {
  item: CartItem;
  index: number;
  onRemove: () => void;
  onUpdateQuantity: (qty: number) => void;
  onUpdateQuantityWithUnit: (qty: number, unitLabel: string) => void;
  onUpdatePrice: (price: number) => void;
  posMode?: 'retail' | 'kirana';
  unitLabel?: string;
  unitType?: 'unit' | 'weight' | 'volume' | 'length';
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdateQuantity, 
  onUpdateQuantityWithUnit,
  onUpdatePrice,
  posMode = 'retail',
  unitLabel,
  unitType
}) => {
  const [inputValue, setInputValue] = useState(
    item.convertedQuantity ? item.convertedQuantity.toString() : item.quantity.toString()
  );
  const [inputError, setInputError] = useState('');
  const [priceInput, setPriceInput] = useState(item.price.toString());
  const originalPrice = item.product?.price;

  // Determine display name and unit label
  const displayName = item.product ? item.product.name : item.name || 'Custom Item';
  const displayUnitLabel = item.convertedUnitLabel || item.unitLabel || unitLabel || item.product?.unitLabel || (posMode === 'kirana' ? 'kg' : 'pcs');

  // Sync inputValue with converted quantity if available, otherwise use original quantity
  React.useEffect(() => {
    setInputValue(
      item.convertedQuantity ? item.convertedQuantity.toString() : item.quantity.toString()
    );
  }, [item.convertedQuantity, item.quantity]);

  React.useEffect(() => {
    setPriceInput(item.price.toString());
  }, [item.price]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (posMode === 'kirana') {
      // Allow decimals for kirana
      val = val.replace(/[^0-9.]/g, '');
    } else {
      // Only allow integers for retail
      val = val.replace(/[^0-9]/g, '');
    }
    setInputValue(val);
    setInputError('');
  };

  const handleInputBlurOrEnter = () => {
    let val = posMode === 'kirana' ? parseFloat(inputValue) : parseInt(inputValue, 10);
    if (isNaN(val) || val < 0.01) val = posMode === 'kirana' ? 0.01 : 1;
    if (item.product?.stock && val > item.product.stock) {
      setInputError(`Max available: ${item.product.stock}`);
      val = item.product.stock;
    }
    setInputValue(val.toString());
    onUpdateQuantity(val);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setPriceInput(val);
  };
  const handlePriceBlurOrEnter = () => {
    let val = parseFloat(priceInput);
    if (isNaN(val) || val <= 0) val = originalPrice || 1;
    setPriceInput(val.toString());
    if (val !== item.price) onUpdatePrice(val);
  };

  return (
    <Card className="mb-2 shadow-sm border p-2">
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div className="flex-1">
            <div className="font-medium">{displayName}</div>
            {item.variant && (
              <div className="text-sm text-muted-foreground">
                {Object.entries(item.variant.attributes)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')}
              </div>
            )}
            <div className="text-sm flex items-center gap-2">
              <input
                type="number"
                min={1}
                step={0.01}
                value={priceInput}
                onChange={handlePriceChange}
                onBlur={handlePriceBlurOrEnter}
                onKeyDown={e => { if (e.key === 'Enter') handlePriceBlurOrEnter(); }}
                className="w-20 text-center border rounded mr-1"
                style={{ width: 80 }}
              />
              <span className="text-xs text-muted-foreground">× {item.quantity} {displayUnitLabel}</span>
              {originalPrice !== undefined && parseFloat(priceInput) < originalPrice && (
                <span className="ml-2 text-xs text-red-500 line-through">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(originalPrice)}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(item.price * item.quantity)}
            </div>
            <div className="text-xs text-muted-foreground">
              GST: {item.product?.tax ?? 0}%
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <Button variant="outline" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
          
                      <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUpdateQuantity(item.quantity - (posMode === 'kirana' ? 0.1 : 1))}
                disabled={item.quantity <= (posMode === 'kirana' ? 0.1 : 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex flex-col items-center mx-2">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    min={posMode === 'kirana' ? 0.01 : 1}
                    step={posMode === 'kirana' ? 0.01 : 1}
                    max={item.product?.stock}
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlurOrEnter}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleInputBlurOrEnter();
                    }}
                    className={`w-16 text-center border rounded ${inputError ? 'border-red-500' : ''}`}
                    style={{ width: 64 }}
                    disabled={item.product?.stock === 0}
                  />
                  {/* Unit selector for weight/volume products */}
                  {(item.unitType === 'weight' || item.unitType === 'volume') && (
                    <UnitSelector
                      value={item.convertedUnitLabel || item.unitLabel || 'kg'}
                      onChange={(newUnit) => {
                        const currentQty = parseFloat(inputValue) || 0;
                        const currentUnit = item.convertedUnitLabel || item.unitLabel || 'kg';
                        
                        // Convert current display quantity to new unit
                        const convertedQty = convertUnit(currentQty, currentUnit, newUnit);
                        
                        onUpdateQuantityWithUnit(convertedQty, newUnit);
                      }}
                      unitType={item.unitType}
                      className="w-12"
                    />
                  )}
                </div>
                {inputError && <span className="text-xs text-red-500">{inputError}</span>}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUpdateQuantity(item.quantity + (posMode === 'kirana' ? 0.1 : 1))}
                disabled={item.product?.stock && item.quantity >= item.product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};
