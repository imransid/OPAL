import { useState, useEffect } from 'react';
import { getStoreSettings, updateStoreSettings } from '../../lib/firestore';
import type { StoreSettings } from '../../lib/types';

export default function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    shippingCost: '',
    freeShippingThreshold: '',
    currency: '',
  });

  useEffect(() => {
    getStoreSettings().then((s) => {
      setSettings(s);
      setForm({
        shippingCost: String(s.shippingCost ?? ''),
        freeShippingThreshold: String(s.freeShippingThreshold ?? ''),
        currency: s.currency ?? '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateStoreSettings({
        shippingCost: form.shippingCost ? parseFloat(form.shippingCost) : undefined,
        freeShippingThreshold: form.freeShippingThreshold ? parseFloat(form.freeShippingThreshold) : undefined,
        currency: form.currency.trim() || undefined,
      });
      setMessage('Settings saved.');
      const s = await getStoreSettings();
      setSettings(s);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <span className="spinner-border text-dark" />
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="mb-4">Store Settings</h5>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Shipping cost</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder="25"
                  value={form.shippingCost}
                  onChange={(e) => setForm((f) => ({ ...f, shippingCost: e.target.value }))}
                />
                <small className="text-body-secondary">Default shipping fee when below free-shipping threshold</small>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Free shipping threshold</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder="100"
                  value={form.freeShippingThreshold}
                  onChange={(e) => setForm((f) => ({ ...f, freeShippingThreshold: e.target.value }))}
                />
                <small className="text-body-secondary">Subtotal above this = free shipping. 0 = always free</small>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Default currency symbol</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="৳ (BDT)"
                  maxLength={4}
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-dark" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            {message && <span className="ms-3 text-body-secondary">{message}</span>}
          </form>
        </div>
      </div>
    </div>
  );
}
