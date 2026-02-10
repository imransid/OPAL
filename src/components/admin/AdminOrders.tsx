import { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus, deleteOrder } from '../../lib/firestore';
import type { Order, OrderStatus } from '../../lib/types';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
          )}
        </div>
      </div>
    </div>
  );
}
