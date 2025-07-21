
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string; // Added gstin for GST Identification Number
  loyaltyPoints?: number;
  totalPurchases?: number;
  creditLimit?: number; // Kirana: Credit limit for customer
  outstandingBalance?: number; // Kirana: Current outstanding amount
  creditEnabled?: boolean; // Kirana: Whether credit sales are enabled for this customer
  createdAt: Date;
  updatedAt: Date;
  shop_id?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  barcode?: string;
}

export interface CartItem {
  product?: Product; // Optional for custom/manual items
  quantity: number;
  price: number;
  name?: string; // For custom/manual items
  unitType?: 'unit' | 'weight' | 'volume' | 'length';
  unitLabel?: string;
  variant?: ProductVariant; // Add variant property
  taxAmount?: number; // Add taxAmount property
  totalPrice?: number; // Add totalPrice property
  // Unit conversion fields
  originalQuantity?: number; // Original quantity in product's unit
  originalUnitLabel?: string; // Original unit label from product
  convertedQuantity?: number; // Quantity in customer's preferred unit
  convertedUnitLabel?: string; // Customer's preferred unit
  batchId?: string | null; // Selected stock batch for this cart item
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  costPrice?: number; // Add costPrice property
  pricePerUnit?: number; // Kirana: Price per unit (for weight products)
  unitPrice?: number; // Kirana: Unit price
  tax: number;
  taxRate?: number; 
  hsn?: string;     
  stock: number;
  minStock?: number; // Add minStock property
  barcode?: string;
  image?: string;    // Add image property
  image_url?: string; // Add image_url property for Cloudinary
  isActive: boolean;
  variants?: ProductVariant[]; // Add variants property
  createdAt: Date;
  updatedAt: Date;
  shop_id?: string;
  unitType?: 'unit' | 'weight' | 'volume' | 'length'; // 'unit' (pcs), 'weight' (kg/g), 'volume' (L/ml), 'length' (m/cm)
  unitLabel?: string; // e.g., 'kg', 'g', 'L', 'ml', 'pcs'
  stockByWeight?: number; // Stock quantity in weight/volume units
  tareWeight?: number; // Tare weight for containers (default 0)
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  avatar?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  items: CartItem[];
  customer?: Customer;
  subtotal: number;
  taxTotal: number;
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'partial';
  createdBy: string;
  createdAt: Date;
  businessDetails: any;
  paymentDetails: any;
  shop_id?: string;
}

export interface SalesSummary {
  dailySales: number;
  weeklySales: number;
  monthlySales: number;
  topProducts: { name: string; sales: number }[];
}

// Kirana-specific interfaces
export interface CustomerLedger {
  id: string;
  customerId: string;
  shopId: string;
  transactionType: 'credit' | 'payment' | 'adjustment';
  amount: number;
  description?: string;
  invoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeightProduct {
  id: string;
  shopId: string;
  productId: string;
  pricePerKg: number;
  pricePerGram?: number;
  currentWeight: number;
  unitType: 'kg' | 'g' | 'L' | 'ml';
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopSettings {
  id: string;
  shopId: string;
  posMode: 'retail' | 'kirana';
  weightUnits: string[];
  defaultTaxRate: number;
  enableCreditSales: boolean;
  enableWeightProducts: boolean;
  enableGstTracking: boolean;
  paymentSettings: Record<string, any>;
  businessSettings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface KiranaCartItem extends CartItem {
  weight?: number; // For weight-based products
  weightUnit?: string; // kg, g, L, ml
  pricePerUnit?: number; // Price per kg/g/L/ml
}

export interface StockAdjustment {
  id: string;
  productId?: string; // Optional, for legacy/camelCase use
  product_id?: string; // Supabase/DB snake_case
  batch_id?: string; // For linking out adjustments to in batches
  quantity: number; // positive for addition, negative for removal
  type: 'in' | 'out'; // 'in' for new stock, 'out' for removal/loss
  note?: string;
  createdAt?: Date; // Optional, for camelCase
  created_at?: string; // Supabase/DB snake_case
  userId?: string; // who did the adjustment
  user_id?: string; // Supabase/DB snake_case
}
