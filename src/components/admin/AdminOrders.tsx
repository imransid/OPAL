import { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus, deleteOrder } from '../../lib/firestore';
import type { Order, OrderStatus } from '../../lib/types';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  const load = () => {
    setLoading(true);
    getAllOrders().then(setOrders).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Delete this order? This cannot be undone.')) return;
    try {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      alert('Failed to delete order');
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <span className="spinner-border text-dark" />
      </div>
    );
  }

  const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
  const byStatus = STATUS_OPTIONS.reduce((acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }), {} as Record<OrderStatus, number>);

  return (
    <div className="container py-5">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h4 className="mb-0">Order management</h4>
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <span className="badge bg-dark fs-6 px-3 py-2">
            Total orders: <strong>{orders.length}</strong>
          </span>
          <span className="text-body-secondary">
            Revenue (ex. cancelled): {orders[0]?.currency ?? ''}{totalRevenue.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="card shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="d-flex flex-wrap gap-3 small">
            {STATUS_OPTIONS.map((s) => (
              <span key={s} className="text-nowrap">
                <span className="text-body-secondary">{s}:</span> <strong>{byStatus[s]}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="mb-4">All orders</h5>
          {orders.length === 0 ? (
            <p className="text-body-secondary mb-0">No orders yet.</p>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Email</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.orderNumber}</td>
                        <td>{o.contact.email}</td>
                        <td>{o.currency}{o.total.toLocaleString()}</td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm me-1"
                            onClick={() => setViewOrder(o)}
                            title="View details"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(o.id)}
                            title="Delete order"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {viewOrder && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setViewOrder(null)}>
                  <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Order {viewOrder.orderNumber}</h5>
                        <button type="button" className="btn-close" onClick={() => setViewOrder(null)} aria-label="Close" />
                      </div>
                      <div className="modal-body">
                        <div className="mb-3">
                          <span className="badge bg-dark me-2">{viewOrder.status}</span>
                          <span className="text-body-secondary small">{new Date(viewOrder.createdAt).toLocaleString()}</span>
                        </div>
                        <h6 className="mt-3 mb-2">Items</h6>
                        <table className="table table-sm table-bordered">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Colour</th>
                              <th>Size</th>
                              <th>Qty</th>
                              <th>Price</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewOrder.items.map((item, i) => (
                              <tr key={i}>
                                <td>{item.title}</td>
                                <td>{item.color ?? '—'}</td>
                                <td>{item.size ?? '—'}</td>
                                <td>{item.quantity}</td>
                                <td>{viewOrder.currency}{item.price.toLocaleString()}</td>
                                <td>{viewOrder.currency}{item.subtotal.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="d-flex justify-content-between mb-2"><span className="text-body-secondary">Subtotal</span><span>{viewOrder.currency}{viewOrder.subtotal.toLocaleString()}</span></div>
                        <div className="d-flex justify-content-between mb-2"><span className="text-body-secondary">Shipping</span><span>{viewOrder.currency}{viewOrder.shippingCost.toLocaleString()}</span></div>
                        <div className="d-flex justify-content-between fw-bold"><span>Total</span><span>{viewOrder.currency}{viewOrder.total.toLocaleString()}</span></div>
                        <h6 className="mt-4 mb-2">Contact</h6>
                        <p className="mb-1 small">{viewOrder.contact.email} · {viewOrder.contact.phone}</p>
                        <h6 className="mt-3 mb-2">Shipping address</h6>
                        <p className="mb-0 small">
                          {viewOrder.shipping.address}<br />
                          {[viewOrder.shipping.city, viewOrder.shipping.state, viewOrder.shipping.postalCode].filter(Boolean).join(', ')}
                        </p>
                        <p className="mt-2 mb-0 small text-body-secondary">Payment: {viewOrder.paymentMethod === 'card' ? 'Card' : 'Cash on delivery'}</p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setViewOrder(null)}>Close</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
