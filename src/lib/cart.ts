const CART_KEY = 'opal_cart';

export interface CartItem {
  id: string;
  qty: number;
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

export function addToCart(productId: string, qty = 1): CartItem[] {
  const cart = getCartRaw();
  const i = cart.find((x) => x.id === productId);
  if (i) {
    i.qty = (i.qty || 1) + qty;
  } else {
    cart.push({ id: productId, qty });
  }
  setCartRaw(cart);
  return cart;
}

export function removeFromCart(productId: string): CartItem[] {
  const cart = getCartRaw().filter((x) => x.id !== productId);
  setCartRaw(cart);
  return cart;
}

export function setCartQuantity(productId: string, qty: number): CartItem[] {
  if (qty < 1) return removeFromCart(productId);
  const cart = getCartRaw();
  const i = cart.find((x) => x.id === productId);
  if (i) {
    i.qty = qty;
  } else {
    cart.push({ id: productId, qty });
  }
  setCartRaw(cart);
  return cart;
}

export function clearCart(): CartItem[] {
  setCartRaw([]);
  return [];
}
