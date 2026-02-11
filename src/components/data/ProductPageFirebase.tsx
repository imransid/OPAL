import { useState, useEffect } from 'react';
import { getProduct, getProducts } from '../../lib/firestore';
import type { Product } from '../../lib/types';
import CardProduct from '../products/cardProduct';
import ProductOverviewGrid from '../products/productOverviewGrid';
import StoreDoubleColumn from '../store/storeDoubleColumn';

interface Props {
  productId: string;
}

export default function ProductPageFirebase({ productId }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [others, setOthers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    setLoading(true);
    getProduct(productId)
      .then((p) => {
        if (!p) {
          setNotFound(true);
          setProduct(null);
        } else {
          setProduct(p);
          return getProducts().then((all) =>
            all.filter((x) => x.id !== p.id && (!p.categoryId || x.categoryId === p.categoryId)).slice(0, 4)
          );
        }
      })
      .then((list) => { if (list) setOthers(list); })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="container py-4 py-md-5">
        <div className="row align-items-start g-4 g-lg-5">
          <div className="col-12 col-lg-6">
            <div className="rounded-3 bg-light overflow-hidden" style={{ aspectRatio: '1' }} />
          </div>
          <div className="col-12 col-lg-6">
            <div className="bg-light rounded w-25 mb-3" style={{ height: 12 }} />
            <div className="bg-light rounded w-75 mb-4" style={{ height: 28 }} />
            <div className="bg-light rounded w-50 mb-4" style={{ height: 18 }} />
            <div className="bg-light rounded w-25 mb-4" style={{ height: 32 }} />
            <div className="d-flex gap-2 mb-4">
              <div className="bg-light rounded-pill" style={{ width: 48, height: 48 }} />
              <div className="bg-light rounded-pill" style={{ width: 48, height: 48 }} />
              <div className="bg-light rounded-pill" style={{ width: 48, height: 48 }} />
            </div>
            <div className="bg-dark rounded-3" style={{ height: 52, maxWidth: 280 }} />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 text-center py-5">
            <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80 }}>
              <span className="fs-2 text-body-secondary">?</span>
            </div>
            <h2 className="h4 mb-2">Product not found</h2>
            <p className="text-body-secondary mb-4">This item may have been removed or the link is incorrect.</p>
            <a href="/shop/" className="btn btn-dark btn-lg rounded-3 px-4">Back to shop</a>
          </div>
        </div>
      </div>
    );
  }

  const sizesMap = new Map<string, number>(Object.entries(product.sizes ?? {}));

  return (
    <div className="container py-4 py-md-5 px-3 px-md-4">
      <a href="/shop/" className="d-inline-flex align-items-center gap-1 text-body-secondary small text-decoration-none mb-3 mb-md-4">
        <span aria-hidden="true">←</span> Back to shop
      </a>
      <ProductOverviewGrid
        productId={product.id}
        title={product.title}
        brand={product.brand}
        model={product.model}
        colors={product.colors ?? []}
        images={product.images}
        thumbSrc={product.thumb_src}
        thumbAlt={product.thumb_alt ?? product.title}
        shortDescription={product.shortDescription}
        full_description={product.full_description}
        description={product.description}
        longDescription={product.longDescription}
        price={product.price}
        discountPrice={product.discountPrice}
        currency={product.currency}
        highlights={product.highlights ?? []}
        features={product.features}
        details={product.details}
        specifications={product.specifications}
        rating={product.rating}
        reviews={product.reviews}
        sizes={sizesMap}
        sizePrices={product.sizePrices}
        delivery={product.delivery}
        stock={product.stock}
      />

      {others.length > 0 && (
        <section className="mt-5 pt-5 border-top">
          <h2 className="h5 mb-4 fw-semibold">You may also like</h2>
          <div className="row g-3 g-md-4">
            {others.map((p) => (
              <div key={p.id} className="col-6 col-md-4 col-lg-3">
                <CardProduct
                thumb_src={p.thumb_src}
                thumb_alt={p.thumb_alt ?? p.title}
                color={p.color}
                colors={p.colors}
                size={p.size}
                sizes={p.sizes}
                title={p.title}
                description={p.shortDescription ?? p.description}
                price={p.discountPrice ?? p.price}
                currency={p.currency}
                position="left"
                productId={p.id}
                stock={p.stock}
              />
              </div>
            ))}
          </div>
        </section>
      )}
      <hr className="dark horizontal my-5" />
      <StoreDoubleColumn />
    </div>
  );
}
