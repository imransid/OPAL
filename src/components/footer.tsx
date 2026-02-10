export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white pt-5 pb-3 mt-auto">
      <div className="container">
        <div className="row g-4 g-lg-5 pb-4 pb-lg-5 border-bottom border-secondary border-opacity-25">
          {/* Brand */}
          <div className="col-12 col-lg-4">
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

          {/* Spacer on large to push bottom bar */}
          <div className="col-12 d-lg-none" />
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
