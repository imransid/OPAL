import { useState, useEffect, useRef } from 'react';
import { getProducts, getCategories, getStoreSettings } from '../../lib/firestore';
import type { Product, Category, StoreSettings } from '../../lib/types';
import CardProduct from '../products/cardProduct';
import CardCategory from '../products/cardCategory';
import { toImageSrc } from '../../lib/image-utils';

export default function HomePageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({});
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [visible, setVisible] = useState<Record<number, boolean>>({});
  const setSectionRef = (i: number) => (el: HTMLElement | null) => { sectionRefs.current[i] = el; };
  const [heroSlide, setHeroSlide] = useState(0);
  const [bestSellerFilter, setBestSellerFilter] = useState<string>('all');

  useEffect(() => {
    Promise.all([getProducts(), getCategories(), getStoreSettings()]).then(([p, c, s]) => {
      setProducts(p);
      setCategories(c);
      setSettings(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const i = entry.target.getAttribute('data-section-index');
          if (i != null && entry.isIntersecting) setVisible((v) => ({ ...v, [Number(i)]: true }));
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
    );
    const timer = setTimeout(() => {
      sectionRefs.current.forEach((el) => el && observer.observe(el));
    }, 50);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [loading]);

  const heroImages = [
    '/images/opal1.jpg',
    '/images/opal2.jpg',
    '/images/opal3.jpeg',
    '/images/opal4.jpg',
    '/images/opal5.jpg',
  ];
  useEffect(() => {
    const t = setInterval(() => setHeroSlide((s) => (s + 1) % heroImages.length), 5000);
    return () => clearInterval(t);
  }, [heroImages.length]);

  const currency = settings.currency ?? '৳';
  const freeThreshold = settings.freeShippingThreshold;
  const freeShippingText =
    freeThreshold != null && freeThreshold > 0
      ? `Free shipping on orders over ${currency}${freeThreshold.toLocaleString()}`
      : 'Free shipping on selected orders';

  const inStockProducts = products.filter((p) => p.stock !== false);
  const featuredProducts = inStockProducts.slice(0, 8);
  const nestedWithImage = categories.filter((c) => c.parentId && c.thumb_src);
  const topWithImage = categories.filter((c) => !c.parentId && c.thumb_src);
  const rest = categories.filter((c) => !nestedWithImage.includes(c) && !topWithImage.includes(c));
  const displayCategories = [...nestedWithImage, ...topWithImage, ...rest].slice(0, 4);

  const productCountByCategory: Record<string, number> = {};
  categories.forEach((c) => {
    productCountByCategory[c.id] = inStockProducts.filter((p) => p.categoryId === c.id).length;
  });

  // Collection-wise: map collection name -> category ids (for filtering products)
  const collectionToCategoryIds: Record<string, string[]> = {};
  categories.forEach((c) => {
    const col = (c.collection || c.title || '').trim() || 'default';
    if (!collectionToCategoryIds[col]) collectionToCategoryIds[col] = [];
    collectionToCategoryIds[col].push(c.id);
  });
  // Unique collections that have at least one in-stock product (for Best Sellers pills)
  const collectionsWithProducts = Object.keys(collectionToCategoryIds).filter((col) =>
    inStockProducts.some((p) => p.categoryId && collectionToCategoryIds[col].includes(p.categoryId))
  );
  const bestSellerCollectionOptions = [{ id: 'all', title: 'All' }].concat(
    collectionsWithProducts.map((col) => ({ id: col, title: col }))
  );

  const bestSellerProducts =
    bestSellerFilter === 'all'
      ? inStockProducts.slice(0, 8)
      : inStockProducts.filter((p) => {
          if (!p.categoryId) return false;
          const categoryIds = collectionToCategoryIds[bestSellerFilter];
          return categoryIds && categoryIds.includes(p.categoryId);
        }).slice(0, 8);
  const bestSellerCategories = bestSellerCollectionOptions;

  if (loading) {
    return (
      <div className="home-loading d-flex align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <div className="spinner-border text-dark mb-2" role="status" aria-label="Loading" />
          <p className="text-body-secondary small mb-0">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .home-page *, .home-page *::before, .home-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        .home-page {
          background: linear-gradient(180deg, #f8f7fc 0%, #f0eef8 30%, #fafafa 100%);
        }
        /* —— Hero —— */
        .home-hero {
          position: relative;
          min-height: min(75vh, 520px);
          display: flex;
          align-items: center;
          overflow: hidden;
          background: linear-gradient(145deg, #08080a 0%, #0f0f14 50%, #14141a 100%);
        }
        @media (min-width: 768px) {
          .home-hero { min-height: min(88vh, 680px); }
        }
        .home-hero-bg {
          position: absolute;
          inset: 0;
        }
        .home-hero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 0;
          transition: opacity 1.4s ease;
        }
        .home-hero-bg img.active { opacity: 0.5; }
        .home-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, #0a0a0e 0%, rgba(10,10,14,0.92) 40%, rgba(10,10,14,0.4) 65%, transparent 85%);
        }
        .home-hero-accent {
          position: absolute;
          top: 0;
          left: 0;
          width: 120px;
          height: 3px;
          background: linear-gradient(90deg, #6366f1, #a78bfa);
          border-radius: 0 0 4px 0;
          z-index: 2;
        }
        .home-hero-content {
          position: relative;
          z-index: 2;
          max-width: 540px;
          padding: 1.5rem 0;
        }
        @media (min-width: 576px) {
          .home-hero-content { padding: 2rem 0; }
        }
        @media (min-width: 992px) {
          .home-hero-content { padding: 2.5rem 0; max-width: 560px; }
        }
        .home-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.92);
          margin-bottom: 1.25rem;
          padding: 0.35rem 0.85rem;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 9999px;
        }
        .home-hero-badge::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #a78bfa;
          border-radius: 50%;
          box-shadow: 0 0 10px #a78bfa;
        }
        .home-hero-title {
          font-size: clamp(1.875rem, 5.5vw, 3.25rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.04em;
          color: #fff;
          margin-bottom: 1rem;
          text-shadow: 0 2px 24px rgba(0,0,0,0.3);
        }
        @media (min-width: 768px) {
          .home-hero-title { letter-spacing: -0.045em; }
        }
        .home-hero-desc {
          font-size: clamp(0.9375rem, 2.2vw, 1.0625rem);
          line-height: 1.65;
          color: rgba(255,255,255,0.82);
          margin-bottom: 1.75rem;
          max-width: 28ch;
        }
        .home-hero-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          min-height: 48px;
          padding: 0.875rem 1.75rem;
          font-weight: 600;
          font-size: 0.9375rem;
          background: #fff;
          color: #0c0c0e;
          border-radius: 9999px;
          text-decoration: none;
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
          border: none;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
        }
        .home-hero-cta:hover {
          color: #0c0c0e;
          background: #f8f8fc;
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.15);
        }
        .home-hero-cta:active { transform: translateY(-1px); }
        .home-hero-dots {
          position: absolute;
          bottom: clamp(1rem, 4vw, 1.75rem);
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
        }
        .home-hero-dot {
          position: relative;
          width: 8px;
          height: 8px;
          min-width: 44px;
          min-height: 44px;
          padding: 18px;
          border-radius: 50%;
          border: none;
          background: transparent;
          transition: background 0.3s ease, transform 0.3s ease;
          cursor: pointer;
        }
        .home-hero-dot::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.45);
          transition: background 0.3s ease, width 0.3s ease;
        }
        .home-hero-dot.active::after {
          background: #fff;
          width: 22px;
          border-radius: 4px;
        }
        .home-hero-dot:hover::after { background: rgba(255,255,255,0.8); }
        /* —— Trust bar —— */
        .home-trust-bar {
          background: #fff;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 1px 0 rgba(255,255,255,0.8);
        }
        @media (min-width: 768px) {
          .home-trust-bar { padding: 1.25rem 0; }
        }
        .home-trust-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          font-size: clamp(0.75rem, 1.8vw, 0.8125rem);
          color: #374151;
          font-weight: 500;
          padding: 0.5rem 0.75rem;
        }
        @media (min-width: 768px) {
          .home-trust-item { justify-content: flex-start; }
        }
        .home-trust-item svg {
          flex-shrink: 0;
          color: #6366f1;
        }
        /* —— Sections —— */
        .home-section {
          padding: clamp(2.5rem, 6vw, 3.5rem) 1rem;
        }
        @media (min-width: 576px) {
          .home-section { padding-left: 1.5rem; padding-right: 1.5rem; }
        }
        @media (min-width: 992px) {
          .home-section { padding: clamp(4rem, 8vw, 5.5rem) 1.5rem; }
        }
        .home-section-head {
          margin-bottom: 1.75rem;
        }
        @media (min-width: 768px) {
          .home-section-head { margin-bottom: 2.25rem; }
        }
        .home-section-label {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 0.5rem;
        }
        .home-section-title {
          font-size: clamp(1.375rem, 4vw, 1.875rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #0f0f12;
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        .home-section-subtitle {
          font-size: clamp(0.875rem, 2vw, 0.9375rem);
          color: #6b7280;
          margin-bottom: 0;
          line-height: 1.5;
          max-width: 42ch;
          margin-left: auto;
          margin-right: auto;
        }
        .home-section-cta {
          display: inline-flex;
          align-items: center;
          font-weight: 600;
          font-size: 0.875rem;
          color: #0c0c0e;
          text-decoration: none;
          margin-top: 1.25rem;
          padding: 0.5rem 0;
          min-height: 44px;
          transition: color 0.2s ease, gap 0.2s ease;
          gap: 0.35rem;
        }
        .home-section-cta:hover { color: #6366f1; gap: 0.5rem; }
        .home-card-product-wrap {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .home-section.in-view .home-card-product-wrap {
          opacity: 1;
          transform: translateY(0);
        }
        .home-section.in-view .home-card-product-wrap:nth-child(1) { transition-delay: 0.05s; }
        .home-section.in-view .home-card-product-wrap:nth-child(2) { transition-delay: 0.1s; }
        .home-section.in-view .home-card-product-wrap:nth-child(3) { transition-delay: 0.15s; }
        .home-section.in-view .home-card-product-wrap:nth-child(4) { transition-delay: 0.2s; }
        .home-section.in-view .home-card-product-wrap:nth-child(5) { transition-delay: 0.25s; }
        .home-section.in-view .home-card-product-wrap:nth-child(6) { transition-delay: 0.3s; }
        .home-section.in-view .home-card-product-wrap:nth-child(7) { transition-delay: 0.35s; }
        .home-section.in-view .home-card-product-wrap:nth-child(8) { transition-delay: 0.4s; }
        .home-category-card {
          border-radius: 1.25rem;
          overflow: hidden;
          min-height: 220px;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }
        @media (min-width: 768px) {
          .home-category-card { min-height: 280px; }
        }
        .home-category-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.12);
        }
        .home-category-card .card-background .full-background {
          transition: transform 0.6s ease;
        }
        .home-category-card:hover .card-background .full-background {
          transform: scale(1.08);
        }
        .home-pill {
          padding: 0.5rem 1rem;
          min-height: 44px;
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: 9999px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #374151;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
          cursor: pointer;
        }
        .home-pill:hover {
          border-color: #6366f1;
          color: #6366f1;
        }
        .home-pill.active {
          background: linear-gradient(135deg, #0f0f14 0%, #1a1a22 100%);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        /* —— Incentives —— */
        .home-incentives {
          background: #fff;
          border-radius: 1.25rem;
          padding: 1.25rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          transition: box-shadow 0.35s ease, transform 0.35s ease, border-color 0.35s ease;
        }
        @media (min-width: 576px) {
          .home-incentives { padding: 1.5rem; }
        }
        .home-incentives:hover {
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
          border-color: rgba(99,102,241,0.12);
        }
        .home-incentive-icon {
          width: 52px;
          height: 52px;
          min-width: 52px;
          border-radius: 1rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 8px 20px rgba(99,102,241,0.35);
        }
        .home-incentive-icon svg { color: #fff; }
        .home-incentive-title { font-weight: 700; font-size: 0.9375rem; color: #111; margin-bottom: 0.2rem; }
        .home-incentive-desc { font-size: 0.8125rem; color: #6b7280; margin: 0; line-height: 1.4; }
        /* —— Testimonial —— */
        .home-testimonial {
          background: #fff;
          border-radius: 1.25rem;
          padding: 1.75rem 1.5rem;
          border: 1px solid rgba(0,0,0,0.06);
          max-width: 640px;
          margin: 0 auto;
          box-shadow: 0 8px 32px rgba(0,0,0,0.06);
          position: relative;
        }
        @media (min-width: 576px) {
          .home-testimonial { padding: 2.25rem 2.5rem; }
        }
        .home-testimonial::before {
          content: '"';
          position: absolute;
          top: 1rem;
          left: 1.25rem;
          font-size: 3rem;
          font-weight: 700;
          color: #6366f1;
          opacity: 0.2;
          line-height: 1;
        }
        .home-testimonial-quote {
          font-size: clamp(1rem, 2.2vw, 1.125rem);
          line-height: 1.7;
          color: #374151;
          font-style: italic;
          margin-bottom: 1rem;
          padding-left: 0.5rem;
        }
        .home-testimonial-author { font-weight: 600; color: #111; font-size: 0.9375rem; }
        /* —— Newsletter CTA —— */
        .home-newsletter {
          background: linear-gradient(145deg, #0c0c0e 0%, #15151c 40%, #1a1a24 100%);
          border-radius: 1.25rem;
          padding: clamp(2rem, 5vw, 3rem) 1.5rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 24px 56px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.06);
        }
        .home-newsletter::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 60%;
          height: 200%;
          background: radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .home-newsletter-title {
          font-size: clamp(1.125rem, 3vw, 1.5rem);
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.5rem;
          position: relative;
        }
        .home-newsletter-desc {
          font-size: clamp(0.875rem, 2vw, 0.9375rem);
          color: rgba(255,255,255,0.78);
          margin-bottom: 1.5rem;
          position: relative;
        }
        .home-newsletter .home-hero-cta {
          position: relative;
        }
        /* Responsive: product grid and touch targets */
        .home-page .card-product {
          min-height: 100%;
        }
        @media (max-width: 575.98px) {
          .home-hero-dots { bottom: 1rem; }
          .home-pills-wrap {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 0.5rem;
            margin-bottom: 1.25rem;
            padding-bottom: 0.25rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .home-pills-wrap::-webkit-scrollbar { display: none; }
          .home-pill { flex-shrink: 0; }
        }
      `}</style>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-accent" aria-hidden />
        <div className="home-hero-bg" aria-hidden>
          {heroImages.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={heroSlide === i ? 'active' : ''}
              style={{ position: 'absolute', inset: 0 }}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          ))}
        </div>
        <div className="home-hero-overlay" aria-hidden />
        <div className="container position-relative">
          <div className="home-hero-content">
            <span className="home-hero-badge">New collection</span>
            <h1 className="home-hero-title">Quality first. Style that lasts.</h1>
            <p className="home-hero-desc">
              Premium picks for every moment. {freeShippingText}.
            </p>
            <a href="/shop/" className="home-hero-cta">
              Shop now
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
        <div className="home-hero-dots">
          {heroImages.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`home-hero-dot ${heroSlide === i ? 'active' : ''}`}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setHeroSlide(i)}
            />
          ))}
        </div>
      </section>

      {/* Trust bar — builds confidence */}
      <div className="home-trust-bar">
        <div className="container">
          <div className="row g-3 g-md-0 justify-content-center justify-content-md-between align-items-center text-center text-md-start">
            <div className="col-12 col-md-4">
              <div className="home-trust-item justify-content-center justify-content-md-start">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                {freeShippingText}
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="home-trust-item justify-content-center justify-content-md-start">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Secure checkout
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="home-trust-item justify-content-center justify-content-md-start">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                We're here to help
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      {displayCategories.length > 0 && (
        <section
          ref={setSectionRef(0)}
          data-section-index={0}
          className={`home-section home-section-reveal ${visible[0] ? 'in-view' : ''}`}
          style={{ background: '#fff' }}
        >
          <div className="container">
            <div className="home-section-head text-center">
              <p className="home-section-label">Browse</p>
              <h2 className="home-section-title">Shop by category</h2>
              <p className="home-section-subtitle text-center">Find what you love by collection</p>
            </div>
            <div className="row g-3 g-lg-4">
              {displayCategories.map((cat) => (
                <div key={cat.id} className="col-6 col-lg-3">
                  <div className="home-category-card">
                    <CardCategory
                      thumb_src={cat.thumb_src}
                      title={cat.title}
                      collection={cat.collection}
                      productCount={productCountByCategory[cat.id]}
                      categoryId={cat.id}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <a href="/shop/" className="home-section-cta">View all categories →</a>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {featuredProducts.length > 0 && (
        <section
          ref={setSectionRef(1)}
          data-section-index={1}
          className={`home-section home-section-reveal ${visible[1] ? 'in-view' : ''}`}
        >
          <div className="container">
            <div className="home-section-head text-center">
              <p className="home-section-label">New</p>
              <h2 className="home-section-title">New arrivals</h2>
              <p className="home-section-subtitle text-center">Fresh picks for the season</p>
            </div>
            <div className="row g-3 g-lg-4">
              {featuredProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="col-6 col-lg-3 home-card-product-wrap">
                  <CardProduct
                    thumb_src={product.thumb_src}
                    thumb_alt={product.thumb_alt || product.title}
                    videoUrl={product.videoUrl}
                    color={product.color}
                    colors={product.colors}
                    size={product.size}
                    sizes={product.sizes}
                    title={product.title}
                    description={product.shortDescription || product.description}
                    price={product.price}
                    currency={product.currency ?? currency}
                    position="center"
                    productId={product.id}
                    stock={product.stock}
                    star={product.star}
                  />
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <a href="/shop/?sort=new-arrivals" className="home-section-cta">View new arrivals →</a>
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      <section
        ref={setSectionRef(2)}
        data-section-index={2}
        className={`home-section home-section-reveal ${visible[2] ? 'in-view' : ''}`}
        style={{ background: '#fff' }}
      >
        <div className="container">
          <div className="home-section-head text-center">
            <p className="home-section-label">Popular</p>
            <h2 className="home-section-title">Best sellers</h2>
            <p className="home-section-subtitle text-center">Customer favorites</p>
          </div>
          <div className="d-flex flex-wrap justify-content-center gap-2 mb-4 px-1 home-pills-wrap">
            {bestSellerCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setBestSellerFilter(cat.id)}
                className={`home-pill ${bestSellerFilter === cat.id ? 'active' : ''}`}
              >
                {cat.title}
              </button>
            ))}
          </div>
          <div className="row g-3 g-lg-4">
            {(bestSellerProducts.length > 0 ? bestSellerProducts : inStockProducts.slice(0, 8)).map((product) => (
              <div key={product.id} className="col-6 col-lg-3 home-card-product-wrap">
                <CardProduct
                  thumb_src={product.thumb_src}
                  thumb_alt={product.thumb_alt || product.title}
                  videoUrl={product.videoUrl}
                  color={product.color}
                  colors={product.colors}
                  size={product.size}
                  sizes={product.sizes}
                  title={product.title}
                  description={product.shortDescription || product.description}
                  price={product.price}
                  currency={product.currency ?? currency}
                  position="center"
                  productId={product.id}
                  stock={product.stock}
                  star={product.star}
                />
              </div>
            ))}
          </div>
          <div className="text-center mt-3">
            <a href="/shop/?sort=best-sellers" className="home-section-cta">View all best sellers →</a>
          </div>
        </div>
      </section>

      {/* Incentives */}
      <section
        ref={setSectionRef(3)}
        data-section-index={3}
        className={`home-section home-section-reveal ${visible[3] ? 'in-view' : ''}`}
      >
        <div className="container">
          <div className="row g-3 g-md-4 justify-content-center">
            <div className="col-12 col-md-4">
              <div className="home-incentives">
                <div className="home-incentive-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </div>
                <div>
                  <div className="home-incentive-title">Fast delivery</div>
                  <p className="home-incentive-desc">{freeShippingText}</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="home-incentives">
                <div className="home-incentive-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <div className="home-incentive-title">Secure checkout</div>
                  <p className="home-incentive-desc">Safe and encrypted payments</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="home-incentives">
                <div className="home-incentive-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div>
                  <div className="home-incentive-title">Support</div>
                  <p className="home-incentive-desc">We're here to help</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section
        ref={setSectionRef(4)}
        data-section-index={4}
        className={`home-section home-section-reveal ${visible[4] ? 'in-view' : ''}`}
        style={{ background: '#fff' }}
      >
        <div className="container">
          <div className="home-section-head text-center">
            <p className="home-section-label">Testimonials</p>
            <h2 className="home-section-title">What customers say</h2>
            <p className="home-section-subtitle text-center">Real feedback from people who shop with us</p>
          </div>
          <div className="home-testimonial">
            <p className="home-testimonial-quote">
              &ldquo;The quality and style from OPAL is exceptional. I always find something that fits my taste and the delivery is fast.&rdquo;
            </p>
            <p className="home-testimonial-author mb-0">Sarah M. — Happy customer</p>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section
        ref={setSectionRef(5)}
        data-section-index={5}
        className={`home-section home-section-reveal ${visible[5] ? 'in-view' : ''}`}
      >
        <div className="container">
          <div className="home-newsletter mx-auto" style={{ maxWidth: '720px' }}>
            <h3 className="home-newsletter-title">Join the OPAL community</h3>
            <p className="home-newsletter-desc">Get updates on new arrivals and exclusive offers.</p>
            <a href="/contact/" className="home-hero-cta" style={{ background: '#fff', color: '#0c0c0e' }}>
              Contact us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
