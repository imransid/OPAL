'use client';

import { useState, useEffect, useMemo } from 'react';

import { getProducts, getCategories } from '../../lib/firestore';
import { toImageSrc } from '../../lib/image-utils';
import CardProduct from '../products/cardProduct';
import type { Product, Category } from '../../lib/types';

const SORT_OPTIONS = ['default', 'new-arrivals', 'best-sellers', 'price-asc', 'price-desc', 'name-asc', 'name-desc'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const SORT_LABELS: Record<SortOption, string> = {
  default: 'Curated order',
  'new-arrivals': 'New arrivals',
  'best-sellers': 'Best sellers',
  'price-asc': 'Price · Low to high',
  'price-desc': 'Price · High to low',
  'name-asc': 'Name · A–Z',
  'name-desc': 'Name · Z–A',
};

function getCategoryFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('category');
}

function getSortFromUrl(): SortOption | null {
  if (typeof window === 'undefined') return null;
  const s = new URLSearchParams(window.location.search).get('sort');
  return s && SORT_OPTIONS.includes(s as SortOption) ? (s as SortOption) : null;
}

function ShopSkeleton() {
  return (
    <div className="shop-page-surface">
      <div className="container-fluid px-3 px-sm-4 pt-4 pt-lg-5 pb-0">
        <div className="shop-hero shop-hero--skeleton mb-4 mb-lg-4" aria-hidden />
      </div>
      <div className="container-fluid px-3 px-sm-4 pb-4 pb-lg-5">
        <div className="row g-4">
          <div className="col-12 col-lg-3 d-none d-lg-block">
            <div className="shop-sidebar-card p-3 p-lg-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="shop-skel-line mb-2" style={{ width: `${68 + (i % 3) * 12}%` }} />
              ))}
            </div>
          </div>
          <div className="col-12 col-lg-9">
            <div className="shop-toolbar-skel mb-4">
              <div className="shop-skel-line" style={{ width: '140px', height: '20px' }} />
              <div className="shop-skel-pill" style={{ width: '180px', height: '40px' }} />
            </div>
            <div className="row g-3 g-sm-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="col-6 col-md-4 col-xl-3">
                  <div className="shop-skel-card">
                    <div className="shop-skel-card-img" />
                    <div className="p-3">
                      <div className="shop-skel-line mb-2" style={{ width: '85%' }} />
                      <div className="shop-skel-line mb-2" style={{ width: '55%' }} />
                      <div className="shop-skel-line" style={{ width: '40%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .shop-hero--skeleton {
          min-height: clamp(7.5rem, 22vw, 10.5rem);
          background: linear-gradient(110deg, rgba(250,249,247,0.06) 0%, rgba(196,165,116,0.08) 45%, rgba(250,249,247,0.04) 100%);
          animation: shop-shimmer 1.35s ease-in-out infinite;
          background-size: 200% 100%;
        }
        @keyframes shop-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .shop-skel-line, .shop-skel-pill, .shop-skel-card-img {
          border-radius: 0.5rem;
          background: linear-gradient(90deg, rgba(12,11,13,0.06) 0%, rgba(12,11,13,0.1) 50%, rgba(12,11,13,0.06) 100%);
          background-size: 200% 100%;
          animation: shop-shimmer 1.35s ease-in-out infinite;
        }
        .shop-skel-pill { border-radius: 999px; }
        .shop-toolbar-skel { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .shop-skel-card {
          border-radius: var(--opal-radius-lg, 1rem);
          overflow: hidden;
          box-shadow: var(--opal-shadow-card, 0 0 0 1px rgba(12,11,13,0.08));
          background: #fff;
        }
        .shop-skel-card-img { aspect-ratio: 1; border-radius: 0; }
      `}</style>
    </div>
  );
}

export default function ShopFirebaseContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('default');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    Promise.all([getProducts(), getCategories()]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
      const fromUrl = getCategoryFromUrl();
      if (fromUrl && c.some((cat) => cat.id === fromUrl)) {
        setSelectedCategoryId(fromUrl);
      }
      const sortFromUrl = getSortFromUrl();
      if (sortFromUrl) setSort(sortFromUrl);
      setLoading(false);
    });
  }, []);

  const updateUrl = (updates: { categoryId?: string | null; sort?: SortOption }) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (updates.categoryId !== undefined) {
      if (updates.categoryId) url.searchParams.set('category', updates.categoryId);
      else url.searchParams.delete('category');
    }
    if (updates.sort !== undefined) {
      if (updates.sort && updates.sort !== 'default') url.searchParams.set('sort', updates.sort);
      else url.searchParams.delete('sort');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const setCategory = (id: string | null) => {
    setSelectedCategoryId(id);
    updateUrl({ categoryId: id });
  };

  const setSortAndUrl = (value: SortOption) => {
    setSort(value);
    updateUrl({ sort: value });
  };

  const topLevel = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const subCategories = useMemo(() => categories.filter((c) => c.parentId), [categories]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategoryId) {
      list = products.filter((p) => p.categoryId === selectedCategoryId);
    }
    switch (sort) {
      case 'new-arrivals':
        return [...list].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      case 'best-sellers':
        return [...list].sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0));
      case 'price-asc':
        return [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      case 'price-desc':
        return [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      case 'name-asc':
        return [...list].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
      case 'name-desc':
        return [...list].sort((a, b) => (b.title ?? '').localeCompare(a.title ?? ''));
      default:
        return list;
    }
  }, [products, selectedCategoryId, sort]);

  const getCategoryLabel = (c: Category) => {
    if (!c.parentId) return c.title;
    const parent = categories.find((p) => p.id === c.parentId);
    return parent ? `${parent.title} · ${c.title}` : c.title;
  };

  const selectedCategory = useMemo(
    () => (selectedCategoryId ? categories.find((c) => c.id === selectedCategoryId) : null),
    [categories, selectedCategoryId],
  );

  if (loading) {
    return <ShopSkeleton />;
  }

  const sidebarContent = (
    <nav className="shop-cat-nav" aria-label="Product categories">
      <p className="shop-sidebar-label d-none d-lg-block">Categories</p>
      <ul className="list-unstyled mb-0 shop-cat-list">
        <li className="mb-1">
          <button
            type="button"
            className={`shop-cat-pill w-100 ${!selectedCategoryId ? 'shop-cat-pill--active' : ''}`}
            onClick={() => { setCategory(null); setFiltersOpen(false); }}
          >
            <span className="shop-cat-pill__text">All pieces</span>
            <span className="shop-cat-pill__meta">{products.length}</span>
          </button>
        </li>
        {topLevel.map((cat) => {
          const subs = subCategories.filter((s) => s.parentId === cat.id);
          const countInCat = products.filter((p) => p.categoryId === cat.id).length;
          return (
            <li key={cat.id} className="mb-1">
              <button
                type="button"
                className={`shop-cat-pill w-100 ${selectedCategoryId === cat.id ? 'shop-cat-pill--active' : ''}`}
                onClick={() => { setCategory(cat.id); setFiltersOpen(false); }}
              >
                <span className="shop-cat-pill__text">{cat.title}</span>
                {countInCat > 0 && <span className="shop-cat-pill__meta">{countInCat}</span>}
              </button>
              {subs.length > 0 && (
                <ul className="list-unstyled shop-cat-sub ms-1 mt-2 ps-3 border-start">
                  {subs.map((sub) => {
                    const subCount = products.filter((p) => p.categoryId === sub.id).length;
                    return (
                      <li key={sub.id} className="mb-1">
                        <button
                          type="button"
                          className={`shop-cat-pill shop-cat-pill--sub w-100 text-start ${selectedCategoryId === sub.id ? 'shop-cat-pill--active-sub' : ''}`}
                          onClick={() => { setCategory(sub.id); setFiltersOpen(false); }}
                        >
                          {sub.thumb_src ? (
                            <img
                              src={toImageSrc(sub.thumb_src)}
                              alt=""
                              className="shop-cat-thumb flex-shrink-0 rounded-2"
                              width={36}
                              height={36}
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <span className="shop-cat-dot flex-shrink-0" aria-hidden />
                          )}
                          <span className="shop-cat-pill__text flex-grow-1">{sub.title}</span>
                          {subCount > 0 && <span className="shop-cat-pill__meta">{subCount}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      <style>{`
        .shop-page-surface {
          background: linear-gradient(180deg, var(--opal-surface-warm, #faf9f7) 0%, var(--opal-surface, #f5f3f0) 48%, var(--opal-surface-warm, #faf9f7) 100%);
          min-height: 50vh;
        }
        .shop-hero {
          position: relative;
          border-radius: clamp(1rem, 2vw, 1.375rem);
          padding: clamp(2rem, 5vw, 3.25rem) clamp(1.5rem, 3.5vw, 3rem);
          overflow: hidden;
          border: 1px solid rgba(250,249,247,0.08);
          background:
            radial-gradient(ellipse 80% 120% at 100% -20%, rgba(196,165,116,0.22), transparent 55%),
            radial-gradient(ellipse 60% 80% at -10% 100%, rgba(14,116,144,0.12), transparent 45%),
            #0c0b0d;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.04) inset,
            0 24px 48px -24px rgba(12,11,13,0.45);
        }
        .shop-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, rgba(196,165,116,0.9), rgba(196,165,116,0.15) 35%, transparent 70%);
          pointer-events: none;
        }
        .shop-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.35;
          pointer-events: none;
          mix-blend-mode: overlay;
        }
        .shop-hero-inner { position: relative; z-index: 1; }
        .shop-hero-eyebrow {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(196,165,116,0.95);
          margin-bottom: 0.85rem;
        }
        .shop-hero h1 {
          font-family: var(--font-syne), 'Syne', system-ui, sans-serif;
          font-size: clamp(1.75rem, 4.2vw, 2.65rem);
          font-weight: 600;
          letter-spacing: -0.045em;
          line-height: 1.08;
          color: #faf9f7;
          margin: 0 0 1rem;
          max-width: 14ch;
        }
        .shop-hero-lead {
          color: rgba(250,249,247,0.58);
          font-size: clamp(0.9375rem, 1.9vw, 1.0625rem);
          font-weight: 400;
          max-width: 38ch;
          margin: 0;
          line-height: 1.7;
        }
        .shop-hero-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1.25rem;
          margin-top: 1.75rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(250,249,247,0.08);
        }
        .shop-hero-stat {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .shop-hero-stat__val {
          font-family: var(--font-syne), 'Syne', system-ui, sans-serif;
          font-size: 1.35rem;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #faf9f7;
          font-variant-numeric: tabular-nums;
        }
        .shop-hero-stat__lbl {
          font-size: 0.6875rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(250,249,247,0.45);
        }
        .shop-breadcrumb-row {
          margin-top: 1.25rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }
        .shop-breadcrumb-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.85rem;
          border-radius: 999px;
          background: rgba(250,249,247,0.08);
          border: 1px solid rgba(250,249,247,0.12);
          color: rgba(250,249,247,0.88);
          font-size: 0.8125rem;
        }
        .shop-breadcrumb-chip button {
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          color: rgba(196,165,116,0.95);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .shop-breadcrumb-chip button:hover { color: #faf9f7; }
        .shop-sidebar-card {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: var(--opal-radius-lg, 1rem);
          border: 1px solid var(--opal-line, rgba(12,11,13,0.08));
          box-shadow: 0 4px 24px -8px rgba(12,11,13,0.08);
        }
        @supports not (backdrop-filter: blur(12px)) {
          .shop-sidebar-card { background: #fff; }
        }
        .shop-sidebar-label {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--opal-ink-muted, rgba(12,11,13,0.55));
          margin-bottom: 1rem;
        }
        .shop-cat-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: none;
          border-radius: 0.75rem;
          padding: 0.65rem 0.85rem;
          background: transparent;
          color: var(--opal-ink-soft, #1c1b1f);
          font-size: 0.9375rem;
          font-weight: 500;
          text-align: left;
          transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }
        .shop-cat-pill:hover {
          background: rgba(12,11,13,0.04);
        }
        .shop-cat-pill--active {
          background: var(--opal-ink, #0c0b0d);
          color: #faf9f7;
          box-shadow: 0 4px 14px -4px rgba(12,11,13,0.35);
        }
        .shop-cat-pill--active .shop-cat-pill__meta {
          background: rgba(250,249,247,0.15);
          color: rgba(250,249,247,0.9);
        }
        .shop-cat-pill--sub {
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.5rem 0.65rem;
        }
        .shop-cat-pill--active-sub {
          background: rgba(196,165,116,0.12);
          color: var(--opal-ink, #0c0b0d);
          box-shadow: inset 0 0 0 1px rgba(196,165,116,0.35);
        }
        .shop-cat-pill--active-sub .shop-cat-pill__meta {
          background: rgba(12,11,13,0.06);
          color: var(--opal-ink-muted, rgba(12,11,13,0.55));
        }
        .shop-cat-pill__meta {
          margin-left: auto;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          background: rgba(12,11,13,0.06);
          color: var(--opal-ink-muted, rgba(12,11,13,0.55));
        }
        .shop-cat-thumb { flex-shrink: 0; }
        .shop-cat-dot {
          width: 36px;
          height: 36px;
          border-radius: 0.5rem;
          background: rgba(12,11,13,0.06);
        }
        .shop-cat-sub { border-color: rgba(12,11,13,0.08) !important; }
        .shop-toolbar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        @media (min-width: 576px) {
          .shop-toolbar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .shop-toolbar-title-wrap { min-width: 0; }
        .shop-toolbar-title {
          font-family: var(--font-syne), 'Syne', system-ui, sans-serif;
          font-size: clamp(1.125rem, 2vw, 1.375rem);
          font-weight: 600;
          letter-spacing: -0.03em;
          color: var(--opal-ink, #0c0b0d);
          margin: 0 0 0.35rem;
        }
        .shop-toolbar-sub {
          font-size: 0.875rem;
          color: var(--opal-ink-muted, rgba(12,11,13,0.55));
          margin: 0;
        }
        .shop-sort-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .shop-sort-wrap select {
          appearance: none;
          -webkit-appearance: none;
          padding: 0.55rem 2.5rem 0.55rem 1.1rem;
          border-radius: 999px;
          border: 1px solid var(--opal-line-strong, rgba(12,11,13,0.12));
          background: #fff;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--opal-ink-soft, #1c1b1f);
          min-width: min(220px, 100%);
          cursor: pointer;
          box-shadow: 0 1px 0 rgba(255,255,255,0.8) inset;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .shop-sort-wrap select:hover {
          border-color: rgba(12,11,13,0.2);
        }
        .shop-sort-wrap select:focus {
          outline: none;
          border-color: rgba(196,165,116,0.65);
          box-shadow: 0 0 0 3px rgba(196,165,116,0.2);
        }
        .shop-sort-chevron {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid var(--opal-ink-muted, rgba(12,11,13,0.55));
          pointer-events: none;
        }
        .shop-filter-trigger {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.15rem;
          border-radius: 999px;
          border: 1px solid var(--opal-line-strong, rgba(12,11,13,0.12));
          background: #fff;
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--opal-ink-soft, #1c1b1f);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .shop-filter-trigger:hover {
          border-color: rgba(12,11,13,0.22);
          box-shadow: 0 4px 12px -4px rgba(12,11,13,0.12);
        }
        .shop-filter-icon {
          width: 1.125rem;
          height: 1.125rem;
          opacity: 0.7;
        }
        .shop-empty {
          text-align: center;
          padding: clamp(2.5rem, 6vw, 4rem) 1.5rem;
          border-radius: var(--opal-radius-lg, 1rem);
          background: linear-gradient(165deg, #fff 0%, rgba(250,249,247,0.85) 100%);
          border: 1px dashed var(--opal-line-strong, rgba(12,11,13,0.12));
        }
        .shop-empty h3 {
          font-family: var(--font-syne), 'Syne', system-ui, sans-serif;
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }
        .shop-discover {
          margin-top: clamp(2.5rem, 5vw, 4rem);
          padding-top: clamp(2rem, 4vw, 3rem);
          border-top: 1px solid var(--opal-line, rgba(12,11,13,0.08));
        }
        .shop-discover-head {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .shop-discover-head h2 {
          font-family: var(--font-syne), 'Syne', system-ui, sans-serif;
          font-size: clamp(1.125rem, 2.2vw, 1.5rem);
          font-weight: 600;
          letter-spacing: -0.03em;
          margin: 0;
        }
        .shop-discover-head p {
          margin: 0;
          font-size: 0.875rem;
          color: var(--opal-ink-muted, rgba(12,11,13,0.55));
          max-width: 36ch;
        }
        .shop-discover-card {
          position: relative;
          border: none;
          border-radius: var(--opal-radius-lg, 1rem);
          overflow: hidden;
          padding: 0;
          background: #fff;
          cursor: pointer;
          box-shadow: var(--opal-shadow-card, 0 0 0 1px rgba(12,11,13,0.08));
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .shop-discover-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--opal-shadow-card-hover, 0 12px 28px -8px rgba(12,11,13,0.15));
        }
        .shop-discover-card:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(196,165,116,0.45), var(--opal-shadow-card, 0 0 0 1px rgba(12,11,13,0.08));
        }
        .shop-discover-media {
          aspect-ratio: 4 / 3;
          overflow: hidden;
        }
        .shop-discover-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .shop-discover-card:hover .shop-discover-media img {
          transform: scale(1.04);
        }
        .shop-discover-cap {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 1.25rem 1rem 1rem;
          background: linear-gradient(transparent, rgba(12,11,13,0.82));
          color: #faf9f7;
        }
        .shop-discover-cap span {
          display: block;
          font-size: 0.6875rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          opacity: 0.75;
          margin-bottom: 0.25rem;
        }
        .shop-discover-cap strong {
          font-family: var(--font-syne), 'Syne', system-ui, sans-serif;
          font-size: 1.0625rem;
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        .shop-pill-outline {
          border-radius: 999px;
          border: 1px solid var(--opal-line-strong, rgba(12,11,13,0.12));
          background: #fff;
          padding: 0.75rem 1.1rem;
          font-size: 0.875rem;
          font-weight: 500;
          width: auto;
          flex: 1 1 auto;
          min-width: min(100%, 160px);
          text-align: center;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .shop-pill-outline:hover {
          background: var(--opal-ink, #0c0b0d);
          border-color: var(--opal-ink, #0c0b0d);
          color: #faf9f7;
        }
        .shop-discover-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          margin-top: 0.25rem;
        }
        .shop-sidebar-mobile-hd {
          padding-bottom: 0.5rem;
        }
        @media (prefers-reduced-motion: reduce) {
          .shop-discover-card,
          .shop-discover-card:hover,
          .shop-discover-media img,
          .shop-discover-card:hover .shop-discover-media img {
            transition: none;
            transform: none;
          }
        }
      `}</style>
      <div className="shop-page-surface">
        <div className="container-fluid px-3 px-sm-4 pt-4 pt-lg-5 pb-0">
          <header className="shop-hero mb-4 mb-lg-4">
            <div className="shop-hero-inner">
              <p className="shop-hero-eyebrow">Boutique shop</p>
              <h1>The collection</h1>
              <p className="shop-hero-lead">
                Fashion, tech, and everyday objects — curated in one quiet room. Use categories to narrow the shelf;
                sort by what just landed or what others love.
              </p>
              <div className="shop-hero-stats">
                <div className="shop-hero-stat">
                  <span className="shop-hero-stat__val">{filteredProducts.length}</span>
                  <span className="shop-hero-stat__lbl">
                    {selectedCategoryId ? 'In this view' : 'In catalogue'}
                  </span>
                </div>
                <div className="shop-hero-stat">
                  <span className="shop-hero-stat__val">{categories.length}</span>
                  <span className="shop-hero-stat__lbl">Categories</span>
                </div>
                <div className="shop-hero-stat">
                  <span className="shop-hero-stat__val">{products.length}</span>
                  <span className="shop-hero-stat__lbl">Total pieces</span>
                </div>
              </div>
              {selectedCategoryId && selectedCategory && (
                <div className="shop-breadcrumb-row">
                  <div className="shop-breadcrumb-chip">
                    <span>{getCategoryLabel(selectedCategory)}</span>
                    <button type="button" onClick={() => setCategory(null)}>
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>
        </div>
        <div className="container-fluid px-3 px-sm-4 pb-4 pb-lg-5">
          <div className="row g-4">
            <div className="col-12 d-lg-none order-1">
              <button
                type="button"
                className="shop-filter-trigger"
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
              >
                <svg className="shop-filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
                </svg>
                <span>Categories & filters</span>
                <span className="small ms-1 opacity-75">{filtersOpen ? '· Hide' : '· Show'}</span>
              </button>
            </div>

            <aside className={`col-12 col-lg-3 order-3 order-lg-1 ${filtersOpen ? 'd-block' : 'd-none d-lg-block'}`}>
              <div className="shop-sidebar-card mb-4 mb-lg-0 sticky-lg-top p-3 p-lg-4" style={{ top: '1rem' }}>
                <div className="shop-sidebar-mobile-hd d-flex justify-content-between align-items-center d-lg-none mb-2">
                  <h2 className="h6 mb-0 fw-semibold">Browse</h2>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none"
                    style={{ color: 'var(--opal-champagne, #c4a574)', fontWeight: 600 }}
                    onClick={() => setFiltersOpen(false)}
                  >
                    Done
                  </button>
                </div>
                {sidebarContent}
              </div>
            </aside>

            <main className="col-12 col-lg-9 order-2 order-lg-2">
              <div className="shop-toolbar mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--opal-line, rgba(12,11,13,0.08))' }}>
                <div className="shop-toolbar-title-wrap">
                  <h2 className="shop-toolbar-title">{selectedCategoryId && selectedCategory ? getCategoryLabel(selectedCategory) : 'All pieces'}</h2>
                  <p className="shop-toolbar-sub">
                    {filteredProducts.length === 1 ? 'One piece matches your filters.' : `${filteredProducts.length} pieces · ${SORT_LABELS[sort].toLowerCase()}`}
                  </p>
                </div>
                <div className="shop-sort-wrap">
                  <label htmlFor="shop-sort" className="visually-hidden">Sort products</label>
                  <select
                    id="shop-sort"
                    value={sort}
                    onChange={(e) => setSortAndUrl(e.target.value as SortOption)}
                  >
                    <option value="default">{SORT_LABELS.default}</option>
                    <option value="new-arrivals">{SORT_LABELS['new-arrivals']}</option>
                    <option value="best-sellers">{SORT_LABELS['best-sellers']}</option>
                    <option value="price-asc">{SORT_LABELS['price-asc']}</option>
                    <option value="price-desc">{SORT_LABELS['price-desc']}</option>
                    <option value="name-asc">{SORT_LABELS['name-asc']}</option>
                    <option value="name-desc">{SORT_LABELS['name-desc']}</option>
                  </select>
                  <span className="shop-sort-chevron" aria-hidden />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="shop-empty">
                  <h3>Nothing here yet</h3>
                  <p className="text-body-secondary mb-4" style={{ maxWidth: '32ch', marginLeft: 'auto', marginRight: 'auto' }}>
                    This combination doesn&apos;t match any products. Widen your filters or return to the full catalogue.
                  </p>
                  <button
                    type="button"
                    className="btn btn-dark rounded-pill px-4"
                    onClick={() => { setCategory(null); setSortAndUrl('default'); }}
                  >
                    View all products
                  </button>
                </div>
              ) : (
                <div className="row g-3 g-sm-4">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="col-6 col-sm-6 col-md-4 col-lg-4 col-xl-3 d-flex">
                      <CardProduct
                        thumb_src={product.thumb_src || product.images?.[0]?.src || ''}
                        thumb_alt={product.thumb_alt ?? product.title}
                        videoUrl={product.videoUrl}
                        color={product.color}
                        colors={product.colors}
                        size={product.size}
                        sizes={product.sizes}
                        title={product.title}
                        description={product.shortDescription ?? product.description}
                        price={product.discountPrice ?? product.price}
                        currency={product.currency}
                        position="left"
                        productId={product.id}
                        stock={product.stock}
                        star={product.star}
                      />
                    </div>
                  ))}
                </div>
              )}

              {(topLevel.length > 0 || subCategories.some((s) => s.thumb_src)) && (
                <section className="shop-discover" aria-labelledby="shop-discover-heading">
                  <div className="shop-discover-head">
                    <h2 id="shop-discover-heading">Discover more</h2>
                    <p>Jump into another line — same catalogue, new perspective.</p>
                  </div>
                  {subCategories.filter((s) => s.thumb_src).length > 0 && (
                    <div className="row g-3 g-sm-4">
                      {subCategories.filter((s) => s.thumb_src).slice(0, 6).map((sub) => (
                        <div key={sub.id} className="col-6 col-md-4">
                          <button
                            type="button"
                            className="shop-discover-card w-100 text-start"
                            onClick={() => setCategory(sub.id)}
                          >
                            <div className="shop-discover-media">
                              <img src={toImageSrc(sub.thumb_src)} alt={sub.title} loading="lazy" />
                            </div>
                            <div className="shop-discover-cap">
                              <span>Category</span>
                              <strong>{sub.title}</strong>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {topLevel.length > 0 && (
                    <div className={subCategories.filter((s) => s.thumb_src).length > 0 ? 'mt-4' : ''}>
                      <p className="small fw-semibold text-uppercase mb-2" style={{ letterSpacing: '0.12em', color: 'var(--opal-ink-muted, rgba(12,11,13,0.55))' }}>
                        Main lines
                      </p>
                      <div className="shop-discover-pills">
                        {topLevel.slice(0, 8).map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            className="shop-pill-outline"
                            onClick={() => setCategory(cat.id)}
                          >
                            {cat.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
