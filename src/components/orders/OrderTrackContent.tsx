import { useState, useEffect } from 'react';
import { getOrderByNumberAndEmail } from '../../lib/firestore';
import type { Order, OrderStatus } from '../../lib/types';
import { toImageSrc } from '../../lib/image-utils';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-warning text-dark',
  confirmed: 'bg-success',
  shipped: 'bg-success',
  delivered: 'bg-success',
  cancelled: 'bg-danger',
};

export default function OrderTrackContent() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const o = params.get('order');
    const e = params.get('email');
    if (o && e) {
      setOrderNumber(o);
      setEmail(e);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const o = params.get('order');
    const e = params.get('email');
    if (o && e) {
      setOrderNumber(o);
      setEmail(e);
      setLoading(true);
      setError('');
      getOrderByNumberAndEmail(o, e)
        .then((ord) => {
          setOrder(ord);
          setSearched(true);
        })
        .catch(() => {
          setError('Failed to load order.');
          setOrder(null);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    setSearched(true);
    if (!orderNumber.trim() || !email.trim()) {
      setError('Enter order number and email.');
      return;
    }
    setLoading(true);
    getOrderByNumberAndEmail(orderNumber.trim(), email.trim())
      .then((ord) => setOrder(ord))
      .catch(() => {
        setError('Failed to load order.');
        setOrder(null);
      })
      .finally(() => setLoading(false));
  };

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <h1 className="mb-2 fw-bold">Track your order</h1>
          <p className="text-body-secondary mb-4">Enter your order number and email to see the status.</p>

          <form onSubmit={handleSearch} className="card shadow-sm border-0 mb-4">
            <div className="card-body p-4">
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-5">
                  <label className="form-label small">Order number</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="OPAL-XXXXXXXX"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-5">
                  <label className="form-label small">Email</label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-2">
                  <label className="form-label small invisible d-none d-md-block">Track</label>
                  <button
                    type="submit"
                    className="btn btn-dark btn-lg w-100 d-flex align-items-center justify-content-center"
                    style={{ minHeight: '3rem' }}
                    disabled={loading}
                  >
                    {loading ? <span className="spinner-border spinner-border-sm" /> : 'Track'}
                  </button>
                </div>
              </div>
              {error && <p className="text-danger mb-0 mt-2 small">{error}</p>}
            </div>
          </form>

          {loading && (
            <div className="text-center py-5">
              <span className="spinner-border text-dark" />
            </div>
          )}

          {!loading && searched && !order && (
            <div className="card shadow-sm border-0">
              <div className="card-body text-center py-5">
                <p className="text-body-secondary mb-0">No order found. Check your order number and email.</p>
              </div>
            </div>
          )}

          {!loading && order && (
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <h5 className="mb-0">Order {order.orderNumber}</h5>
                  <span className={`badge ${STATUS_COLORS[order.status]} px-6 py-3 d-inline-flex align-items-center justify-content-center`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="mb-4">
                  <h6 className="text-body-secondary small text-uppercase mb-3">Order progress</h6>
                  <div className="d-flex align-items-center w-100">
                    {STATUS_STEPS.flatMap((s, i) => {
                      const isDone = i < currentStepIndex;
                      const isCurrent = i === currentStepIndex;
                      const isActive = isDone || isCurrent;
                      const stepEl = (
                        <div key={s} className="d-flex flex-column align-items-center flex-grow-1" style={{ minWidth: 72 }}>
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center ${isActive ? STATUS_COLORS[s] : 'bg-light'
                              }`}
                            style={{ width: 40, height: 40, flexShrink: 0 }}
                          >
                            {isDone ? (
                              <i className="bi bi-check-lg text-white" style={{ fontSize: 18 }} />
                            ) : (
                              <span className={isCurrent ? 'text-white fw-bold' : 'text-body-secondary'}>{i + 1}</span>
                            )}
                          </div>
                          <span
                            className={`text-center mt-2 small ${isActive ? 'fw-semibold' : 'text-body-secondary'}`}
                            style={{ lineHeight: 1.3 }}
                          >
                            {STATUS_LABELS[s]}
                          </span>
                        </div>
                      );
                      const connector =
                        i < STATUS_STEPS.length - 1 ? (
                          <div
                            key={`conn-${i}`}
                            className="flex-grow-1"
                            style={{
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: isDone ? '#198754' : '#e9ecef',
                              marginBottom: 28,
                            }}
                          />
                        ) : null;
                      return connector ? [stepEl, connector] : [stepEl];
                    })}
                  </div>
                </div>

                <hr />

                <h6 className="mb-2">Items</h6>
                <ul className="list-unstyled mb-4">
                  {order.items.map((item, i) => (
                    <li key={i} className="d-flex align-items-center gap-3 py-2 border-bottom">
                      {item.thumb_src && (
                        <img
                          src={toImageSrc(item.thumb_src)}
                          alt=""
                          className="rounded"
                          style={{ width: 48, height: 48, objectFit: 'cover' }}
                        />
                      )}
                      <div className="flex-grow-1">
                        <span className="fw-semibold">{item.title}</span>
                        <span className="text-body-secondary small ms-2">
                          {item.quantity} × {order.currency}{item.price.toLocaleString()}
                        </span>
                      </div>
                      <span>{order.currency}{item.subtotal.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-body-secondary">Subtotal</span>
                  <span>{order.currency}{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-body-secondary">Shipping</span>
                  <span>{order.currency}{order.shippingCost.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
                  <span>Total</span>
                  <span>{order.currency}{order.total.toLocaleString()}</span>
                </div>

                <hr />

                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-body-secondary small mb-2">Shipping address</h6>
                    <p className="mb-0">
                      {order.shipping.address}
                      <br />
                      {[order.shipping.city, order.shipping.state, order.shipping.postalCode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="col-md-6 mt-3 mt-md-0">
                    <h6 className="text-body-secondary small mb-2">Contact</h6>
                    <p className="mb-0">
                      {order.contact.email}
                      <br />
                      {order.contact.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
