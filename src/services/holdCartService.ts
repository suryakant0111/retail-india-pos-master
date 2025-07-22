export interface HeldCart {
  id: string;
  timestamp: number;
  cart: any;
}

const STORAGE_KEY = 'heldCarts';

export function saveHeldCart(cart: any) {
  const heldCarts: HeldCart[] = getHeldCarts();
  const id = `cart_${Date.now()}`;
  heldCarts.push({ id, timestamp: Date.now(), cart });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(heldCarts));
  return id;
}

export function getHeldCarts(): HeldCart[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function removeHeldCart(id: string) {
  const heldCarts: HeldCart[] = getHeldCarts().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(heldCarts));
}

export function clearAllHeldCarts() {
  localStorage.removeItem(STORAGE_KEY);
} 