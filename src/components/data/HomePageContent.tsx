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
  const [bestSellerFilter, setBestSellerFilter] = useState<string>('all');

  useEffect(() => {
    const t = setInterval(() => {
      setHeroSlide((s) => (s + 1) % heroCarouselImages.length);
    }, 4500);
    return () => clearInterval(t);
  }, [heroCarouselImages.length]);

  const productCountByCategory: Record<string, number> = {};
  categories.forEach((c) => {
    productCountByCategory[c.id] = inStockProducts.filter((p) => p.categoryId === c.id).length;
  });

  const bestSellerProducts =
    bestSellerFilter === 'all'
      ? inStockProducts.slice(0, 8)
      : inStockProducts.filter((p) => p.categoryId === bestSellerFilter).slice(0, 8);
  const bestSellerCategories = [{ id: 'all', title: 'All' }, ...displayCategories];

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
    <div className="home-page-bg">
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
        @keyframes home-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes home-hero-in {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes home-hero-line {
          from { opacity: 0; transform: scaleX(0); }
          to { opacity: 1; transform: scaleX(1); }
        }
        @keyframes home-mesh {
          0%, 100% { opacity: 0.35; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.55; transform: scale(1.04) translate(1%, 1%); }
        }
        @keyframes hero-kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.06) translate(-1.5%, -0.5%); }
        }
        @keyframes hero-progress {
          to { width: 100%; }
        }
        @keyframes hero-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes home-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes home-shine {
          0% { transform: translateX(-100%) skewX(-12deg); opacity: 0.4; }
          100% { transform: translateX(200%) skewX(-12deg); opacity: 0; }
        }
        @keyframes home-scale-in {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes home-border-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.12); }
          50% { box-shadow: 0 0 0 1px rgba(255,255,255,0.25), 0 8px 32px rgba(0,0,0,0.12), 0 0 40px rgba(255,255,255,0.03); }
        }
        .home-hero-copy-wrap { z-index: 10; pointer-events: auto; }
        .home-hero-section .hero-carousel-frame,
        .home-hero-section .home-hero-mesh { z-index: 0; }
        .hero-carousel-frame {
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: 0 24px 56px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06);
        }
        .hero-carousel-slide {
          transition: opacity 2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hero-carousel-slide.active img {
          animation: hero-kenburns 5s ease-out forwards;
        }
        .hero-carousel-slide:not(.active) img {
          transform: scale(1);
        }
        .hero-progress-track {
          height: 2px;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
          overflow: hidden;
          min-width: 64px;
        }
        .hero-progress-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%);
          border-radius: 2px;
          animation: hero-progress 4500ms linear forwards;
        }
        .hero-dot-btn {
          transition: width 0.3s ease, opacity 0.3s ease, background 0.3s ease;
        }
        .hero-dot-btn:hover { opacity: 1; }
        .home-hero-accent-line {
          transform-origin: left;
          animation: home-hero-line 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.05s forwards;
          opacity: 0;
        }
        .home-hero-gradient-text {
          background: linear-gradient(135deg, #fff 0%, #e4e4eb 40%, #c4c4d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .home-hero-content .home-hero-item { opacity: 0; animation: home-hero-in 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .home-hero-content .home-hero-item:nth-child(1) { animation-delay: 0.05s; }
        .home-hero-content .home-hero-item:nth-child(2) { animation-delay: 0.12s; }
        .home-hero-content .home-hero-item:nth-child(3) { animation-delay: 0.22s; }
        .home-hero-content .home-hero-item:nth-child(4) { animation-delay: 0.32s; }
        .home-hero-content .home-hero-item:nth-child(5) { animation-delay: 0.42s; }
        .home-hero-content .home-hero-item:nth-child(6) { animation-delay: 0.52s; }
        .home-hero-content .home-hero-item:nth-child(7) { animation-delay: 0.62s; }
        .home-hero-content .home-hero-item:nth-child(8) { animation-delay: 0.72s; }
        .home-hero-content .home-hero-item:nth-child(9) { animation-delay: 0.82s; }
        .home-hero-cta {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease, background 0.3s ease;
        }
        .home-hero-cta:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.15);
        }
        .home-hero-mesh {
          background: radial-gradient(ellipse 70% 45% at 15% 50%, rgba(120,119,198,0.12) 0%, transparent 50%),
                    radial-gradient(ellipse 50% 35% at 85% 50%, rgba(99,102,241,0.06) 0%, transparent 50%);
          animation: home-mesh 14s ease-in-out infinite;
        }
        .home-glass {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .home-glass-card {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.7);
          box-shadow: 0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, border-color 0.4s ease, background 0.4s ease;
        }
        .home-glass-card:hover {
          transform: translateY(-8px);
          background: rgba(255,255,255,0.78);
          border-color: rgba(255,255,255,0.95);
          box-shadow: 0 24px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1);
        }
        .home-glass-card:hover .home-incentive-icon { transform: scale(1.1); }
        .home-incentive-icon { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .home-section-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1), transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .home-section-reveal.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .home-section-reveal.in-view .home-stagger-1 { animation: home-scale-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .home-section-reveal.in-view .home-stagger-2 { animation: home-scale-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.08s forwards; }
        .home-section-reveal.in-view .home-stagger-3 { animation: home-scale-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.16s forwards; }
        .home-section-reveal .home-stagger-1, .home-section-reveal .home-stagger-2, .home-section-reveal .home-stagger-3 { opacity: 0; }
        .home-product-card { opacity: 0; transform: translateY(20px); transition: opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
        .home-section-reveal.in-view .home-product-card:nth-child(1) { opacity: 1; transform: translateY(0); transition-delay: 0.05s; }
        .home-section-reveal.in-view .home-product-card:nth-child(2) { opacity: 1; transform: translateY(0); transition-delay: 0.1s; }
        .home-section-reveal.in-view .home-product-card:nth-child(3) { opacity: 1; transform: translateY(0); transition-delay: 0.15s; }
        .home-section-reveal.in-view .home-product-card:nth-child(4) { opacity: 1; transform: translateY(0); transition-delay: 0.2s; }
        .home-section-reveal.in-view .home-product-card:nth-child(5) { opacity: 1; transform: translateY(0); transition-delay: 0.25s; }
        .home-section-reveal.in-view .home-product-card:nth-child(6) { opacity: 1; transform: translateY(0); transition-delay: 0.3s; }
        .home-section-reveal.in-view .home-product-card:nth-child(7) { opacity: 1; transform: translateY(0); transition-delay: 0.35s; }
        .home-section-reveal.in-view .home-product-card:nth-child(8) { opacity: 1; transform: translateY(0); transition-delay: 0.4s; }
        .home-best-sellers-block {
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s ease;
        }
        .home-best-sellers-block:hover {
          transform: translateY(-10px);
          box-shadow: 0 32px 64px rgba(0,0,0,0.12);
        }
        .home-best-sellers-block .home-shine-wrap { position: relative; overflow: hidden; }
        .home-best-sellers-block .home-shine-wrap::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.15) 45%, transparent 55%);
          transform: translateX(-100%);
          pointer-events: none;
        }
        .home-best-sellers-block:hover .home-shine-wrap::after {
          animation: home-shine 0.7s ease-out forwards;
        }
        .home-section-label { letter-spacing: 0.2em; font-size: 0.7rem; font-weight: 700; }
        .home-cta-glass {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .home-cta-glow { box-shadow: 0 0 80px rgba(255,255,255,0.06); }
        .home-categories .card {
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
        }
        .home-categories .card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 48px rgba(0,0,0,0.1);
        }
        .home-btn-pill { transition: color 0.25s ease, background 0.25s ease, border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease; }
        .home-btn-pill:hover { transform: translateY(-2px); }
        .home-btn-dark-cool {
          background: linear-gradient(135deg, #1a1a1f 0%, #2d2d35 100%);
          border: none;
          box-shadow: 0 4px 14px rgba(0,0,0,0.2);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .home-btn-dark-cool:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.28);
        }
        .home-btn-outline-cool {
          border-width: 2px;
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, color 0.25s ease;
        }
        .home-btn-outline-cool:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        .home-section-title-wrap { position: relative; }
        .home-section-title-wrap .home-title-accent {
          display: inline-block;
          width: 32px;
          height: 3px;
          border-radius: 2px;
          background: linear-gradient(90deg, #1a1a1f 0%, #3d3d48 100%);
          margin-bottom: 0.75rem;
        }
        .home-section-title-wrap.highlight .home-title-accent {
          background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
        }
        .home-categories .card { overflow: hidden; }
        .home-categories .card .full-background,
        .home-categories .card img { transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
        .home-categories .card:hover .full-background,
        .home-categories .card:hover img { transform: scale(1.06); }
        .home-best-pill {
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, color 0.25s ease;
        }
        .home-best-pill:hover { transform: translateY(-1px); }
        .home-best-pill.active {
          background: linear-gradient(135deg, #1a1a1f 0%, #2d2d35 100%);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .home-testimonial-quote {
          border-left: 4px solid #6366f1;
          padding-left: 1.25rem;
        }
        .home-page-bg {
          background: #fafafa;
          background-image: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.04) 0%, transparent 50%);
        }
        .home-float-subtle { animation: home-float 4s ease-in-out infinite; }
        .home-section-reveal.in-view .home-product-card { opacity: 1; transform: translateY(0); }
      `}</style>
      {/* Hero — clean, editorial */}
      <section
        className="position-relative overflow-hidden rounded-4 mx-2 mx-md-3 mx-lg-5 mb-5 mb-lg-6 home-hero-section"
        style={{
          background: 'linear-gradient(152deg, #0c0c0e 0%, #16161a 35%, #1e1e24 100%)',
          minHeight: 'min(90vh, 640px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Copy + gradient overlay */}
        <div
          className="position-absolute top-0 start-0 bottom-0 d-flex align-items-center rounded-4 home-hero-copy-wrap"
          style={{
            width: '100%',
            maxWidth: '100%',
            background: 'linear-gradient(108deg, rgba(12,12,14,0.92) 0%, rgba(12,12,14,0.55) 45%, rgba(12,12,14,0.08) 70%, transparent 100%)',
            zIndex: 10,
            padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 4vw, 3rem)',
          }}
        >
          <div className="home-hero-content" style={{ maxWidth: 'min(100%, 420px)' }}>
            <div
              className="home-hero-item home-hero-accent-line mb-3"
              style={{ width: 40, height: 2, background: 'linear-gradient(90deg, rgba(255,255,255,0.5) 0%, transparent 100%)', borderRadius: 1 }}
              aria-hidden
            />
            <p
              className="home-hero-item text-uppercase small mb-2 text-white"
              style={{ letterSpacing: '0.18em', fontSize: '0.6875rem', fontWeight: 600, opacity: 0.85 }}
            >
              New collection
            </p>
            <h1
              className="home-hero-item fw-bold mb-3 lh-tight home-hero-gradient-text"
              style={{ letterSpacing: '-0.035em', fontSize: 'clamp(1.9rem, 4.5vw, 2.85rem)', lineHeight: 1.15 }}
            >
              Quality first. Style that lasts.
            </h1>
            <p
              className="home-hero-item mb-4 text-white"
              style={{ fontSize: '1rem', opacity: 0.88, lineHeight: 1.6 }}
            >
              Premium picks for every moment. {freeShippingText}.
            </p>
            <a
              href="/shop/"
              className="home-hero-item btn btn-light rounded-pill px-4 py-2 fw-semibold border-0 home-hero-cta"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontSize: '0.9375rem' }}
            >
              Shop now
            </a>
          </div>
        </div>
        {/* Ambient mesh */}
        <div className="position-absolute top-0 start-0 end-0 bottom-0 rounded-4 home-hero-mesh pointer-events-none" aria-hidden />
        <div
          className="position-absolute top-0 start-0 end-0 bottom-0 rounded-4 pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.12\'/%3E%3C/svg%3E")' }}
          aria-hidden
        />
        {/* Mobile: carousel background */}
        <div className="position-absolute top-0 end-0 bottom-0 start-0 d-lg-none rounded-4 d-flex align-items-end" aria-hidden>
          <div className="hero-carousel-frame position-absolute m-2" style={{ bottom: '0.75rem', top: '0.75rem', left: '0.75rem', right: '0.75rem' }}>
            {heroCarouselImages.map((src, i) => (
              <div
                key={`m-${src}`}
                className={`hero-carousel-slide position-absolute top-0 start-0 end-0 bottom-0 ${heroSlide === i ? 'active' : ''}`}
                style={{ opacity: heroSlide === i ? 0.28 : 0, zIndex: heroSlide === i ? 1 : 0 }}
              >
                <img src={src} alt="" className="position-absolute top-0 start-0 end-0 bottom-0 h-100 w-100" style={{ objectFit: 'cover' }} loading={i === 0 ? 'eager' : 'lazy'} />
              </div>
            ))}
          </div>
        </div>
        {/* Desktop: right carousel + indicators */}
        <div
          className="position-absolute top-0 end-0 bottom-0 d-none d-lg-flex align-items-center justify-content-center"
          style={{ width: '52%', paddingRight: 'clamp(1.25rem, 3.5vw, 2.5rem)' }}
          aria-hidden
        >
          <div className="position-relative d-flex flex-column align-items-center gap-3" style={{ width: '90%', maxWidth: '480px', height: '82%', maxHeight: '460px' }}>
            <div className="hero-carousel-frame position-relative flex-grow-1 w-100 rounded-4 overflow-hidden">
              {heroCarouselImages.map((src, i) => (
                <div
                  key={`d-${src}`}
                  className={`hero-carousel-slide position-absolute top-0 start-0 end-0 bottom-0 ${heroSlide === i ? 'active' : ''}`}
                  style={{ opacity: heroSlide === i ? 1 : 0, zIndex: heroSlide === i ? 1 : 0 }}
                >
                  <img src={src} alt="" className="position-absolute top-0 start-0 end-0 bottom-0 h-100 w-100" style={{ objectFit: 'cover' }} loading={i === 0 ? 'eager' : 'lazy'} />
                </div>
              ))}
              <div className="position-absolute bottom-0 start-0 end-0 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)', pointerEvents: 'none' }} />
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              {heroCarouselImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className="hero-dot-btn border-0 rounded-pill p-0 bg-white"
                  style={{
                    width: heroSlide === i ? 20 : 8,
                    height: 8,
                    opacity: heroSlide === i ? 1 : 0.4,
                    background: heroSlide === i ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
                  }}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setHeroSlide(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 1. Featured Categories — Martup-style */}
      {displayCategories.length > 0 && (
        <section
          ref={setSectionRef(1)}
          data-section-index={1}
          className={`py-5 py-lg-6 home-categories home-section-reveal ${visible[1] ? 'in-view' : ''}`}
        >
          <div className="container">
            <div className="text-center mb-5">
              <div className="home-section-title-wrap d-inline-block text-start">
                <div className="home-title-accent" />
                <h2 className="h3 fw-bold mb-2" style={{ letterSpacing: '-0.025em' }}>Featured Categories</h2>
              </div>
              <p className="text-body-secondary mb-0 mx-auto" style={{ maxWidth: '32rem' }}>
                Browse our most popular categories and find the perfect picks for your home.
              </p>
            </div>
            <div className="row g-3 g-lg-4">
              {displayCategories.map((cat) => (
                <div key={cat.id} className="col-6 col-lg-3">
                  <CardCategory
                    thumb_src={cat.thumb_src}
                    title={cat.title}
                    collection={cat.collection}
                    productCount={productCountByCategory[cat.id]}
                  />
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <a href="/shop/" className="btn btn-outline-dark rounded-pill fw-semibold home-btn-pill home-btn-outline-cool">
                View all categories
              </a>
            </div>
          </div>
        </section>
      )}

      {/* 2. New Arrivals */}
      {featuredProducts.length > 0 && (
        <section
          ref={setSectionRef(2)}
          data-section-index={2}
          className={`py-5 py-lg-6 home-section-reveal ${visible[2] ? 'in-view' : ''}`}
          style={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #f1f3f5 50%, #fff 100%)' }}
        >
          <div className="container">
            <div className="text-center mb-5">
              <div className="home-section-title-wrap highlight d-inline-block text-start">
                <div className="home-title-accent" />
                <h2 className="h3 fw-bold mb-2" style={{ letterSpacing: '-0.025em' }}>New Arrivals</h2>
              </div>
              <p className="text-body-secondary mb-0 mx-auto" style={{ maxWidth: '32rem' }}>
                Discover our latest collection designed for modern living.
              </p>
            </div>
            <div className="row g-3 g-lg-4">
              {featuredProducts.slice(0, 4).map((product) => (
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
            <div className="text-center mt-4">
              <a href="/shop/" className="btn btn-dark rounded-pill px-4 fw-semibold home-btn-pill home-btn-dark-cool">
                View all products
              </a>
            </div>
          </div>
        </section>
      )}

      {/* 3. Best Sellers */}
      <section
        ref={setSectionRef(3)}
        data-section-index={3}
        className={`py-5 py-lg-6 home-section-reveal ${visible[3] ? 'in-view' : ''}`}
      >
        <div className="container">
          <div className="text-center mb-4">
            <div className="home-section-title-wrap d-inline-block text-start">
              <div className="home-title-accent" />
              <h2 className="h3 fw-bold mb-2" style={{ letterSpacing: '-0.025em' }}>Best Sellers</h2>
            </div>
            <p className="text-body-secondary mb-0 mx-auto" style={{ maxWidth: '32rem' }}>
              Our most popular products based on sales and customer satisfaction.
            </p>
          </div>
          <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
            {bestSellerCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setBestSellerFilter(cat.id)}
                className={`btn rounded-pill fw-semibold home-best-pill ${bestSellerFilter === cat.id ? 'active btn-dark' : 'btn-outline-dark'}`}
              >
                {cat.title}
              </button>
            ))}
          </div>
          <div className="row g-3 g-lg-4">
            {(bestSellerProducts.length > 0 ? bestSellerProducts : inStockProducts.slice(0, 8)).map((product) => (
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
          <div className="text-center mt-4">
            <a href="/shop/" className="btn btn-outline-dark rounded-pill fw-semibold home-btn-pill home-btn-outline-cool">
              View all
            </a>
          </div>
        </div>
      </section>

      {/* 4. Incentives */}
      <section
        ref={setSectionRef(4)}
        data-section-index={4}
        className={`py-5 py-lg-6 home-section-reveal ${visible[4] ? 'in-view' : ''}`}
      >
        <div className="container">
          <div className="row g-3 g-md-4">
            <div className="col-12 col-md-4 home-stagger-1">
              <div className="home-glass-card d-flex align-items-center gap-3 p-4 p-md-4 rounded-4 h-100">
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
              <div className="home-glass-card d-flex align-items-center gap-3 p-4 p-md-4 rounded-4 h-100">
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
              <div className="home-glass-card d-flex align-items-center gap-3 p-4 p-md-4 rounded-4 h-100">
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

      {/* 5. Testimonials */}
      <section
        ref={setSectionRef(5)}
        data-section-index={5}
        className={`py-5 py-lg-6 home-section-reveal ${visible[5] ? 'in-view' : ''}`}
        style={{ background: 'linear-gradient(180deg, #fff 0%, #f8f9fa 100%)' }}
      >
        <div className="container">
          <div className="text-center mb-4">
            <div className="home-section-title-wrap highlight d-inline-block text-start">
              <div className="home-title-accent" />
              <h2 className="h3 fw-bold mb-2" style={{ letterSpacing: '-0.025em' }}>What our customers say</h2>
            </div>
            <p className="text-body-secondary mb-0 mx-auto" style={{ maxWidth: '32rem' }}>
              Read testimonials from satisfied customers about their experience with OPAL.
            </p>
          </div>
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <blockquote className="home-glass-card home-testimonial-quote rounded-4 p-4 p-lg-5 mb-0 text-start border-0">
                <p className="fs-5 text-body mb-3 fst-italic">
                  &ldquo;The quality and style from OPAL is exceptional. I always find something that fits my taste and the delivery is fast.&rdquo;
                </p>
                <footer className="text-body-secondary">
                  <strong className="text-dark">Sarah M.</strong>
                  <span className="opacity-75"> — Happy customer</span>
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
