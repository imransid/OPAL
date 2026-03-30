'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import OpalLogo from './brand/OpalLogo';
import { getCartCount } from '../lib/cart';

const Navbar = () => {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const update = () => setCartCount(getCartCount());
    update();
    window.addEventListener('opal-cart-update', update);
    return () => window.removeEventListener('opal-cart-update', update);
  }, []);

  return (
    <nav
      className="navbar navbar-expand-lg opal-navbar sticky-top py-3 py-lg-4 start-0 end-0"
      style={{ zIndex: 1030 }}
    >
      <div className="container px-3 px-lg-4">
        <Link className="navbar-brand d-flex align-items-center me-lg-4 text-decoration-none text-body" href="/">
          <OpalLogo />
        </Link>
        <button
          className="navbar-toggler border-0 shadow-none rounded-pill px-3"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navigation"
          aria-controls="navigation"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon mt-2">
            <span className="navbar-toggler-bar bar1" />
            <span className="navbar-toggler-bar bar2" />
            <span className="navbar-toggler-bar bar3" />
          </span>
        </button>
        <div className="collapse navbar-collapse" id="navigation">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1 pt-3 pt-lg-0">
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center" href="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center" href="/shop">
                Shop
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center" href="/contact">
                Contact
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center" href="/orders/track">
                Track order
              </Link>
            </li>
            <li className="nav-item mt-2 mt-lg-0">
              <Link
                className="nav-link opal-nav-cta d-inline-flex align-items-center justify-content-center"
                href="/shop?sort=new-arrivals"
              >
                New in
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link d-flex align-items-center gap-2"
                href="/shopping-cart"
                aria-label={cartCount > 0 ? `Shopping bag, ${cartCount} items` : 'Shopping bag'}
              >
                <span className="position-relative d-inline-flex">
                  <i className="bi bi-bag" style={{ fontSize: '1.1rem' }} aria-hidden />
                  {cartCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill border"
                      style={{
                        fontSize: '0.55rem',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        padding: '0.25em 0.4em',
                        background: 'var(--opal-ink)',
                        color: '#faf9f7',
                        borderColor: 'rgba(250,249,247,0.15)',
                      }}
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </span>
                <span className="d-lg-none">Bag</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
