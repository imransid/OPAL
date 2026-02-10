import { useState, useEffect, useMemo } from 'react';

import { getProducts, getCategories } from '../../lib/firestore';
import { toImageSrc } from '../../lib/image-utils';
import CardProduct from '../products/cardProduct';
import type { Product, Category } from '../../lib/types';

function getCategoryFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('category');
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

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

  return (
    <div className="container-fluid px-3 px-md-4 py-4 py-lg-5">
      <div className="row g-4">
        {/* Sidebar - Categories & Sort */}
        <aside className="col-lg-3 order-2 order-lg-1">
          <div className={`card border-0 shadow-sm rounded-3 mb-4 ${filtersOpen ? 'd-block' : 'd-none'} d-lg-block`}>
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-semibold">Categories</h6>
              <button
                type="button"
                className="btn btn-link btn-sm d-lg-none p-0 text-dark"
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
              >
                {filtersOpen ? 'Close' : 'Filters'}
              </button>
            </div>
            <div className="card-body pt-0">
              <ul className="list-unstyled mb-0">
                <li className="mb-1">
                  <button
                    type="button"
                    className={`btn btn-link text-start w-100 p-2 rounded ${!selectedCategoryId ? 'bg-dark text-white' : 'text-dark'}`}
                    onClick={() => setCategory(null)}
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
                        className={`btn btn-link text-start w-100 p-2 rounded ${selectedCategoryId === cat.id ? 'bg-dark text-white' : 'text-dark'}`}
                        onClick={() => setCategory(cat.id)}
                      >
                        {cat.title}
                      </button>
                      {subs.length > 0 && (
                        <ul className="list-unstyled ms-3 mt-1">
                          {subs.map((sub) => (
                            <li key={sub.id} className="mb-1">
                              <button
                                type="button"
                                className={`btn btn-link text-start w-100 p-2 rounded text-body d-flex align-items-center gap-2 ${selectedCategoryId === sub.id ? 'bg-light fw-semibold' : ''}`}
                                onClick={() => setCategory(sub.id)}
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
            </div>
          </div>
        </aside>

        {/* Main content - Header + Products */}
        <main className="col-lg-9 order-1 order-lg-2">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
            <div>
              <h1 className="h4 h5-md mb-1">Shop</h1>
              <p className="text-body-secondary small mb-0">
                {selectedCategoryId
                  ? `${filteredProducts.length} products in ${getCategoryLabel(categories.find((c) => c.id === selectedCategoryId) ?? { id: '', title: '', collection: '', thumb_src: '' })}`
                  : `${filteredProducts.length} products`}
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="shop-sort" className="form-label mb-0 small text-body-secondary">Sort</label>
              <select
                id="shop-sort"
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: '160px' }}
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
              >
                <option value="default">Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A–Z</option>
                <option value="name-desc">Name: Z–A</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-body-secondary">No products found.</p>
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() => setCategory(null)}
              >
                View all products
              </button>
            </div>
          ) : (
            <div className="row g-3 g-md-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="col-6 col-md-4 col-lg-4">
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

          {/* Bottom categories - show nested with images as cards, rest as buttons */}
          {(topLevel.length > 0 || subCategories.some((s) => s.thumb_src)) && (
            <section className="mt-5 pt-5 border-top">
              <h6 className="fw-semibold mb-3">Browse by category</h6>
              <div className="row g-3">
                {subCategories.filter((s) => s.thumb_src).slice(0, 6).map((sub) => (
                  <div key={sub.id} className="col-6 col-md-4">
                    <button
                      type="button"
                      className="w-100 border-0 rounded-3 overflow-hidden shadow-sm bg-transparent p-0 text-start"
                      onClick={() => setCategory(sub.id)}
                    >
                      <div className="position-relative" style={{ height: 100 }}>
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
                      className="btn btn-outline-dark w-100 text-start"
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
