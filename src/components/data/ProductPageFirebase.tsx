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
      <div className="container py-5 text-center">
        <span className="spinner-border text-dark" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="container py-5 text-center">
        <h2>Product not found</h2>
        <a href="/shop/" className="btn btn-dark mt-3">Back to shop</a>
      </div>
    );
  }

  const sizesMap = new Map<string, number>(Object.entries(product.sizes ?? {}));

  return (
    <div className="container py-5">
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
        delivery={product.delivery}
        stock={product.stock}
      />

      {others.length > 0 && (
        <div className="row mt-5">
          <h5 className="mb-4">You may also like</h5>
          {others.map((p) => (
            <div key={p.id} className="col-6 col-md-4 col-lg-3">
              <CardProduct
                thumb_src={p.thumb_src}
                thumb_alt={p.thumb_alt ?? p.title}
                color={p.color}
                colors={p.colors}
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
      )}
      <hr className="dark horizontal my-5" />
      <StoreDoubleColumn />
    </div>
  );
}
