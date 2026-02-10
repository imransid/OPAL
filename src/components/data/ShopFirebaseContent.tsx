import { useState, useEffect, useMemo } from 'react';

import { getProducts, getCategories } from '../../lib/firestore';
import { toImageSrc } from '../../lib/image-utils';
import CardProduct from '../products/cardProduct';
import type { Product, Category } from '../../lib/types';

function getCategoryFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('category');
}

type SortOption = 'default' | 'new-arrivals' | 'best-sellers' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

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
      setLoading(false);
    });
  }, []);

  const updateUrl = (categoryId: string | null) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (categoryId) {
      url.searchParams.set('category', categoryId);
    } else {
      url.searchParams.delete('category');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const setCategory = (id: string | null) => {
    setSelectedCategoryId(id);
    updateUrl(id);
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
    return parent ? `${parent.title} › ${c.title}` : c.title;
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <span className="spinner-border text-dark" role="status" />
      </div>
    );
  }

  const sidebarContent = (
    <>
      <ul className="list-unstyled mb-0">
        <li className="mb-1">
          <button
            type="button"
            className={`btn btn-link text-start w-100 p-2 rounded-2 text-decoration-none ${!selectedCategoryId ? 'bg-dark text-white' : 'text-dark'}`}
            onClick={() => { setCategory(null); setFiltersOpen(false); }}
          >
            All products
          </button>
        </li>
        {topLevel.map((cat) => {
          const subs = subCategories.filter((s) => s.parentId === cat.id);
          return (
            <li key={cat.id} className="mb-1">
              <button
                type="button"
                className={`btn btn-link text-start w-100 p-2 rounded-2 text-decoration-none ${selectedCategoryId === cat.id ? 'bg-dark text-white' : 'text-dark'}`}
                onClick={() => { setCategory(cat.id); setFiltersOpen(false); }}
              >
                {cat.title}
              </button>
              {subs.length > 0 && (
                <ul className="list-unstyled ms-3 mt-1">
                  {subs.map((sub) => (
                    <li key={sub.id} className="mb-1">
                      <button
                        type="button"
                        className={`btn btn-link text-start w-100 p-2 rounded-2 text-body d-flex align-items-center gap-2 text-decoration-none ${selectedCategoryId === sub.id ? 'bg-light fw-semibold' : ''}`}
                        onClick={() => { setCategory(sub.id); setFiltersOpen(false); }}
                      >
                        {sub.thumb_src ? (
                          <img
                            src={toImageSrc(sub.thumb_src)}
                            alt=""
                            className="rounded flex-shrink-0"
                            width={32}
                            height={32}
                            style={{ objectFit: 'cover' }}
                          />
                        ) : null}
                        <span>{sub.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <div className="container-fluid px-3 px-sm-4 py-4 py-lg-5">
      <div className="row g-4">
        {/* Mobile filter toggle - only on small screens */}
        <div className="col-12 d-lg-none order-1">
          <button
            type="button"
            className="btn btn-outline-dark rounded-pill btn-sm d-flex align-items-center gap-2"
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
          >
            <span className="small">Filters & categories</span>
            <span className="small">{filtersOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* Sidebar - Categories (desktop: sticky sidebar; mobile: collapsible block) */}
        <aside className={`col-12 col-lg-3 order-3 order-lg-1 ${filtersOpen ? 'd-block' : 'd-none d-lg-block'}`}>
          <div className="card border-0 shadow-sm rounded-3 mb-4 mb-lg-0 sticky-lg-top" style={{ top: '1rem' }}>
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center d-lg-none">
              <h6 className="mb-0 fw-semibold">Categories</h6>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-dark text-decoration-none"
                onClick={() => setFiltersOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="card-body pt-0">
              {sidebarContent}
            </div>
          </div>
        </aside>

        {/* Main content - Header + Products */}
        <main className="col-12 col-lg-9 order-2 order-lg-2">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
            <div>
              <h1 className="h4 h5-md fw-bold mb-1">Shop</h1>
              <p className="text-body-secondary small mb-0">
                {selectedCategoryId
                  ? `${filteredProducts.length} products in ${getCategoryLabel(categories.find((c) => c.id === selectedCategoryId) ?? { id: '', title: '', collection: '', thumb_src: '' })}`
                  : `${filteredProducts.length} products`}
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <label htmlFor="shop-sort" className="form-label mb-0 small text-body-secondary d-none d-sm-inline">Sort</label>
              <select
                id="shop-sort"
                className="form-select form-select-sm rounded-pill border"
                style={{ minWidth: '160px', maxWidth: '100%' }}
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                aria-label="Sort products"
              >
                <option value="default">Default</option>
                <option value="new-arrivals">New Arrivals</option>
                <option value="best-sellers">Best Sellers</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A–Z</option>
                <option value="name-desc">Name: Z–A</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-5 rounded-3 bg-light">
              <p className="text-body-secondary mb-3">No products found.</p>
              <button
                type="button"
                className="btn btn-dark rounded-pill"
                onClick={() => setCategory(null)}
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
                    color={product.color}
                    colors={product.colors}
                    title={product.title}
                    description={product.shortDescription ?? product.description}
                    price={product.discountPrice ?? product.price}
                    currency={product.currency}
                    position="left"
                    productId={product.id}
                    stock={product.stock}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Bottom categories */}
          {(topLevel.length > 0 || subCategories.some((s) => s.thumb_src)) && (
            <section className="mt-5 pt-5 border-top">
              <h6 className="fw-semibold mb-3">Browse by category</h6>
              <div className="row g-2 g-sm-3">
                {subCategories.filter((s) => s.thumb_src).slice(0, 6).map((sub) => (
                  <div key={sub.id} className="col-6 col-md-4">
                    <button
                      type="button"
                      className="w-100 border-0 rounded-3 overflow-hidden shadow-sm bg-transparent p-0 text-start"
                      onClick={() => setCategory(sub.id)}
                    >
                      <div className="position-relative rounded-3 overflow-hidden" style={{ aspectRatio: '1.2' }}>
                        <img
                          src={toImageSrc(sub.thumb_src)}
                          alt=""
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                        />
                        <div className="position-absolute bottom-0 start-0 end-0 p-2 text-white small fw-semibold" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                          {sub.title}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
                {topLevel.slice(0, 6).map((cat) => (
                  <div key={cat.id} className="col-6 col-md-4">
                    <button
                      type="button"
                      className="btn btn-outline-dark rounded-pill w-100 text-start small"
                      onClick={() => setCategory(cat.id)}
                    >
                      {cat.title}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
