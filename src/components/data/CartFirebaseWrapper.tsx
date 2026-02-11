import { useState, useEffect } from 'react';
import { getProducts, getStoreSettings } from '../../lib/firestore';
import { getCart, removeFromCart, setCartQuantity, clearCart } from '../../lib/cart';
import type { Product } from '../../lib/types';
import ShoppingCart, { type CartProduct } from '../cart/shoppingCart';
import CardProduct from '../products/cardProduct';
import StoreDoubleColumn from '../store/storeDoubleColumn';

function computeShipping(subtotal: number, shippingCost: number, freeThreshold: number): number {
  if (freeThreshold > 0 && subtotal >= freeThreshold) return 0;
  return shippingCost;
}

export default function CartFirebaseWrapper() {
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
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

  const loadCart = () => {
    const cartItems = getCart();
    if (cartItems.length === 0) {
      setCartProducts([]);
      setLoading(false);
      getProducts().then((all) => setSuggestions(all.slice(0, 4)));
      return;
    }
    const ids = [...new Set(cartItems.map((i) => i.id))];
    getProducts().then((all) => {
      const byId = new Map(all.map((p) => [p.id, p]));
      const cart: CartProduct[] = cartItems
        .map((item) => {
          const p = byId.get(item.id);
          if (!p) return null;
          const qty = item.qty || 1;
          const sizePrice = item.size && p.sizePrices && p.sizePrices[item.size] != null ? p.sizePrices[item.size] : null;
          const price = sizePrice ?? p.discountPrice ?? p.price;
          return {
            productId: p.id,
            thumb_src: p.thumb_src || p.images?.[0]?.src || '',
            thumb_alt: p.thumb_alt || p.title,
            color: item.color ?? p.color ?? '',
            title: p.title,
            size: item.size ?? p.size ?? '',
            price,
            currency: p.currency,
            stock: p.stock !== false,
            quantity: qty,
            subtotal: price * qty,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      setCartProducts(cart);
      const suggested = all.filter((p) => !ids.includes(p.id)).slice(0, 4);
      setSuggestions(suggested);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleRemove = (productId: string, options?: { color?: string; size?: string }) => {
    removeFromCart(productId, options);
    loadCart();
  };

  const handleClearAll = () => {
    clearCart();
    loadCart();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('opal-cart-update'));
    }
  };

  const handleQuantityChange = (productId: string, qty: number, options?: { color?: string; size?: string }) => {
    setCartQuantity(productId, qty, options);
    loadCart();
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center py-5">
        <span className="spinner-border text-dark" />
      </div>
    );
  }

  const subtotal = cartProducts.reduce((sum, p) => sum + p.subtotal, 0);
  const shipping = computeShipping(subtotal, shippingCost, freeShippingThreshold);

  return (
    <>
      <ShoppingCart
        products={cartProducts}
        shipping={shipping}
        currency={currency}
        onRemove={handleRemove}
        onQuantityChange={handleQuantityChange}
        onClearAll={handleClearAll}
      />
      <div className="container mt-5">
        <div className="row">
          <h5 className="mb-4">You may also like</h5>
          {suggestions.map((product) => (
            <div key={product.id} className="col-md-6 col-lg-3">
              <CardProduct
                thumb_src={product.thumb_src || product.images?.[0]?.src || ''}
                thumb_alt={product.thumb_alt || product.title}
                color={product.color}
                colors={product.colors}
                size={product.size}
                sizes={product.sizes}
                title={product.title}
                description={product.shortDescription ?? product.description}
                price={product.discountPrice ?? product.price}
                currency={product.currency}
                position="left"
                productId={product.id}
                stock={product.stock}
              />
            </div>
          ))}
        </div>
        <hr className="dark horizontal my-5" />
        <StoreDoubleColumn />
      </div>
    </>
  );
}
