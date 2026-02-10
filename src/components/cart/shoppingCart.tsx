import ProductCartItem from './productCartItem';
import OrderSummary from './orderSummary';

export interface CartProduct {
  productId: string;
  thumb_src: string;
  thumb_alt: string;
  color: string;
  title: string;
  size: string;
  price: number;
  currency?: string;
  stock: boolean;
  quantity: number;
  subtotal: number;
}

interface CartOptions {
  color?: string;
  size?: string;
}

interface Props {
  products: CartProduct[];
  shipping: number;
  currency?: string;
  onRemove: (productId: string, options?: CartOptions) => void;
  onQuantityChange: (productId: string, qty: number, options?: CartOptions) => void;
  onClearAll?: () => void;
}

export default function ShoppingCart({ products, shipping, currency = '৳', onRemove, onQuantityChange, onClearAll }: Props) {
  const subtotal = products.reduce((sum, p) => sum + p.subtotal, 0);

  return (
    <div className="container mt-5">
      <h2 className="mb-3 text-center">Shopping Cart</h2>
      <h5 className="text-center mb-5">You are eligible for Free Shipping.</h5>
      <div className="row">
        <div className="col-12 col-lg-7">
          {products.length === 0 ? (
            <p className="text-body-secondary">Your cart is empty.</p>
          ) : (
            <>
              {onClearAll && (
                <div className="d-flex justify-content-end mb-3">
                  <button type="button" className="btn btn-link text-danger p-0" onClick={onClearAll}>
                    Clear cart
                  </button>
                </div>
              )}
            {products.map((product, i) => (
              <div key={`${product.productId}-${product.color}-${product.size}`}>
                {i > 0 && <hr className="horizontal dark my-2" />}
                <ProductCartItem
                  productId={product.productId}
                  thumb_src={product.thumb_src}
                  thumb_alt={product.thumb_alt}
                  title={product.title}
                  color={product.color}
                  size={product.size}
                  price={product.price}
                  currency={product.currency}
                  stock={product.stock}
                  quantity={product.quantity}
                  onQuantityChange={(qty) => onQuantityChange(product.productId, qty, { color: product.color || undefined, size: product.size || undefined })}
                  onRemove={() => onRemove(product.productId, { color: product.color || undefined, size: product.size || undefined })}
                />
              </div>
            ))}
            </>
          )}
        </div>
        <div className="col-12 col-lg-5 mt-5 mt-lg-0">
          <div className="card shadow-xs border bg-gray-100">
            <div className="card-body p-lg-5">
              <h5 className="mb-4">Order Summary</h5>
              <OrderSummary subtotal={subtotal} shipping={shipping} currency={currency} textColor="" />
              <a className="btn btn-dark btn-lg w-100 mt-3" href="/checkout/">
                Checkout
              </a>
              <a className="btn btn-outline-dark btn-lg w-100 mt-2" href="/shop/">
                Continue Shopping
              </a>
              <p className="text-center small text-body-secondary mt-3 mb-0">
                Shipping calculated above. Proceed to checkout to complete your order.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
