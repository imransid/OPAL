import { useState, useEffect } from 'react';
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

  useEffect(() => {
    Promise.all([getProducts(), getCategories(), getStoreSettings()]).then(([p, c, s]) => {
      setProducts(p);
      setCategories(c);
      setSettings(s);
      setLoading(false);
    });
  }, []);

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
      {/* Hero — modern, data-driven */}
      <section
        className="position-relative overflow-hidden rounded-3 mx-3 mx-lg-5 mb-5 mb-lg-6"
        style={{
          background: 'linear-gradient(135deg, #1a1a1f 0%, #2d2d35 50%, #1a1a1f 100%)',
          minHeight: 'min(85vh, 560px)',
        }}
      >
        {/* Background carousel — mobile: full bleed; desktop: right half */}
        <div
          className="position-absolute top-0 end-0 bottom-0 start-0 d-lg-none overflow-hidden rounded-3"
          aria-hidden
        >
          {heroCarouselImages.map((src, i) => (
            <img
              key={`m-${src}`}
              src={src}
              alt=""
              className="position-absolute top-0 start-0 end-0 bottom-0 h-100 w-100"
              style={{
                objectFit: 'cover',
                opacity: heroSlide === i ? 0.32 : 0,
                transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          ))}
        </div>
        <div
          className="position-absolute top-0 end-0 bottom-0 w-50 d-none d-lg-block overflow-hidden rounded-end-3"
          aria-hidden
        >
          {heroCarouselImages.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className="position-absolute top-0 start-0 end-0 bottom-0 h-100 w-100"
              style={{
                objectFit: 'cover',
                opacity: heroSlide === i ? 0.4 : 0,
                transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          ))}
        </div>
        <div className="container position-relative py-10 py-lg-12">
          <div className="row align-items-center">
            <div className="col-lg-6 text-white">
              <p className="text-uppercase small mb-2" style={{ letterSpacing: '0.1em', color: 'rgba(255,255,255,0.85)' }}>Welcome to OPAL</p>
              <h1
                className="display-5 fw-bold mb-3 lh-tight text-white"
                style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                Curated products for every moment
              </h1>
              <p className="lead mb-4 fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {freeShippingText}. Discover quality picks and shop with confidence.
              </p>
              <a
                href="/shop/"
                className="btn btn-light btn-lg rounded-pill px-4 shadow-sm fw-semibold"
              >
                Shop now
              </a>
              {/* Carousel indicators */}
              <div className="d-flex gap-2 mt-4 pt-2" role="tablist" aria-label="Hero slides">
                {heroCarouselImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={heroSlide === i}
                    aria-label={`Slide ${i + 1}`}
                    className="border-0 rounded-pill bg-white bg-opacity-50 p-0 transition-all"
                    style={{
                      width: heroSlide === i ? 24 : 8,
                      height: 8,
                      opacity: heroSlide === i ? 1 : 0.5,
                    }}
                    onClick={() => setHeroSlide(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Incentives — real data from store settings */}
      <section className="py-4 py-lg-5">
        <div className="container">
          <div className="row g-3 g-md-4">
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center gap-3 p-3 p-md-4 rounded-3 bg-light border border-0 shadow-sm h-100">
                <div className="rounded-3 bg-dark text-white d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 48, height: 48 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                </div>
                <div>
                  <h6 className="mb-1 fw-semibold">Fast delivery</h6>
                  <p className="mb-0 small text-body-secondary">{freeShippingText}</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center gap-3 p-3 p-md-4 rounded-3 bg-light border border-0 shadow-sm h-100">
                <div className="rounded-3 bg-dark text-white d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 48, height: 48 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <div>
                  <h6 className="mb-1 fw-semibold">Secure checkout</h6>
                  <p className="mb-0 small text-body-secondary">Safe and encrypted payments</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center gap-3 p-3 p-md-4 rounded-3 bg-light border border-0 shadow-sm h-100">
                <div className="rounded-3 bg-dark text-white d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 48, height: 48 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                <div>
                  <h6 className="mb-1 fw-semibold">Support</h6>
                  <p className="mb-0 small text-body-secondary">We're here to help</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers — collection with product image on the right */}
      <section className="py-5 py-lg-6">
        <div className="container">
          <a href="/shop/" className="text-decoration-none text-body d-block">
            <div className="row align-items-stretch g-0 rounded-4 overflow-hidden bg-white shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.06)', minHeight: '320px' }}>
              <div className="col-lg-5 order-lg-1 order-2 d-flex flex-column justify-content-center p-4 p-lg-5">
                <p className="text-uppercase small mb-2 text-secondary" style={{ letterSpacing: '0.15em', fontWeight: 600 }}>Collection</p>
                <h2 className="h2 fw-bold mb-3 lh-tight">Best Sellers</h2>
                <p className="text-body-secondary mb-4 mb-lg-0 pe-lg-3">
                  Our most loved picks. Discover what everyone is buying and find your next favorite.
                </p>
                <span className="btn btn-dark rounded-pill px-4 mt-2 align-self-start d-inline-flex align-items-center gap-2">
                  Shop Best Sellers
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </span>
              </div>
              <div className="col-lg-7 order-lg-2 order-1 position-relative" style={{ minHeight: '260px' }}>
                <div
                  className="position-absolute top-0 start-0 end-0 bottom-0 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #f1f3f5 0%, #e9ecef 100%)' }}
                >
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

      {/* Shop by category — real categories */}
      {displayCategories.length > 0 && (
        <section className="py-5 py-lg-6">
          <div className="container">
            <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
              <div>
                <h2 className="h3 fw-bold mb-1">Shop by category</h2>
                <p className="text-body-secondary mb-0">Browse our collections</p>
              </div>
              <a href="/shop/" className="btn btn-outline-dark rounded-pill btn-sm">
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

      {/* Featured products — real, in-stock only */}
      {featuredProducts.length > 0 && (
        <section className="py-5 py-lg-6 bg-light">
          <div className="container">
            <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
              <div>
                <h2 className="h3 fw-bold mb-1">Featured products</h2>
                <p className="text-body-secondary mb-0">
                  {inStockProducts.length} products available
                </p>
              </div>
              <a href="/shop/" className="btn btn-outline-dark rounded-pill btn-sm">
                View all
              </a>
            </div>
            <div className="row g-3 g-lg-4">
              {featuredProducts.map((product) => (
                <div key={product.id} className="col-6 col-lg-3">
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

      {/* CTA — real data */}
      <section className="py-6 py-lg-7">
        <div className="container text-center">
          <h2 className="h3 fw-bold mb-2">Ready to shop?</h2>
          <p className="text-body-secondary mb-4 mx-auto" style={{ maxWidth: '32rem' }}>
            {categories.length > 0 && products.length > 0
              ? `Explore ${categories.length} categories and ${inStockProducts.length} products.`
              : 'Explore our collection.'}
          </p>
          <a href="/shop/" className="btn btn-dark btn-lg rounded-pill px-4">
            Start shopping
          </a>
        </div>
      </section>
    </>
  );
}
