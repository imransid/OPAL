'use client';

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
    Promise.all([getProducts(), getCategories(), getStoreSettings()])
      .then(([p, c, s]) => {
        setProducts(p);
        setCategories(c);
        setSettings(s);
      })
      .catch((err) => {
        console.error('[opal] Home data load failed:', err);
      })
      .finally(() => {
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
          background: #faf9f7;
        }
        /* —— Hero —— */
        .home-hero {
          position: relative;
          min-height: min(78vh, 540px);
          display: flex;
          align-items: center;
          overflow: hidden;
          background: #050506;
        }
        @media (min-width: 768px) {
          .home-hero { min-height: min(90vh, 720px); }
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
        .home-hero-bg img.active { opacity: 0.42; }
        .home-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, rgba(5,5,6,0.97) 0%, rgba(5,5,6,0.75) 42%, rgba(5,5,6,0.35) 68%, rgba(5,5,6,0.1) 100%);
        }
        .home-hero-accent {
          position: absolute;
          top: 0;
          left: 0;
          width: min(32vw, 180px);
          height: 1px;
          background: linear-gradient(90deg, rgba(196,165,116,0.95), rgba(196,165,116,0.15));
          z-index: 2;
        }
        .home-hero-content {
          position: relative;
          z-index: 2;
          max-width: 36rem;
          padding: 2rem 0;
        }
        @media (min-width: 576px) {
          .home-hero-content { padding: 2.5rem 0; }
        }
        @media (min-width: 992px) {
          .home-hero-content { padding: 3rem 0; max-width: 38rem; }
        }
        .home-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 0.625rem;
          font-weight: 500;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: rgba(250,249,247,0.85);
          margin-bottom: 1.75rem;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 0;
        }
        .home-hero-badge::before {
          content: '';
          width: 32px;
          height: 1px;
          background: rgba(196,165,116,0.7);
        }
        .home-hero-title {
          font-size: clamp(2rem, 5.2vw, 3.5rem);
          font-weight: 500;
          line-height: 1.06;
          letter-spacing: -0.035em;
          color: #faf9f7;
          margin-bottom: 1.35rem;
          text-shadow: none;
        }
        @media (min-width: 768px) {
          .home-hero-title { letter-spacing: -0.04em; }
        }
        .home-hero-desc {
          font-size: clamp(0.9375rem, 1.85vw, 1.0625rem);
          line-height: 1.75;
          font-weight: 400;
          color: rgba(250,249,247,0.62);
          margin-bottom: 2.25rem;
          max-width: 30ch;
        }
        .home-hero-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          min-height: 3.25rem;
          padding: 0 2rem;
          font-weight: 500;
          font-size: 0.6875rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          background: #faf9f7;
          color: #0c0b0d;
          border-radius: 0;
          text-decoration: none;
          transition: background 0.35s ease, color 0.35s ease, letter-spacing 0.35s ease;
          border: 1px solid rgba(250,249,247,0.12);
          box-shadow: none;
        }
        .home-hero-cta:hover {
          color: #faf9f7;
          background: transparent;
          letter-spacing: 0.24em;
        }
        .home-hero-cta:active { opacity: 0.92; }
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
          background: #faf9f7;
          padding: 1.35rem 0;
          border-bottom: 1px solid rgba(12, 11, 13, 0.06);
        }
        @media (min-width: 768px) {
          .home-trust-bar { padding: 1.5rem 0; }
        }
        .home-trust-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: clamp(0.6875rem, 1.5vw, 0.75rem);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #57534e;
          font-weight: 500;
          padding: 0.5rem 0.75rem;
        }
        @media (min-width: 768px) {
          .home-trust-item { justify-content: flex-start; }
        }
        .home-trust-item svg {
          flex-shrink: 0;
          color: #78716c;
          opacity: 0.85;
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
          margin-bottom: 2rem;
        }
        @media (min-width: 768px) {
          .home-section-head { margin-bottom: 2.75rem; }
        }
        .home-section-label {
          font-size: 0.625rem;
          font-weight: 500;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #78716c;
          margin-bottom: 0.85rem;
        }
        .home-section-title {
          font-size: clamp(1.5rem, 3.5vw, 2.125rem);
          font-weight: 500;
          letter-spacing: -0.025em;
          color: #1c1b1f;
          margin-bottom: 0.65rem;
          line-height: 1.2;
        }
        .home-section-subtitle {
          font-size: clamp(0.875rem, 1.85vw, 0.9375rem);
          color: #57534e;
          font-weight: 400;
          margin-bottom: 0;
          line-height: 1.65;
          max-width: 40ch;
          margin-left: auto;
          margin-right: auto;
        }
        .home-section-cta {
          display: inline-flex;
          align-items: center;
          font-weight: 500;
          font-size: 0.6875rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #1c1b1f;
          text-decoration: none;
          margin-top: 1.75rem;
          padding: 0.5rem 0;
          min-height: 44px;
          border-bottom: 1px solid rgba(12, 11, 13, 0.15);
          transition: color 0.3s ease, border-color 0.3s ease, gap 0.3s ease;
          gap: 0.35rem;
        }
        .home-section-cta:hover { color: #57534e; border-color: rgba(12, 11, 13, 0.35); gap: 0.5rem; }
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
          border-radius: 1rem;
          overflow: hidden;
          min-height: 220px;
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s ease;
          box-shadow: 0 0 0 1px rgba(12, 11, 13, 0.06), 0 12px 40px rgba(12, 11, 13, 0.06);
        }
        @media (max-width: 767.98px) {
          .home-category-card {
            min-height: 0;
            aspect-ratio: 4 / 5;
            max-height: min(72vw, 320px);
          }
          .home-category-card .card.card-background {
            min-height: 100%;
            height: 100%;
          }
        }
        @media (min-width: 768px) {
          .home-category-card { min-height: 280px; }
        }
        .home-category-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 0 1px rgba(12, 11, 13, 0.1), 0 20px 50px rgba(12, 11, 13, 0.1);
        }
        .home-category-card .card-background .full-background {
          transition: transform 0.75s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .home-category-card:hover .card-background .full-background {
          transform: scale(1.04);
        }
        .home-pill {
          padding: 0.55rem 1.15rem;
          min-height: 44px;
          font-size: 0.6875rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-radius: 0;
          border: 1px solid rgba(12, 11, 13, 0.12);
          background: #fff;
          color: #57534e;
          transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease;
          cursor: pointer;
        }
        .home-pill:hover {
          border-color: rgba(12, 11, 13, 0.28);
          color: #1c1b1f;
        }
        .home-pill.active {
          background: #0c0b0d;
          border-color: #0c0b0d;
          color: #faf9f7;
          box-shadow: none;
        }
        /* —— Incentives —— */
        .home-incentives {
          background: #fff;
          border-radius: 1rem;
          padding: 1.35rem 1.35rem;
          display: flex;
          align-items: center;
          gap: 1.15rem;
          border: 1px solid rgba(12, 11, 13, 0.06);
          box-shadow: none;
          transition: border-color 0.35s ease, background 0.35s ease;
        }
        @media (min-width: 576px) {
          .home-incentives { padding: 1.6rem 1.5rem; }
        }
        .home-incentives:hover {
          border-color: rgba(12, 11, 13, 0.12);
          background: #fafaf9;
        }
        .home-incentive-icon {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 0;
          background: #1c1b1f;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: none;
        }
        .home-incentive-icon svg { color: #faf9f7; }
        .home-incentive-title { font-weight: 500; font-size: 0.875rem; letter-spacing: 0.02em; color: #1c1b1f; margin-bottom: 0.25rem; }
        .home-incentive-desc { font-size: 0.8125rem; color: #57534e; margin: 0; line-height: 1.5; font-weight: 400; }
        /* —— Testimonial —— */
        .home-testimonial {
          background: #fff;
          border-radius: 1rem;
          padding: 2rem 1.75rem;
          border: 1px solid rgba(12, 11, 13, 0.06);
          max-width: 36rem;
          margin: 0 auto;
          box-shadow: none;
          position: relative;
        }
        @media (min-width: 576px) {
          .home-testimonial { padding: 2.75rem 3rem; }
        }
        .home-testimonial::before {
          content: '"';
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          font-size: 2.5rem;
          font-weight: 500;
          font-family: Georgia, 'Times New Roman', serif;
          color: #d6d3d1;
          opacity: 1;
          line-height: 1;
        }
        @media (min-width: 576px) {
          .home-testimonial::before { left: 2rem; }
        }
        .home-testimonial-quote {
          font-size: clamp(1.0625rem, 2vw, 1.1875rem);
          line-height: 1.75;
          color: #44403c;
          font-style: normal;
          font-weight: 400;
          margin-bottom: 1.25rem;
          padding-left: 0;
          letter-spacing: 0.01em;
        }
        .home-testimonial-author { font-weight: 500; color: #78716c; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; }
        /* —— Newsletter CTA —— */
        .home-newsletter {
          background: #0c0b0d;
          border-radius: 1rem;
          padding: clamp(2.5rem, 6vw, 3.5rem) 1.75rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: none;
          border: 1px solid rgba(250,249,247,0.08);
        }
        .home-newsletter::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 40%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(196,165,116,0.5), transparent);
          pointer-events: none;
        }
        .home-newsletter-title {
          font-size: clamp(1.25rem, 2.8vw, 1.625rem);
          font-weight: 500;
          letter-spacing: -0.02em;
          color: #faf9f7;
          margin-bottom: 0.65rem;
          position: relative;
        }
        .home-newsletter-desc {
          font-size: clamp(0.875rem, 1.85vw, 0.9375rem);
          color: rgba(250,249,247,0.55);
          font-weight: 400;
          margin-bottom: 1.85rem;
          position: relative;
          line-height: 1.65;
        }
        .home-newsletter .home-hero-cta {
          position: relative;
          background: transparent !important;
          color: #faf9f7 !important;
          border: 1px solid rgba(250,249,247,0.35) !important;
        }
        .home-newsletter .home-hero-cta:hover {
          background: #faf9f7 !important;
          color: #0c0b0d !important;
        }
        /* —— Fashion × Tech pillars —— */
        .home-pillars-section {
          background: #faf9f7;
          border-bottom: 1px solid rgba(12, 11, 13, 0.06);
        }
        .home-pillar {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          min-height: 220px;
          padding: 2rem 1.75rem;
          border-radius: 1rem;
          overflow: hidden;
          text-decoration: none;
          color: #faf9f7 !important;
          box-shadow: 0 0 0 1px rgba(12, 11, 13, 0.06);
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s ease;
        }
        @media (min-width: 768px) {
          .home-pillar { min-height: 300px; padding: 2.25rem 2rem; }
        }
        .home-pillar:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 0 1px rgba(12, 11, 13, 0.1), 0 24px 48px rgba(12, 11, 13, 0.12);
          color: #faf9f7 !important;
        }
        .home-pillar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(165deg, rgba(12, 11, 13, 0.2) 0%, rgba(12, 11, 13, 0.55) 50%, rgba(12, 11, 13, 0.92) 100%);
          z-index: 0;
        }
        .home-pillar--fashion::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, #4c0519 0%, #881337 42%, #9f1239 100%);
          z-index: 0;
        }
        .home-pillar--tech::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, #0c2d33 0%, #134e4a 45%, #115e59 100%);
          z-index: 0;
        }
        .home-pillar-inner {
          position: relative;
          z-index: 1;
        }
        .home-pillar-label {
          font-size: 0.5625rem;
          font-weight: 500;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          opacity: 0.75;
          margin-bottom: 0.65rem;
        }
        .home-pillar-title {
          font-size: clamp(1.625rem, 3.8vw, 2.125rem);
          font-weight: 500;
          letter-spacing: -0.03em;
          line-height: 1.12;
          margin-bottom: 0.65rem;
        }
        .home-pillar-desc {
          font-size: 0.875rem;
          line-height: 1.65;
          opacity: 0.72;
          font-weight: 400;
          margin-bottom: 0;
          max-width: 34ch;
        }
        .home-pillar-arrow {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          margin-top: 1.35rem;
          font-size: 0.625rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
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
            <span className="home-hero-badge">Fashion × Tech</span>
            <h1 className="home-hero-title">Where craft meets circuitry.</h1>
            <p className="home-hero-desc">
              Curated apparel and precision tech in one refined store. {freeShippingText}.
            </p>
            <a href="/shop" className="home-hero-cta">
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
                Authentic &amp; secure
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

      <section className="home-pillars-section" aria-label="Shop fashion and technology">
        <div className="container py-4 py-lg-5">
          <div className="row g-3 g-md-4">
            <div className="col-12 col-md-6">
              <a href="/shop" className="home-pillar home-pillar--fashion w-100">
                <div className="home-pillar-inner">
                  <span className="home-pillar-label">Wardrobe</span>
                  <h2 className="home-pillar-title">Fashion</h2>
                  <p className="home-pillar-desc mb-0">
                    Silhouettes, fabrics, and details chosen for longevity — not landfill.
                  </p>
                  <span className="home-pillar-arrow">
                    Shop fashion
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </div>
              </a>
            </div>
            <div className="col-12 col-md-6">
              <a href="/shop" className="home-pillar home-pillar--tech w-100">
                <div className="home-pillar-inner">
                  <span className="home-pillar-label">Workspace &amp; life</span>
                  <h2 className="home-pillar-title">Tech &amp; gear</h2>
                  <p className="home-pillar-desc mb-0">
                    Tools and devices that feel as good as they perform — minimal, capable, modern.
                  </p>
                  <span className="home-pillar-arrow">
                    Shop tech
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

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
              <p className="home-section-subtitle text-center">From staples to statement pieces — browse by collection</p>
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
              <a href="/shop" className="home-section-cta">View all categories →</a>
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
              <p className="home-section-subtitle text-center">Fresh drops across fashion and tech</p>
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
              &ldquo;Finally a store that gets both sides — the jacket I wanted and the kit I needed for work. Packaging was beautiful and it arrived fast.&rdquo;
            </p>
            <p className="home-testimonial-author mb-0">Maya R. — Customer, London</p>
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
            <h3 className="home-newsletter-title">First to know</h3>
            <p className="home-newsletter-desc">Limited drops in fashion and tech — stay ahead via our newsletter or say hello.</p>
            <a href="/contact" className="home-hero-cta">
              Contact us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
