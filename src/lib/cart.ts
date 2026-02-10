const CART_KEY = 'opal_cart';

export interface CartItem {
  id: string;
  qty: number;
  color?: string;
  size?: string;
}

export interface AddToCartOptions {
  color?: string;
  size?: string;
}

function norm(s: string | undefined): string {
  return (s ?? '').trim();
}

function itemMatch(a: CartItem, productId: string, options?: AddToCartOptions): boolean {
  if (a.id !== productId) return false;
  if (norm(a.color) !== norm(options?.color ?? '')) return false;
  if (norm(a.size) !== norm(options?.size ?? '')) return false;
  return true;
}

function getCartRaw(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setCartRaw(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function getCart(): CartItem[] {
  return getCartRaw();
}

export function getCartCount(): number {
  return getCartRaw().reduce((sum, i) => sum + (i.qty || 1), 0);
}

export function addToCart(productId: string, qty = 1, options?: AddToCartOptions): CartItem[] {
  const cart = getCartRaw();
  const color = options?.color?.trim() ?? '';
  const size = options?.size?.trim() ?? '';
  const i = cart.find((x) => itemMatch(x, productId, options));
  if (i) {
    i.qty = (i.qty || 1) + qty;
  } else {
    cart.push({ id: productId, qty, ...(color ? { color } : {}), ...(size ? { size } : {}) });
  }
  setCartRaw(cart);
  return cart;
}

export function removeFromCart(productId: string, options?: AddToCartOptions): CartItem[] {
  const cart = getCartRaw().filter((x) => !itemMatch(x, productId, options));
  setCartRaw(cart);
  return cart;
}

export function setCartQuantity(productId: string, qty: number, options?: AddToCartOptions): CartItem[] {
  if (qty < 1) return removeFromCart(productId, options);
  const cart = getCartRaw();
  const i = cart.find((x) => itemMatch(x, productId, options));
  if (i) {
    i.qty = qty;
  } else {
    const color = options?.color?.trim() ?? '';
    const size = options?.size?.trim() ?? '';
    cart.push({ id: productId, qty, ...(color ? { color } : {}), ...(size ? { size } : {}) });
  }
  setCartRaw(cart);
  return cart;
}

export function clearCart(): CartItem[] {
  setCartRaw([]);
  return [];
}
