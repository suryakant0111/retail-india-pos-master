
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  costPrice?: number;
  tax: number;
  hsnCode?: string;
  barcode?: string;
  stock: number;
  minStock?: number;
  image?: string;
  variants?: ProductVariant[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  name: string;
  attributes: {
    [key: string]: string; // e.g., { size: 'L', color: 'Red' }
  };
  price: number;
  stock: number;
  barcode?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  loyaltyPoints?: number;
  totalPurchases?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  taxAmount: number;
  totalPrice: number;
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
  paymentMethod: 'cash' | 'upi' | 'card' | 'credit';
  paymentStatus: 'pending' | 'paid' | 'partial';
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface SalesSummary {
  dailySales: number;
  weeklySales: number;
  monthlySales: number;
  topProducts: {
    name: string;
    sales: number;
  }[];
}
