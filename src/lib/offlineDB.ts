import Dexie, { Table } from 'dexie';

export interface OfflineSale {
  id: string; // unique id (e.g., Date.now().toString())
  data: any;  // the invoice/sale object
  createdAt: number;
}

export interface OfflineCustomer {
  id: string; // unique id (e.g., Date.now().toString())
  data: any;  // the customer object
  createdAt: number;
}

export interface OfflineProductUpdate {
  id: string; // unique id (e.g., Date.now().toString())
  data: any;  // the product update object
  createdAt: number;
}

export interface OfflineBill {
  id: string;
  data: any;
  createdAt: number;
}

export interface OfflinePayment {
  id: string;
  data: any;
  createdAt: number;
}

export interface OfflineConflict {
  id: string;
  type: string;
  data: any;
  createdAt: number;
}

class OfflineDB extends Dexie {
  sales!: Table<OfflineSale, string>;
  customers!: Table<OfflineCustomer, string>;
  products!: Table<OfflineProductUpdate, string>;
  bills!: Table<OfflineBill, string>;
  payments!: Table<OfflinePayment, string>;
  conflicts!: Table<OfflineConflict, string>;

  constructor() {
    super('OfflinePOSDB');
    this.version(5).stores({
      sales: 'id, createdAt',
      customers: 'id, createdAt',
      products: 'id, createdAt',
      bills: 'id, createdAt',
      payments: 'id, createdAt',
      conflicts: 'id, createdAt',
    });
  }
}

export const offlineDB = new OfflineDB();

// --- Sales (existing) ---
export async function addOfflineSale(sale: OfflineSale) {
  await offlineDB.sales.add(sale);
}
export async function getOfflineSales(): Promise<OfflineSale[]> {
  return offlineDB.sales.toArray();
}
export async function removeOfflineSale(id: string) {
  await offlineDB.sales.delete(id);
}
export async function clearOfflineSales() {
  await offlineDB.sales.clear();
}

// --- Customers (new) ---
export async function addOfflineCustomer(customer: OfflineCustomer) {
  await offlineDB.customers.add(customer);
}
export async function getOfflineCustomers(): Promise<OfflineCustomer[]> {
  return offlineDB.customers.toArray();
}
export async function removeOfflineCustomer(id: string) {
  await offlineDB.customers.delete(id);
}
export async function clearOfflineCustomers() {
  await offlineDB.customers.clear();
}

// --- Products (new) ---
export async function addOfflineProductUpdate(productUpdate: OfflineProductUpdate) {
  await offlineDB.products.add(productUpdate);
}
export async function getOfflineProductUpdates(): Promise<OfflineProductUpdate[]> {
  return offlineDB.products.toArray();
}
export async function removeOfflineProductUpdate(id: string) {
  await offlineDB.products.delete(id);
}
export async function clearOfflineProductUpdates() {
  await offlineDB.products.clear();
}

// --- Bills ---
export async function addOfflineBill(bill: OfflineBill) {
  await offlineDB.bills.add(bill);
}
export async function getOfflineBills(): Promise<OfflineBill[]> {
  return offlineDB.bills.toArray();
}
export async function removeOfflineBill(id: string) {
  await offlineDB.bills.delete(id);
}
export async function clearOfflineBills() {
  await offlineDB.bills.clear();
}

// --- Payments ---
export async function addOfflinePayment(payment: OfflinePayment) {
  await offlineDB.payments.add(payment);
}
export async function getOfflinePayments(): Promise<OfflinePayment[]> {
  return offlineDB.payments.toArray();
}
export async function removeOfflinePayment(id: string) {
  await offlineDB.payments.delete(id);
}
export async function clearOfflinePayments() {
  await offlineDB.payments.clear();
}

// --- Conflict Log ---
export async function addOfflineConflict(conflict: OfflineConflict) {
  await offlineDB.conflicts.add(conflict);
}
export async function getOfflineConflicts(): Promise<OfflineConflict[]> {
  return offlineDB.conflicts.toArray();
}
export async function clearOfflineConflicts() {
  await offlineDB.conflicts.clear();
} 