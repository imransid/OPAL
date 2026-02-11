import { useState, useEffect } from 'react';
import { getProducts, getStoreSettings } from '../../lib/firestore';
import { getCart, type CartItem } from '../../lib/cart';
import type { Product } from '../../lib/types';
import CheckoutOrderSummary from '../checkout/checkoutOrderSummary';
import StoreDoubleColumn from '../store/storeDoubleColumn';

function computeShipping(subtotal: number, shippingCost: number, freeThreshold: number): number {
  if (freeThreshold > 0 && subtotal >= freeThreshold) return 0;
  return shippingCost;
}

export default function CheckoutFirebaseWrapper() {
  const [cartProducts, setCartProducts] = useState<{ product: Product; item: CartItem }[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingCost, setShippingCost] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [currency, setCurrency] = useState('৳');

  useEffect(() => {
    getStoreSettings().then((s) => {
      setShippingCost(s.shippingCost ?? 0);
      setFreeShippingThreshold(s.freeShippingThreshold ?? 0);
      setCurrency(s.currency ?? '৳');
    });
  }, []);

  useEffect(() => {
    const items = getCart();
    if (items.length === 0) {
      setCartProducts([]);
      setLoading(false);
      return;
    }
    const ids = [...new Set(items.map((i) => i.id))];
    getProducts().then((all) => {
      const byId = new Map(all.map((p) => [p.id, p]));
      const cart = items
        .map((item) => {
          const product = byId.get(item.id);
          if (!product) return null;
          return { product, item };
        })
        .filter((x): x is { product: Product; item: CartItem } => x !== null);
      setCartProducts(cart);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <span className="spinner-border text-dark" />
      </div>
    );
  }

  if (cartProducts.length === 0) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <h2 className="mb-3">Your cart is empty</h2>
          <p className="text-body-secondary mb-4">Add items from the shop to proceed to checkout.</p>
          <a href="/shop/" className="btn btn-dark btn-lg">Continue shopping</a>
        </div>
      </div>
    );
  }

  const subtotal = cartProducts.reduce((sum, { product: p, item }) => {
    const sizePrice = item.size && p.sizePrices && p.sizePrices[item.size] != null ? p.sizePrices[item.size] : null;
    const price = sizePrice ?? p.discountPrice ?? p.price;
    return sum + price * (item.qty || 1);
  }, 0);
  const shipping = computeShipping(subtotal, shippingCost, freeShippingThreshold);

  const forSummary = cartProducts.map(({ product: p, item }) => {
    const sizePrice = item.size && p.sizePrices && p.sizePrices[item.size] != null ? p.sizePrices[item.size] : null;
    const price = sizePrice ?? p.discountPrice ?? p.price;
    const qty = item.qty || 1;
    return {
      productId: p.id,
      thumb_src: p.thumb_src || p.images?.[0]?.src || '',
      thumb_alt: p.thumb_alt ?? p.title,
      color: item.color ?? p.color ?? '',
      title: p.title,
      price,
      size: item.size ?? p.size ?? '',
      quantity: qty,
      subtotal: price * qty,
    };
  });

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h1 className="mb-2 fw-bold">Checkout</h1>
        <p className="text-body-secondary mb-0">Complete your order securely</p>
      </div>
      <CheckoutOrderSummary products={forSummary} subtotal={subtotal} shipping={shipping} currency={currency} />
      <hr className="my-5" />
      <StoreDoubleColumn />
    </div>
  );
}
