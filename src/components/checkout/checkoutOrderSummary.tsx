import { useState } from 'react';
import PaymentDetails from './paymentDetails';
import ShippingInfo from './shippingInfo';
import BillingInfo from './billingInfo';
import OrderSummary from '../cart/orderSummary';
import CheckoutSingleItem from '../checkout/checkoutSingleItem';
import { createOrder } from '../../lib/firestore';
import { clearCart } from '../../lib/cart';

interface ProductItem {
  productId: string;
  thumb_src: string;
  thumb_alt: string;
  color: string;
  title: string;
  price: number;
  size: string;
  quantity: number;
  subtotal: number;
}

interface Props {
  products: ProductItem[];
  subtotal: number;
  shipping: number;
  currency?: string;
}

export default function CheckoutSummary({
  products,
  subtotal,
  shipping,
  currency = '৳',
}: Props) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriedSubmit(true);
    setError('');
    const emailValid = email.trim().length > 0;
    const phoneValid = phone.trim().length > 0;
    const addressValid = address.trim().length > 0;
    if (!emailValid || !phoneValid || !addressValid) return;

    setPlacing(true);
    try {
      const { orderNumber } = await createOrder({
        items: products.map((p) => ({
          productId: p.productId,
          title: p.title,
          price: p.price,
          quantity: p.quantity,
          subtotal: p.subtotal,
          thumb_src: p.thumb_src,
          color: p.color || undefined,
          size: p.size || undefined,
        })),
        contact: { email: email.trim(), phone: phone.trim() },
        shipping: { address: address.trim(), city, state, postalCode },
        paymentMethod,
        subtotal,
        shippingCost: shipping,
        currency,
      });
      clearCart();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('opal-cart-update'));
      }
      window.location.href = `/orders/track?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email.trim())}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order. Try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <section className="rounded-3 overflow-hidden shadow-lg">
      <form onSubmit={handleSubmit}>
      <div className="row g-0">
        <div className="col-12 col-lg-6 p-4 p-lg-5 bg-white">
          <div className="mb-4">
            <h5 className="mb-3 fw-semibold">Contact information</h5>
            <div className="mb-3">
              <label className="form-label small text-body-secondary">Email <span className="text-danger">*</span></label>
              <input
                type="email"
                className={`form-control form-control-lg ${triedSubmit && !email.trim() ? 'is-invalid' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
              />
              {triedSubmit && !email.trim() && <div className="invalid-feedback">Email is required</div>}
            </div>
            <div>
              <label className="form-label small text-body-secondary">Phone number <span className="text-danger">*</span></label>
              <input
                type="tel"
                className={`form-control form-control-lg ${triedSubmit && !phone.trim() ? 'is-invalid' : ''}`}
                placeholder="+880 1XXX-XXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                aria-required="true"
              />
              {triedSubmit && !phone.trim() && <div className="invalid-feedback">Phone number is required</div>}
            </div>
          </div>

          <div className="mb-4">
            <h5 className="mb-3 fw-semibold">Shipping address</h5>
            <ShippingInfo
              address={address}
              city={city}
              state={state}
              postalCode={postalCode}
              onAddressChange={setAddress}
              onCityChange={setCity}
              onStateChange={setState}
              onPostalCodeChange={setPostalCode}
              required
              addressInvalid={triedSubmit && !address.trim()}
            />
          </div>

          <div className="mb-4">
            <h5 className="mb-3 fw-semibold">Payment method</h5>
            <div className="mb-3">
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="payment"
                  id="pay-cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <label className="form-check-label" htmlFor="pay-cod">
                  <strong>COD</strong> — Cash on Delivery (Pay when you receive)
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="payment"
                  id="pay-card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                />
                <label className="form-check-label" htmlFor="pay-card">
                  Credit / Debit Card
                </label>
              </div>
            </div>
            {paymentMethod === 'card' && (
              <PaymentDetails
                cardNumber={cardNumber}
                expiry={expiry}
                cvc={cvc}
                onCardNumberChange={setCardNumber}
                onExpiryChange={setExpiry}
                onCvcChange={setCvc}
              />
            )}
          </div>

          <div className="mb-4">
            <h5 className="mb-3 fw-semibold">Billing information</h5>
            <BillingInfo sameAsShipping={sameAsShipping} onSameAsShippingChange={setSameAsShipping} />
          </div>

          {error && <div className="alert alert-danger mb-3">{error}</div>}
          <button type="submit" className="btn btn-dark btn-lg w-100 py-3" disabled={placing}>
            {placing ? <span className="spinner-border spinner-border-sm me-2" aria-hidden /> : <i className="bi bi-lock-fill me-2" aria-hidden />}
            {placing ? 'Placing order…' : `Place order · ${currency}${(subtotal + shipping).toLocaleString()}`}
          </button>
        </div>

        <div className="col-12 col-lg-6 p-4 p-lg-5 text-white" style={{ background: 'linear-gradient(160deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
          <h5 className="mb-4 fw-semibold text-white">Order summary</h5>
          <div className="mb-4">
            {products.map((product, i) => (
              <CheckoutSingleItem
                key={i}
                thumb_src={product.thumb_src}
                thumb_alt={product.thumb_alt}
                title={product.title}
                color={product.color}
                size={product.size}
                price={product.price}
                quantity={product.quantity}
                subtotal={product.subtotal}
                currency={currency}
              />
            ))}
          </div>
          <OrderSummary subtotal={subtotal} shipping={shipping} currency={currency} textColor="white" />
        </div>
      </div>
      </form>
    </section>
  );
}
