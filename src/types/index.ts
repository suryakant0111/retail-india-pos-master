
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string; // Added gstin for GST Identification Number
  loyaltyPoints?: number;
  totalPurchases?: number;
  createdAt: Date;
  updatedAt: Date;
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
  product: Product;
  quantity: number;
  price: number;
  variant?: ProductVariant; // Add variant property
  taxAmount?: number; // Add taxAmount property
  totalPrice?: number; // Add totalPrice property
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  costPrice?: number; // Add costPrice property
  tax: number;
  taxRate?: number; 
  hsn?: string;     
  stock: number;
  minStock?: number; // Add minStock property
  barcode?: string;
  image?: string;    // Add image property
  isActive: boolean;
  variants?: ProductVariant[]; // Add variants property
  createdAt: Date;
  updatedAt: Date;
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
}

export interface SalesSummary {
  dailySales: number;
  weeklySales: number;
  monthlySales: number;
  topProducts: { name: string; sales: number }[];
}
