import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CartItem } from '@/types';
import { getAvailableUnits, convertUnit, formatQuantity } from '@/lib/utils';

interface CartItemEditorProps {
  item: CartItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (quantity: number, unitLabel: string) => void;
}

export const CartItemEditor: React.FC<CartItemEditorProps> = ({
  item,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [quantity, setQuantity] = useState<number>(
    item.convertedQuantity || item.quantity
  );
  const [unitLabel, setUnitLabel] = useState<string>(
    item.convertedUnitLabel || item.unitLabel || 'pcs'
  );

  const availableUnits = getAvailableUnits(item.unitType || 'unit');
  const isWeightVolume = item.unitType === 'weight' || item.unitType === 'volume';

  const handleSave = () => {
    onUpdate(quantity, unitLabel);
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    setQuantity(item.convertedQuantity || item.quantity);
    setUnitLabel(item.convertedUnitLabel || item.unitLabel || 'pcs');
    onClose();
  };

  // Calculate converted quantity for display
  const getDisplayQuantity = () => {
    if (!isWeightVolume) return quantity;
    
    const originalUnit = item.originalUnitLabel || item.unitLabel || 'kg';
    const converted = convertUnit(quantity, unitLabel, originalUnit);
    return converted;
  };

  const getDisplayPrice = () => {
    const displayQty = getDisplayQuantity();
    return (item.price * displayQty).toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {item.product?.name || item.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step={isWeightVolume ? "0.001" : "1"}
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              placeholder="Enter quantity"
            />
          </div>

          {/* Unit Selection (only for weight/volume products) */}
          {isWeightVolume && (
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unitLabel} onValueChange={setUnitLabel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {availableUnits.map(unit => (
                    <SelectItem key={unit} value={unit}>
                      {unit.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Preview</div>
            <div className="text-sm text-muted-foreground">
              {isWeightVolume ? (
                <>
                  <div>Customer sees: {formatQuantity(quantity, unitLabel)}</div>
                  <div>System calculates: {formatQuantity(getDisplayQuantity(), item.unitLabel || 'kg')}</div>
                  <div>Total Price: ₹{getDisplayPrice()}</div>
                </>
              ) : (
                <>
                  <div>Quantity: {quantity} {unitLabel}</div>
                  <div>Total Price: ₹{getDisplayPrice()}</div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 