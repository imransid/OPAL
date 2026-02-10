import { useState, useEffect } from 'react';
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
    <nav className="navbar navbar-expand-lg blur border-radius-sm sticky-top py-3 start-0 end-0 shadow" style={{ zIndex: 1030 }}>
      <div className="container px-1">
        <a className="navbar-brand font-weight-bolder ms-lg-0 " href="/">OPAL</a>
        <button className="navbar-toggler shadow-none ms-2" type="button" data-bs-toggle="collapse" data-bs-target="#navigation" aria-controls="navigation" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon mt-2">
            <span className="navbar-toggler-bar bar1"></span>
            <span className="navbar-toggler-bar bar2"></span>
            <span className="navbar-toggler-bar bar3"></span>
          </span>
        </button>
        <div className="collapse navbar-collapse" id="navigation">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className="nav-link text-dark font-weight-bold d-flex align-items-center me-2 " href="/">
                Home
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-dark font-weight-bold d-flex align-items-center me-2 " href="/shop/">
                Shop
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-dark font-weight-bold d-flex align-items-center me-2 " href="/orders/track">
                Track order
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-dark font-weight-bold d-flex align-items-center me-2 position-relative" href="/shopping-cart/">
                <i className="bi bi-cart3 me-1" aria-hidden="true"></i>
                Cart
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark" style={{ fontSize: '0.65rem', color: 'tomato' }}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
