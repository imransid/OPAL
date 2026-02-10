import { useState } from 'react';

export default function Footer() {
  const year = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  return (
    <footer className="bg-dark text-white pt-5 pb-3 mt-auto">
      <style>{`
        .footer-newsletter-glass {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06);
          transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .footer-newsletter-glass:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.14);
          box-shadow: 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .footer-newsletter-glass .form-control {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          border-radius: 9999px;
          height: 2.75rem;
          padding: 0 1.15rem;
          font-size: 0.875rem;
          transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .footer-newsletter-glass .form-control::placeholder {
          color: rgba(255,255,255,0.45);
        }
        .footer-newsletter-glass .form-control:focus {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.25);
          box-shadow: 0 0 0 2px rgba(255,255,255,0.1);
          outline: none;
          color: #fff;
        }
        .footer-newsletter-glass .btn-footer-newsletter {
          height: 2.75rem;
          padding: 0 1.35rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 9999px;
          background: rgba(255,255,255,0.95);
          color: #0f172a;
          border: none;
          transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }
        .footer-newsletter-glass .btn-footer-newsletter:hover:not(:disabled) {
          background: #fff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .footer-newsletter-glass .btn-footer-newsletter.btn-done {
          background: rgba(34,197,94,0.9);
          color: #fff;
          cursor: default;
        }
        .footer-newsletter-glass .btn-footer-newsletter.btn-done:hover {
          transform: none;
          box-shadow: none;
        }
      `}</style>
      <div className="container">
        <div className="row g-4 g-lg-5 pb-4 pb-lg-5 border-bottom border-secondary border-opacity-25 align-items-start">
          {/* Brand */}
          <div className="col-12 col-lg-3">
            <a href="/" className="text-white text-decoration-none fw-bold fs-4 d-inline-block mb-3">
              OPAL
            </a>
            <p className="text-white-50 small mb-0 lh-lg" style={{ maxWidth: '20rem' }}>
              Curated products for every moment. Quality picks, secure checkout, fast delivery.
            </p>
          </div>

          {/* Shop */}
          <div className="col-6 col-md col-lg-2">
            <h6 className="text-uppercase small fw-semibold mb-3 text-white-50" style={{ letterSpacing: '0.08em' }}>
              Shop
            </h6>
            <ul className="list-unstyled mb-0">
              {[
                { href: '/', label: 'Home' },
                { href: '/shop/', label: 'Shop' },
                { href: '/shopping-cart/', label: 'Cart' },
              ].map(({ href, label }) => (
                <li key={href} className="mb-2">
                  <a href={href} className="link-light link-opacity-75 link-opacity-100-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover text-decoration-none small">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="col-6 col-md col-lg-2">
            <h6 className="text-uppercase small fw-semibold mb-3 text-white-50" style={{ letterSpacing: '0.08em' }}>
              Support
            </h6>
            <ul className="list-unstyled mb-0">
              <li className="mb-2">
                <a href="/orders/track" className="link-light link-opacity-75 link-opacity-100-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover text-decoration-none small">
                  Track order
                </a>
              </li>
              <li className="mb-2">
                <a href="/checkout/" className="link-light link-opacity-75 link-opacity-100-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover text-decoration-none small">
                  Checkout
                </a>
              </li>
              <li className="mb-2">
                <a href="/contact/" className="link-light link-opacity-75 link-opacity-100-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover text-decoration-none small">
                  Contact us
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter — right side, glass */}
          <div className="col-12 col-lg-5">
            <div className="footer-newsletter-glass rounded-4 p-4">
              <h6 className="text-uppercase small fw-semibold mb-2 text-white-50" style={{ letterSpacing: '0.08em' }}>
                Newsletter
              </h6>
              <p className="text-white-50 small mb-3 lh-sm">
                New arrivals and exclusive offers — once a week.
              </p>
              <form
                className="d-flex flex-column flex-sm-row gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newsletterEmail.trim()) return;
                  setNewsletterStatus('sending');
                  setTimeout(() => setNewsletterStatus('done'), 800);
                }}
              >
                <input
                  type="email"
                  className="form-control flex-grow-1"
                  placeholder="Your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  aria-label="Email for newsletter"
                  disabled={newsletterStatus === 'done'}
                />
                <button
                  type="submit"
                  className={`btn btn-footer-newsletter flex-shrink-0 ${newsletterStatus === 'done' ? 'btn-done' : ''}`}
                  disabled={newsletterStatus === 'sending'}
                >
                  {newsletterStatus === 'sending' ? '…' : newsletterStatus === 'done' ? '✓ Subscribed' : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="row align-items-center pt-3">
          <div className="col-12 col-md-6 text-center text-md-start mb-2 mb-md-0">
            <p className="small text-white-50 mb-0">
              © {year} <span className="text-white fw-semibold">OPAL</span>. All rights reserved.
            </p>
          </div>
          <div className="col-12 col-md-6">
            <ul className="nav justify-content-center justify-content-md-end gap-3">
              <li className="nav-item">
                <a href="/" className="nav-link link-light link-opacity-75 link-opacity-100-hover small p-0 text-decoration-none">Home</a>
              </li>
              <li className="nav-item">
                <a href="/shop/" className="nav-link link-light link-opacity-75 link-opacity-100-hover small p-0 text-decoration-none">Shop</a>
              </li>
              <li className="nav-item">
                <a href="/shopping-cart/" className="nav-link link-light link-opacity-75 link-opacity-100-hover small p-0 text-decoration-none">Cart</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
