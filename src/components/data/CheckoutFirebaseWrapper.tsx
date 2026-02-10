import { useState, useEffect } from 'react';
import { getProducts, getStoreSettings } from '../../lib/firestore';
import { getCart } from '../../lib/cart';
import type { Product } from '../../lib/types';
import CheckoutOrderSummary from '../checkout/checkoutOrderSummary';
import StoreDoubleColumn from '../store/storeDoubleColumn';

function computeShipping(subtotal: number, shippingCost: number, freeThreshold: number): number {
  if (freeThreshold > 0 && subtotal >= freeThreshold) return 0;
  return shippingCost;
}

export default function CheckoutFirebaseWrapper() {
  const [cartProducts, setCartProducts] = useState<{ product: Product; qty: number }[]>([]);
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
    const ids = items.map((i) => i.id);
    const qtyById = new Map(items.map((i) => [i.id, i.qty || 1]));
    getProducts().then((all) => {
      const cart = all
        .filter((p) => ids.includes(p.id))
        .map((p) => ({ product: p, qty: qtyById.get(p.id) ?? 1 }));
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

  const subtotal = cartProducts.reduce((sum, { product: p, qty }) => sum + (p.discountPrice ?? p.price) * qty, 0);
  const shipping = computeShipping(subtotal, shippingCost, freeShippingThreshold);

  const forSummary = cartProducts.map(({ product: p, qty }) => {
    const price = p.discountPrice ?? p.price;
    return {
      productId: p.id,
      thumb_src: p.thumb_src || p.images?.[0]?.src || '',
      thumb_alt: p.thumb_alt || p.title,
      color: p.color || '',
      title: p.title,
      price,
      size: p.size || '',
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
