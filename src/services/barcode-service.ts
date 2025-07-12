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
  // Additional fields for better product data
  ingredients?: string;
  nutrition?: string;
  weight?: string;
  country?: string;
  manufacturer?: string;
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
      console.log(`[BarcodeService] Fetching data for barcode: ${barcode}`);
      
      // Try multiple sources for product data
      const sources = [
        this.fetchFromOpenFoodFacts,
        this.fetchFromBarcodeLookup,
        this.fetchFromProductAPI,
        this.fetchFromUPCItemDB
      ];

      for (const source of sources) {
        try {
          const data = await source(barcode);
          if (data.found) {
            console.log(`[BarcodeService] Found product data from source:`, data);
            return data;
          }
        } catch (error) {
          console.warn(`[BarcodeService] Failed to fetch from source:`, error);
          continue;
        }
      }

      console.log(`[BarcodeService] No product data found for barcode: ${barcode}`);
      // Return empty data if no sources found the product
      return {
        barcode,
        found: false,
        error: 'No product data found in any database'
      };
    } catch (error) {
      console.error('[BarcodeService] Error fetching product data:', error);
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
        name: product.product_name || product.product_name_en || product.generic_name,
        brand: product.brands,
        category: product.categories_tags?.[0]?.replace('en:', '') || 'General',
        description: product.generic_name || product.product_name || product.brands || '',
        image_url: product.image_front_url || product.image_url,
        barcode,
        found: true,
        ingredients: product.ingredients_text,
        nutrition: product.nutrition_data_per,
        weight: product.quantity,
        country: product.countries_tags?.[0],
        manufacturer: product.manufacturing_places
      };
    }

    return { barcode, found: false };
  }

  /**
   * Fetch product data from UPC Item DB (free API)
   */
  private async fetchFromUPCItemDB(barcode: string): Promise<BarcodeProductData> {
    try {
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        return {
          name: item.title,
          brand: item.brand,
          category: item.category,
          description: item.description || item.title,
          image_url: item.images?.[0],
          barcode,
          found: true,
          weight: item.dimension,
          manufacturer: item.brand
        };
      }
    } catch (error) {
      console.warn('[BarcodeService] UPC Item DB fetch failed:', error);
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

  /**
   * Get sample barcodes for testing
   */
  getSampleBarcodes(): string[] {
    return [
      '049000006344', // Coca-Cola
      '028400090000', // Lay's Chips
      '049000006351', // Diet Coke
      '049000006368', // Sprite
      '049000006375', // Fanta
      '049000006382', // Barq's
      '049000006399', // Minute Maid
      '049000006405', // Powerade
      '049000006412', // Vitamin Water
      '049000006429'  // Smart Water
    ];
  }
}

export const barcodeService = BarcodeService.getInstance(); 