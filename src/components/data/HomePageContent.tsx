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
      { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
    );
    const timer = setTimeout(() => {
      sectionRefs.current.forEach((el) => el && observer.observe(el));
    }, 50);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [loading]);

  const currency = settings.currency ?? '৳';
  const freeThreshold = settings.freeShippingThreshold;
  const freeShippingText =
    freeThreshold != null && freeThreshold > 0
      ? `Free shipping on orders over ${currency}${freeThreshold.toLocaleString()}`
      : 'Free shipping on selected orders';

  const inStockProducts = products.filter((p) => p.stock !== false);
  const featuredProducts = inStockProducts.slice(0, 8);
  // Prefer nested (sub-)categories that have images, then any category with image, then fill up to 4
  const nestedWithImage = categories.filter((c) => c.parentId && c.thumb_src);
  const topWithImage = categories.filter((c) => !c.parentId && c.thumb_src);
  const rest = categories.filter((c) => !nestedWithImage.includes(c) && !topWithImage.includes(c));
  const displayCategories = [...nestedWithImage, ...topWithImage, ...rest].slice(0, 4);
  const heroImage =
    displayCategories[0]?.thumb_src ||
    inStockProducts[0]?.thumb_src ||
    '/images/suit-3.jpg';

  // Hero carousel: opal1 & opal2
  const heroCarouselImages = [
    '/images/opal1.jpg',
    '/images/opal2.jpg',
    '/images/opal3.jpeg',
    '/images/opal4.jpg',
    '/images/opal5.jpg',
    '/images/opal6.jpg',
    '/images/opal7.jpg',
    '/images/opal8.jpg',
    '/images/opal9.jpg',
  ];
  const [heroSlide, setHeroSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setHeroSlide((s) => (s + 1) % heroCarouselImages.length);
    }, 4500);
    return () => clearInterval(t);
  }, [heroCarouselImages.length]);

  if (loading) {
    return (
      <div className="min-vh-50 d-flex align-items-center justify-content-center py-12">
        <div className="text-center">
          <div className="spinner-border text-dark mb-2" role="status" />
          <p className="text-body-secondary small mb-0">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes home-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes home-hero-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes home-mesh {
          0%, 100% { opacity: 0.4; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.6; transform: scale(1.05) translate(2%, 2%); }
        }
        @keyframes hero-kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.08) translate(-2%, -1%); }
        }
        @keyframes hero-progress {
          to { width: 100%; }
        }
        .home-hero-copy-wrap { z-index: 10; pointer-events: auto; }
        .home-hero-section .hero-carousel-frame,
        .home-hero-section .home-hero-mesh { z-index: 0; }
        .hero-carousel-frame {
          border-radius: 1.25rem;
          overflow: hidden;
          box-shadow: 0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
        }
        .hero-carousel-slide {
          transition: opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hero-carousel-slide.active img {
          animation: hero-kenburns 4.5s ease-out forwards;
        }
        .hero-carousel-slide:not(.active) img {
          transform: scale(1);
        }
        .hero-progress-track {
          height: 3px;
          background: rgba(255,255,255,0.25);
          border-radius: 3px;
          overflow: hidden;
          min-width: 80px;
        }
        .hero-progress-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.9) 100%);
          border-radius: 3px;
          animation: hero-progress 4500ms linear forwards;
        }
        .hero-dot-btn {
          transition: width 0.35s ease, opacity 0.35s ease, background 0.35s ease;
        }
        .hero-dot-btn:hover { opacity: 1; }
        .home-hero-gradient-text {
          background: linear-gradient(120deg, #fff 0%, #e8e8ed 45%, #b8b8c8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .home-hero-content .home-hero-item { opacity: 0; animation: home-hero-in 0.6s ease forwards; }
        .home-hero-content .home-hero-item:nth-child(1) { animation-delay: 0.1s; }
        .home-hero-content .home-hero-item:nth-child(2) { animation-delay: 0.2s; }
        .home-hero-content .home-hero-item:nth-child(3) { animation-delay: 0.25s; }
        .home-hero-content .home-hero-item:nth-child(4) { animation-delay: 0.35s; }
        .home-hero-content .home-hero-item:nth-child(5) { animation-delay: 0.45s; }
        .home-hero-content .home-hero-item:nth-child(6) { animation-delay: 0.55s; }
        .home-hero-content .home-hero-item:nth-child(7) { animation-delay: 0.65s; }
        .home-hero-content .home-hero-item:nth-child(8) { animation-delay: 0.75s; }
        .home-hero-content .home-hero-item:nth-child(9) { animation-delay: 0.85s; }
        .home-hero-mesh {
          background: radial-gradient(ellipse 80% 50% at 20% 40%, rgba(120,119,198,0.15) 0%, transparent 50%),
                    radial-gradient(ellipse 60% 40% at 80% 60%, rgba(99,102,241,0.08) 0%, transparent 50%);
          animation: home-mesh 12s ease-in-out infinite;
        }
        .home-incentive-card {
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease, border-color 0.35s ease;
        }
        .home-incentive-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(0,0,0,0.08);
          border-color: rgba(99,102,241,0.2) !important;
        }
        .home-incentive-card:hover .home-incentive-icon { transform: scale(1.08); }
        .home-incentive-icon { transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .home-section-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .home-section-reveal.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .home-section-reveal .home-stagger-1 { transition-delay: 0.05s; }
        .home-section-reveal .home-stagger-2 { transition-delay: 0.1s; }
        .home-section-reveal .home-stagger-3 { transition-delay: 0.15s; }
        .home-section-reveal .home-stagger-4 { transition-delay: 0.2s; }
        .home-product-card { opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .home-section-reveal.in-view .home-product-card:nth-child(1) { opacity: 1; transform: translateY(0); transition-delay: 0.05s; }
        .home-section-reveal.in-view .home-product-card:nth-child(2) { opacity: 1; transform: translateY(0); transition-delay: 0.1s; }
        .home-section-reveal.in-view .home-product-card:nth-child(3) { opacity: 1; transform: translateY(0); transition-delay: 0.15s; }
        .home-section-reveal.in-view .home-product-card:nth-child(4) { opacity: 1; transform: translateY(0); transition-delay: 0.2s; }
        .home-section-reveal.in-view .home-product-card:nth-child(5) { opacity: 1; transform: translateY(0); transition-delay: 0.25s; }
        .home-section-reveal.in-view .home-product-card:nth-child(6) { opacity: 1; transform: translateY(0); transition-delay: 0.3s; }
        .home-section-reveal.in-view .home-product-card:nth-child(7) { opacity: 1; transform: translateY(0); transition-delay: 0.35s; }
        .home-section-reveal.in-view .home-product-card:nth-child(8) { opacity: 1; transform: translateY(0); transition-delay: 0.4s; }
        .home-best-sellers-block { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease; }
        .home-best-sellers-block:hover { transform: translateY(-8px); box-shadow: 0 28px 56px rgba(0,0,0,0.12); }
        .home-section-label { letter-spacing: 0.2em; font-size: 0.7rem; font-weight: 700; }
        .home-cta-glow { box-shadow: 0 0 80px rgba(255,255,255,0.06); }
        .home-categories .card { transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease; }
        .home-categories .card:hover { transform: scale(1.02); box-shadow: 0 16px 40px rgba(0,0,0,0.12); }
        .home-btn-pill { transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease, transform 0.2s ease; }
        .home-btn-pill:hover { transform: translateY(-1px); }
      `}</style>
      {/* Hero — modern, editorial */}
      <section
        className="position-relative overflow-hidden rounded-4 mx-2 mx-md-3 mx-lg-5 mb-5 mb-lg-6 home-hero-section"
        style={{
          background: 'linear-gradient(145deg, #0f0f12 0%, #1c1c24 40%, #252530 100%)',
          minHeight: 'min(88vh, 620px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        }}
      >
        {/* Hero copy — left side (desktop) / overlay (mobile); above carousel */}
        <div
          className="position-absolute top-0 start-0 bottom-0 d-flex align-items-center rounded-4 px-3 px-md-4 px-lg-5 py-4 home-hero-copy-wrap"
          style={{
            width: '100%',
            maxWidth: '100%',
            background: 'linear-gradient(90deg, rgba(15,15,18,0.97) 0%, rgba(15,15,18,0.85) 45%, rgba(15,15,18,0.4) 70%, transparent 100%)',
            zIndex: 10,
          }}
        >
          <div className="home-hero-content" style={{ maxWidth: 'min(100%, 420px)' }}>
            <p className="home-hero-item text-uppercase small mb-2 home-section-label text-white" style={{ letterSpacing: '0.2em', fontSize: '0.7rem', opacity: 0.9 }}>
              New collection
            </p>
            <h1 className="home-hero-item h2 fw-bold mb-2 lh-tight home-hero-gradient-text" style={{ letterSpacing: '-0.03em', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
              Welcome to OPAL
            </h1>
            <p className="home-hero-item mb-2 text-white" style={{ fontSize: '1.05rem', opacity: 0.95 }}>
              Curated for every moment
            </p>
            <p className="home-hero-item small mb-3 text-white" style={{ fontSize: '0.95rem', opacity: 0.9 }}>
              {freeShippingText}. Discover quality picks and shop with confidence.
            </p>
            <a
              href="/shop/"
              className="home-hero-item btn btn-light rounded-pill px-4 py-2 fw-semibold border-0 home-btn-pill"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
            >
              Shop now
            </a>
          </div>
        </div>
        {/* Animated mesh + grain */}
        <div className="position-absolute top-0 start-0 end-0 bottom-0 rounded-4 home-hero-mesh pointer-events-none" aria-hidden />
        <div
          className="position-absolute top-0 start-0 end-0 bottom-0 opacity-20 rounded-4 pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
          aria-hidden
        />
        {/* Mobile: full-bleed carousel with frame */}
        <div className="position-absolute top-0 end-0 bottom-0 start-0 d-lg-none rounded-4 px-2 py-3 d-flex align-items-end" aria-hidden>
          <div className="hero-carousel-frame position-absolute top-0 start-0 end-0 bottom-0 m-2" style={{ bottom: '0.5rem', top: '0.5rem', left: '0.5rem', right: '0.5rem' }}>
            {heroCarouselImages.map((src, i) => (
              <div
                key={`m-${src}`}
                className={`hero-carousel-slide position-absolute top-0 start-0 end-0 bottom-0 ${heroSlide === i ? 'active' : ''}`}
                style={{ opacity: heroSlide === i ? 0.32 : 0, zIndex: heroSlide === i ? 1 : 0 }}
              >
                <img
                  src={src}
                  alt=""
                  className="position-absolute top-0 start-0 end-0 bottom-0 h-100 w-100"
                  style={{ objectFit: 'cover' }}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Desktop: right-side carousel panel with Ken Burns */}
        <div
          className="position-absolute top-0 end-0 bottom-0 d-none d-lg-flex align-items-center justify-content-center"
          style={{ width: '50%', paddingRight: 'clamp(1rem, 3vw, 2rem)' }}
          aria-hidden
        >
          <div className="hero-carousel-frame position-relative" style={{ width: '92%', maxWidth: '520px', height: '85%', maxHeight: '480px' }}>
            {heroCarouselImages.map((src, i) => (
              <div
                key={`d-${src}`}
                className={`hero-carousel-slide position-absolute top-0 start-0 end-0 bottom-0 ${heroSlide === i ? 'active' : ''}`}
                style={{ opacity: heroSlide === i ? 1 : 0, zIndex: heroSlide === i ? 1 : 0 }}
              >
                <img
                  src={src}
                  alt=""
                  className="position-absolute top-0 start-0 end-0 bottom-0 h-100 w-100"
                  style={{ objectFit: 'cover' }}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
            <div className="position-absolute bottom-0 start-0 end-0 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)', pointerEvents: 'none' }} />
          </div>
        </div>
      </section>

      {/* Incentives — glassmorphism cards */}
      <section
        ref={setSectionRef(1)}
        data-section-index={1}
        className={`py-5 py-lg-6 home-section-reveal ${visible[1] ? 'in-view' : ''}`}
      >
        <div className="container">
          <div className="row g-3 g-md-4">
            <div className="col-12 col-md-4 home-stagger-1">
              <div
                className="home-incentive-card d-flex align-items-center gap-3 p-4 p-md-4 rounded-4 h-100"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                <div className="home-incentive-icon rounded-4 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #1a1a1f 0%, #2d2d35 100%)' }}>
                  <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                </div>
                <div>
                  <h6 className="mb-1 fw-bold">Fast delivery</h6>
                  <p className="mb-0 small text-body-secondary">{freeShippingText}</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4 home-stagger-2">
              <div
                className="home-incentive-card d-flex align-items-center gap-3 p-4 p-md-4 rounded-4 h-100"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                <div className="home-incentive-icon rounded-4 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #1a1a1f 0%, #2d2d35 100%)' }}>
                  <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <div>
                  <h6 className="mb-1 fw-bold">Secure checkout</h6>
                  <p className="mb-0 small text-body-secondary">Safe and encrypted payments</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4 home-stagger-3">
              <div
                className="home-incentive-card d-flex align-items-center gap-3 p-4 p-md-4 rounded-4 h-100"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                <div className="home-incentive-icon rounded-4 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #1a1a1f 0%, #2d2d35 100%)' }}>
                  <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                <div>
                  <h6 className="mb-1 fw-bold">Support</h6>
                  <p className="mb-0 small text-body-secondary">We're here to help</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers — editorial block with hover lift */}
      <section
        ref={setSectionRef(2)}
        data-section-index={2}
        className={`py-5 py-lg-6 home-section-reveal ${visible[2] ? 'in-view' : ''}`}
      >
        <div className="container">
          <a href="/shop/" className="text-decoration-none text-body d-block home-best-sellers-block">
            <div className="row align-items-stretch g-0 rounded-4 overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.06)', minHeight: '340px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              <div className="col-lg-5 order-lg-1 order-2 d-flex flex-column justify-content-center p-4 p-lg-5">
                <p className="text-uppercase small mb-2 text-secondary home-section-label">Collection</p>
                <h2 className="h2 fw-bold mb-3 lh-tight" style={{ letterSpacing: '-0.02em' }}>Best Sellers</h2>
                <p className="text-body-secondary mb-4 mb-lg-0 pe-lg-3" style={{ fontSize: '1rem' }}>
                  Our most loved picks. Discover what everyone is buying and find your next favorite.
                </p>
                <span className="btn btn-dark rounded-pill px-4 py-2 mt-2 align-self-start d-inline-flex align-items-center gap-2 fw-semibold border-0">
                  Shop Best Sellers
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </span>
              </div>
              <div className="col-lg-7 order-lg-2 order-1 position-relative" style={{ minHeight: '280px' }}>
                <div className="position-absolute top-0 start-0 end-0 bottom-0 overflow-hidden">
                  <div className="position-absolute top-0 start-0 end-0 bottom-0 w-100 h-100" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.4) 0%, transparent 40%)', zIndex: 1 }} />
                  <img
                    src={toImageSrc(featuredProducts[0]?.thumb_src || heroImage)}
                    alt="Best Sellers"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Shop by category — accent header */}
      {displayCategories.length > 0 && (
        <section
          ref={setSectionRef(3)}
          data-section-index={3}
          className={`py-5 py-lg-6 home-categories home-section-reveal ${visible[3] ? 'in-view' : ''}`}
        >
          <div className="container">
            <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
              <div className="border-start border-3 border-dark ps-3">
                <h2 className="h3 fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>Shop by category</h2>
                <p className="text-body-secondary mb-0 small">Browse our collections</p>
              </div>
              <a href="/shop/" className="btn btn-outline-dark rounded-pill btn-sm fw-semibold home-btn-pill">
                View all
              </a>
            </div>
            <div className="row g-3 g-lg-4">
              {displayCategories.map((cat) => (
                <div key={cat.id} className="col-6 col-lg-3">
                  <CardCategory
                    thumb_src={cat.thumb_src}
                    title={cat.title}
                    collection={cat.collection}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured products — subtle gradient background */}
      {featuredProducts.length > 0 && (
        <section
          ref={setSectionRef(4)}
          data-section-index={4}
          className={`py-5 py-lg-6 home-section-reveal ${visible[4] ? 'in-view' : ''}`}
          style={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #f1f3f5 50%, #fff 100%)' }}
        >
          <div className="container">
            <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
              <div>
                <h2 className="h3 fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>Featured products</h2>
                <p className="text-body-secondary mb-0 small">
                  {inStockProducts.length} products available
                </p>
              </div>
              <a href="/shop/" className="btn btn-outline-dark rounded-pill btn-sm fw-semibold home-btn-pill">
                View all
              </a>
            </div>
            <div className="row g-3 g-lg-4">
              {featuredProducts.map((product) => (
                <div key={product.id} className="col-6 col-lg-3 home-product-card">
                  <CardProduct
                    thumb_src={product.thumb_src}
                    thumb_alt={product.thumb_alt || product.title}
                    color={product.color}
                    colors={product.colors}
                    title={product.title}
                    description={product.shortDescription || product.description}
                    price={product.price}
                    currency={product.currency ?? currency}
                    position="center"
                    productId={product.id}
                    stock={product.stock}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA — bold gradient block */}
      <section
        ref={setSectionRef(5)}
        data-section-index={5}
        className={`py-6 py-lg-7 rounded-4 mx-2 mx-md-3 mx-lg-5 home-cta-glow home-section-reveal ${visible[5] ? 'in-view' : ''}`}
        style={{
          background: 'linear-gradient(135deg, #1a1a1f 0%, #2d2d35 60%, #1e1e28 100%)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div className="container text-center text-white">
          <h2 className="h3 fw-bold mb-2 text-white" style={{ letterSpacing: '-0.02em' }}>Ready to shop?</h2>
          <p className="mb-4 mx-auto opacity-75" style={{ maxWidth: '32rem', color: 'rgba(255,255,255,0.9)' }}>
            {categories.length > 0 && products.length > 0
              ? `Explore ${categories.length} categories and ${inStockProducts.length} products.`
              : 'Explore our collection.'}
          </p>
          <a
            href="/shop/"
            className="btn btn-light btn-lg rounded-pill px-5 fw-semibold border-0 home-btn-pill"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            Start shopping
          </a>
        </div>
      </section>
    </>
  );
}
