import { useState, useEffect, useRef } from 'react';
import { getProducts, getCategories, getAllOrders, exportBackup, restoreBackup } from '../../lib/firestore';
import type { Product, Category, Order, BackupData } from '../../lib/types';
import AdminProducts from './AdminProducts';
import AdminCategories from './AdminCategories';
import AdminSettings from './AdminSettings';
import AdminOrders from './AdminOrders';

const ADMIN_STORAGE_KEY = 'opal_admin_role';
const API_ADMIN_LOGIN = '/api/admin-login';
const API_SEND_CODE = '/api/send-admin-code';
const API_VERIFY_CODE = '/api/verify-admin-code';

type Props = {
  adminEmail: string;
};

type LoginStep = 'password' | 'forgot-email' | 'forgot-code';
type AdminView = 'dashboard' | 'products' | 'categories' | 'orders' | 'settings';

export default function AdminGate({ adminEmail }: Props) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [step, setStep] = useState<LoginStep>('password');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [emailForCode, setEmailForCode] = useState(''); // email we sent the code to (for verify)
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [adminView, setAdminView] = useState<AdminView>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [backupExporting, setBackupExporting] = useState(false);
  const [backupImporting, setBackupImporting] = useState(false);
  const [backupImportError, setBackupImportError] = useState('');
  const [backupImportFile, setBackupImportFile] = useState<BackupData | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(ADMIN_STORAGE_KEY) : null;
    setIsAdmin(stored === 'admin');
  }, []);

  useEffect(() => {
    if (!isAdmin || adminView !== 'dashboard') return;
    let cancelled = false;
    setDashboardLoading(true);
    Promise.all([getProducts(), getCategories(), getAllOrders()])
      .then(([p, c, o]) => {
        if (!cancelled) {
          setProducts(p);
          setCategories(c);
          setOrders(o);
        }
      })
      .finally(() => { if (!cancelled) setDashboardLoading(false); });
    return () => { cancelled = true; };
  }, [isAdmin, adminView]);

  const handleExportBackup = async () => {
    setBackupExporting(true);
    setBackupImportError('');
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opal-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setBackupImportError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBackupExporting(false);
    }
  };

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setBackupImportFile(null);
    setBackupImportError('');
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string) as BackupData;
        if (json.version == null || !Array.isArray(json.products) || !Array.isArray(json.categories) || !Array.isArray(json.orders)) {
          setBackupImportError('Invalid backup file: missing version, products, categories, or orders.');
          return;
        }
        setBackupImportFile(json);
      } catch {
        setBackupImportError('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    if (backupFileInputRef.current) backupFileInputRef.current.value = '';
  };

  const handleRestoreBackup = async () => {
    if (!backupImportFile) return;
    if (!confirm('This will replace ALL current products, categories, orders, and settings with the backup. Continue?')) return;
    setBackupImporting(true);
    setBackupImportError('');
    try {
      await restoreBackup(backupImportFile);
      setBackupImportFile(null);
      const [p, c, o] = await Promise.all([getProducts(), getCategories(), getAllOrders()]);
      setProducts(p);
      setCategories(c);
      setOrders(o);
    } catch (e) {
      setBackupImportError(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setBackupImporting(false);
    }
  };

  const clearBackupImport = () => {
    setBackupImportFile(null);
    setBackupImportError('');
    if (backupFileInputRef.current) backupFileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const emailRaw = (form.elements.namedItem('admin-email') as HTMLInputElement | null)?.value ?? '';
    const passwordRaw = (form.elements.namedItem('admin-password') as HTMLInputElement | null)?.value ?? '';
    const emailTrim = String(emailRaw).trim().toLowerCase();
    const passwordVal = String(passwordRaw);
    if (!emailTrim || !passwordVal) {
      setError('Email and password required.');
      return;
    }
    setLoggingIn(true);
    try {
      const res = await fetch(API_ADMIN_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrim, password: passwordVal }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Invalid email or password.');
        return;
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, 'admin');
      }
      setIsAdmin(true);
      setEmail('');
      setPassword('');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const email = forgotEmail.trim().toLowerCase();
    const allowed = adminEmail.trim().toLowerCase();
    if (!allowed) {
      setError('Admin email is not configured.');
      return;
    }
    if (email !== allowed) {
      setError('This email is not registered for admin access.');
      return;
    }
    setSending(true);
    try {
      const form = new FormData();
      form.append('email', email);
      const res = await fetch(API_SEND_CODE, {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to send code');
        return;
      }
      setEmailForCode(email);
      setStep('forgot-code');
      setForgotEmail('');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSending(false);
    }
  };

  const handleForgotCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailForCode) {
      setError('Session lost. Request a new code.');
      return;
    }
    setVerifying(true);
    try {
      const form = new FormData();
      form.append('email', emailForCode);
      form.append('code', forgotCode.trim());
      const res = await fetch(API_VERIFY_CODE, {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Invalid or expired code');
        return;
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, 'admin');
      }
      setIsAdmin(true);
      setForgotCode('');
      setEmailForCode('');
      setStep('password');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleBackToPassword = () => {
    setStep('password');
    setError('');
    setForgotEmail('');
    setForgotCode('');
    setEmailForCode('');
  };

  const handleBackToEmail = () => {
    setStep('forgot-email');
    setError('');
    setForgotCode('');
    setEmailForCode('');
  };

  const handleLogout = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    }
    setIsAdmin(false);
  };

  // Still determining auth state
  if (isAdmin === null) {
    return (
      <div className="min-vh-100 bg-gray-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Not authenticated: show login or forgot-password flow
  if (!isAdmin) {
    const cardStyle = { width: '100%', maxWidth: '360px' };

    if (step === 'forgot-email') {
      return (
        <main className="min-vh-100 bg-gray-100 d-flex align-items-center justify-content-center">
          <div className="card shadow-sm" style={cardStyle}>
            <div className="card-body p-4">
              <h5 className="card-title mb-3">Forgot password</h5>
              <p className="text-body-secondary small mb-3">Enter your admin email to receive a login code.</p>
              <form onSubmit={handleForgotEmailSubmit}>
                <div className="mb-3">
                  <label htmlFor="forgot-email" className="form-label visually-hidden">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="form-control"
                    placeholder="admin@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                {error && <p className="text-danger small mb-2">{error}</p>}
                <button type="submit" className="btn btn-dark w-100 mb-2" disabled={sending}>
                  {sending ? 'Sending…' : 'Send code'}
                </button>
                <button type="button" className="btn btn-link w-100 text-dark" onClick={handleBackToPassword}>
                  Back to password
                </button>
              </form>
            </div>
          </div>
        </main>
      );
    }

    if (step === 'forgot-code') {
      return (
        <main className="min-vh-100 bg-gray-100 d-flex align-items-center justify-content-center">
          <div className="card shadow-sm" style={cardStyle}>
            <div className="card-body p-4">
              <h5 className="card-title mb-3">Check your email</h5>
              <p className="text-body-secondary small mb-3">
                We sent a 6-digit code to <strong>{emailForCode}</strong>. Check your inbox and enter it below.
              </p>
              <form onSubmit={handleForgotCodeSubmit}>
                <div className="mb-3">
                  <label htmlFor="forgot-code" className="form-label visually-hidden">Code</label>
                  <input
                    id="forgot-code"
                    type="text"
                    className="form-control text-center"
                    placeholder="000000"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>
                {error && <p className="text-danger small mb-2">{error}</p>}
                <button type="submit" className="btn btn-dark w-100 mb-2" disabled={verifying}>
                  {verifying ? 'Verifying…' : 'Verify and sign in'}
                </button>
                <button type="button" className="btn btn-link w-100 text-dark" onClick={handleBackToEmail}>
                  Use a different email
                </button>
              </form>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="min-vh-100 bg-gray-100 d-flex align-items-center justify-content-center">
        <div className="card shadow-sm" style={cardStyle}>
          <div className="card-body p-4">
            <h5 className="card-title mb-3">OPAL Admin</h5>
            <p className="text-body-secondary small mb-3">Sign in with your admin account (Firebase).</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="admin-email" className="form-label visually-hidden">Email</label>
                <input
                  id="admin-email"
                  name="admin-email"
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  autoComplete="email"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="admin-password" className="form-label visually-hidden">Password</label>
                <input
                  id="admin-password"
                  name="admin-password"
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-danger small mb-2">{error}</p>}
              <button type="submit" className="btn btn-dark w-100" disabled={loggingIn}>
                {loggingIn ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <button
              type="button"
              className="btn btn-link w-100 text-dark mt-2 px-0"
              onClick={() => { setStep('forgot-email'); setError(''); }}
            >
              Forgot password? Send code to {adminEmail || 'admin email'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Authenticated: show dashboard, products, or categories
  const navStyle = { background: 'linear-gradient(195deg, #42424a 0%, #191919 100%)' };
  return (
    <main className="min-vh-100 bg-gray-100">
      <nav className="navbar navbar-expand-lg navbar-dark border-radius-sm shadow" style={navStyle}>
        <div className="container">
          <span className="navbar-brand fw-bold">OPAL Admin</span>
          <div className="navbar-nav gap-2 ms-auto align-items-center">
            <button type="button" className={`nav-link btn btn-link ${adminView === 'dashboard' ? 'text-white' : 'text-light opacity-75'}`} onClick={() => setAdminView('dashboard')}>Dashboard</button>
            <button type="button" className={`nav-link btn btn-link ${adminView === 'products' ? 'text-white' : 'text-light opacity-75'}`} onClick={() => setAdminView('products')}>Products</button>
            <button type="button" className={`nav-link btn btn-link ${adminView === 'categories' ? 'text-white' : 'text-light opacity-75'}`} onClick={() => setAdminView('categories')}>Categories</button>
            <button type="button" className={`nav-link btn btn-link ${adminView === 'orders' ? 'text-white' : 'text-light opacity-75'}`} onClick={() => setAdminView('orders')}>Orders</button>
            <button type="button" className={`nav-link btn btn-link ${adminView === 'settings' ? 'text-white' : 'text-light opacity-75'}`} onClick={() => setAdminView('settings')}>Settings</button>
            <a className="nav-link text-light" href="/">Back to site</a>
            <button type="button" className="btn btn-link nav-link text-light" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </nav>

      {adminView === 'products' && <AdminProducts />}
      {adminView === 'categories' && <AdminCategories />}
      {adminView === 'orders' && <AdminOrders />}
      {adminView === 'settings' && <AdminSettings />}

      {adminView === 'dashboard' && (
        <div className="container py-5">
          <h1 className="mb-4">Dashboard</h1>
          {dashboardLoading ? (
            <div className="text-center py-5"><span className="spinner-border" /></div>
          ) : (
            <>
              <div className="row g-4 mb-5">
                <div className="col-sm-6 col-lg-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="rounded-3 bg-primary bg-opacity-10 p-3 me-3">
                          <i className="bi bi-box-seam text-primary fs-4"></i>
                        </div>
                        <div>
                          <h3 className="mb-0">{products.length}</h3>
                          <p className="text-body-secondary small mb-0">Products</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="rounded-3 bg-success bg-opacity-10 p-3 me-3">
                          <i className="bi bi-tags text-success fs-4"></i>
                        </div>
                        <div>
                          <h3 className="mb-0">{categories.length}</h3>
                          <p className="text-body-secondary small mb-0">Categories</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="rounded-3 bg-warning bg-opacity-10 p-3 me-3">
                          <i className="bi bi-cart-check text-warning fs-4"></i>
                        </div>
                        <div>
                          <h3 className="mb-0">{orders.length}</h3>
                          <p className="text-body-secondary small mb-0">Orders</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="rounded-3 bg-info bg-opacity-10 p-3 me-3">
                          <i className="bi bi-currency-dollar text-info fs-4"></i>
                        </div>
                        <div>
                          <h3 className="mb-0">
                            {orders
                              .filter((o) => o.status !== 'cancelled')
                              .reduce((sum, o) => sum + o.total, 0)
                              .toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </h3>
                          <p className="text-body-secondary small mb-0">Revenue</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-0 pt-4">
                      <h5 className="mb-0">Recent products</h5>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Price</th>
                              <th>Stock</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.length === 0 ? (
                              <tr><td colSpan={4} className="text-center text-body-secondary">No products in Firebase. Add them in Products.</td></tr>
                            ) : (
                              products.slice(0, 5).map((product) => (
                                <tr key={product.id}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <img src={product.thumb_src} alt="" className="rounded me-2" width={40} height={40} style={{ objectFit: 'cover' }} />
                                      <span>{product.title}</span>
                                    </div>
                                  </td>
                                  <td>${product.price}</td>
                                  <td>
                                    <span className={`badge ${product.stock !== false ? 'bg-success' : 'bg-secondary'}`}>
                                      {product.stock !== false ? 'In stock' : 'Out of stock'}
                                    </span>
                                  </td>
                                  <td>
                                    <a href={`/product/?id=${product.id}`} className="btn btn-sm btn-outline-primary" target="_blank" rel="noopener noreferrer">View</a>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white border-0 pt-4">
                      <h5 className="mb-0">Quick links</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-grid gap-2">
                        <button type="button" className="btn btn-outline-dark" onClick={() => setAdminView('products')}>Manage products</button>
                        <button type="button" className="btn btn-outline-dark" onClick={() => setAdminView('categories')}>Manage categories</button>
                        <button type="button" className="btn btn-outline-dark" onClick={() => setAdminView('orders')}>Manage orders</button>
                      </div>
                    </div>
                  </div>
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white border-0 pt-4">
                      <h5 className="mb-0">Backup &amp; Restore</h5>
                    </div>
                    <div className="card-body">
                      <p className="text-body-secondary small mb-3">
                        Export all products, categories, orders, and settings to a JSON file, or restore from a previous backup.
                      </p>
                      <div className="d-grid gap-2 mb-3">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={handleExportBackup}
                          disabled={backupExporting}
                        >
                          {backupExporting ? 'Exporting…' : 'Download backup (JSON)'}
                        </button>
                        <div>
                          <input
                            ref={backupFileInputRef}
                            type="file"
                            className="form-control form-control-sm"
                            accept=".json,application/json"
                            onChange={handleBackupFileSelect}
                            aria-label="Choose backup file"
                          />
                        </div>
                        {backupImportFile && (
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="small text-success">
                              {backupImportFile.products?.length ?? 0} products, {backupImportFile.categories?.length ?? 0} categories, {backupImportFile.orders?.length ?? 0} orders
                              {backupImportFile.exportedAt && ` (exported ${backupImportFile.exportedAt.slice(0, 10)})`}
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={handleRestoreBackup}
                              disabled={backupImporting}
                            >
                              {backupImporting ? 'Restoring…' : 'Restore this backup'}
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearBackupImport}>
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      {backupImportError && (
                        <div className="alert alert-danger py-2 small mb-0">{backupImportError}</div>
                      )}
                    </div>
                  </div>
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-0 pt-4">
                      <h5 className="mb-0">Categories</h5>
                    </div>
                    <div className="card-body">
                      <ul className="list-group list-group-flush">
                        {categories.length === 0 ? (
                          <li className="list-group-item px-0 text-body-secondary">No categories. Add them in Categories.</li>
                        ) : (
                          categories.map((cat) => (
                            <li key={cat.id} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                              <span>{cat.title}</span>
                              <small className="text-body-secondary">{cat.collection}</small>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
