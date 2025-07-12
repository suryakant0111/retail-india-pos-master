/**
 * Barcode utility functions for product management
 */

export interface BarcodeGeneratorOptions {
  prefix?: string;
  length?: number;
  startFrom?: number;
}

/**
 * Generates the next sequential barcode based on existing products
 * @param products Array of existing products
 * @param options Configuration options for barcode generation
 * @returns Next available barcode string
 */
export const generateNextBarcode = (
  products: any[], 
  options: BarcodeGeneratorOptions = {}
): string => {
  const {
    prefix = '',
    length = 13,
    startFrom = 1
  } = options;

  // Extract all numeric barcodes from existing products
  const existingBarcodes = products
    .map(p => p.barcode)
    .filter(barcode => barcode && /^\d+$/.test(barcode))
    .map(barcode => parseInt(barcode))
    .filter(num => !isNaN(num));

  // Find the maximum barcode number
  const maxBarcode = existingBarcodes.length > 0 
    ? Math.max(...existingBarcodes) 
    : startFrom - 1;

  // Generate next barcode
  const nextNumber = maxBarcode + 1;
  const paddedNumber = nextNumber.toString().padStart(length - prefix.length, '0');
  
  return `${prefix}${paddedNumber}`;
};

/**
 * Validates if a barcode is unique among existing products
 * @param barcode Barcode to validate
 * @param products Array of existing products
 * @param excludeId Product ID to exclude from validation (for updates)
 * @returns True if barcode is unique, false otherwise
 */
export const isBarcodeUnique = (
  barcode: string, 
  products: any[], 
  excludeId?: string
): boolean => {
  if (!barcode) return true;
  
  return !products.some(product => 
    product.barcode === barcode && product.id !== excludeId
  );
};

/**
 * Formats a barcode for display
 * @param barcode Raw barcode string
 * @returns Formatted barcode string
 */
export const formatBarcode = (barcode: string): string => {
  if (!barcode) return '';
  
  // Add spaces every 4 characters for better readability
  return barcode.replace(/(.{4})/g, '$1 ').trim();
};

/**
 * Generates a random barcode for testing purposes
 * @param length Length of the barcode
 * @returns Random barcode string
 */
export const generateRandomBarcode = (length: number = 13): string => {
  const digits = '0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  
  return result;
};

/**
 * Validates barcode format
 * @param barcode Barcode to validate
 * @returns True if barcode format is valid
 */
export const isValidBarcodeFormat = (barcode: string): boolean => {
  if (!barcode) return true;
  
  // Check if it's numeric and has reasonable length
  return /^\d{8,15}$/.test(barcode);
}; 