import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Unit conversion utilities
export const convertUnit = (value: number, fromUnit: string, toUnit: string): number => {
  // Weight conversions
  if (fromUnit === 'kg' && toUnit === 'g') return value * 1000;
  if (fromUnit === 'g' && toUnit === 'kg') return value / 1000;
  
  // Volume conversions
  if (fromUnit === 'L' && toUnit === 'ml') return value * 1000;
  if (fromUnit === 'ml' && toUnit === 'L') return value / 1000;
  
  // Length conversions
  if (fromUnit === 'm' && toUnit === 'cm') return value * 100;
  if (fromUnit === 'cm' && toUnit === 'm') return value / 100;
  
  // Same unit
  if (fromUnit === toUnit) return value;
  
  // Default: no conversion possible
  return value;
};

export const getAvailableUnits = (unitType: string): string[] => {
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

export const formatQuantity = (quantity: number, unitLabel: string): string => {
  return `${quantity} ${unitLabel}`;
};
