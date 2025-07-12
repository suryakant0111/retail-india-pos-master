import { Product } from '@/types';

export interface BarcodeProductData {
  name?: string;
  brand?: string;
  category?: string;
  description?: string;
  image_url?: string;
  barcode: string;
  found: boolean;
  error?: string;
}

export interface BarcodeScanResult {
  success: boolean;
  barcode?: string;
  error?: string;
}

/**
 * Barcode scanning and product data fetching service
 */
export class BarcodeService {
  private static instance: BarcodeService;
  
  public static getInstance(): BarcodeService {
    if (!BarcodeService.instance) {
      BarcodeService.instance = new BarcodeService();
    }
    return BarcodeService.instance;
  }

  /**
   * Fetch product data from online databases using barcode
   */
  async fetchProductData(barcode: string): Promise<BarcodeProductData> {
    try {
      // Try multiple sources for product data
      const sources = [
        this.fetchFromOpenFoodFacts,
        this.fetchFromBarcodeLookup,
        this.fetchFromProductAPI
      ];

      for (const source of sources) {
        try {
          const data = await source(barcode);
          if (data.found) {
            return data;
          }
        } catch (error) {
          console.warn(`Failed to fetch from source:`, error);
          continue;
        }
      }

      // Return empty data if no sources found the product
      return {
        barcode,
        found: false
      };
    } catch (error) {
      console.error('Error fetching product data:', error);
      return {
        barcode,
        found: false,
        error: 'Failed to fetch product data'
      };
    }
  }

  /**
   * Fetch product data from Open Food Facts database
   */
  private async fetchFromOpenFoodFacts(barcode: string): Promise<BarcodeProductData> {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();

    if (data.status === 1 && data.product) {
      const product = data.product;
      return {
        name: product.product_name || product.product_name_en,
        brand: product.brands,
        category: product.categories_tags?.[0]?.replace('en:', ''),
        description: product.generic_name || product.product_name,
        image_url: product.image_front_url,
        barcode,
        found: true
      };
    }

    return { barcode, found: false };
  }

  /**
   * Fetch product data from Barcode Lookup API
   */
  private async fetchFromBarcodeLookup(barcode: string): Promise<BarcodeProductData> {
    // This would require an API key - using a mock for now
    // In production, you'd need to sign up for an API key
    const mockData = {
      '1234567890123': {
        name: 'Sample Product',
        brand: 'Sample Brand',
        category: 'Food & Beverages',
        description: 'A sample product for testing',
        image_url: 'https://via.placeholder.com/300x300'
      }
    };

    const productData = mockData[barcode as keyof typeof mockData];
    if (productData) {
      return {
        ...productData,
        barcode,
        found: true
      };
    }

    return { barcode, found: false };
  }

  /**
   * Fetch product data from a generic product API
   */
  private async fetchFromProductAPI(barcode: string): Promise<BarcodeProductData> {
    // This is a placeholder for any other product API you might want to use
    // You could integrate with APIs like:
    // - UPC Database
    // - Amazon Product API
    // - Google Shopping API
    // - Custom product database

    return { barcode, found: false };
  }

  /**
   * Validate barcode format
   */
  validateBarcode(barcode: string): boolean {
    // Basic validation for common barcode formats
    const patterns = [
      /^\d{8}$/,   // EAN-8
      /^\d{12}$/,  // UPC-A
      /^\d{13}$/,  // EAN-13
      /^\d{14}$/,  // GTIN-14
    ];

    return patterns.some(pattern => pattern.test(barcode));
  }

  /**
   * Generate a test barcode for development
   */
  generateTestBarcode(): string {
    // Generate a valid EAN-13 barcode for testing
    const digits = '1234567890123';
    return digits;
  }
}

export const barcodeService = BarcodeService.getInstance(); 