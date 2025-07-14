import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UnitSelectorProps {
  value: string;
  onChange: (value: string) => void;
  unitType?: 'unit' | 'weight' | 'volume' | 'length';
  className?: string;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({
  value,
  onChange,
  unitType = 'unit',
  className = ''
}) => {
  const getUnits = () => {
    switch (unitType) {
      case 'weight':
        return ['kg', 'g'];
      case 'volume':
        return ['L', 'ml'];
      case 'length':
        return ['m', 'cm'];
      case 'unit':
      default:
        return ['pcs', 'units'];
    }
  };

  const units = getUnits();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-16 ${className}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {units.map(unit => (
          <SelectItem key={unit} value={unit}>
            {unit.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}; 