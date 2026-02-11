import { useState } from 'react';
import ProductRating from '../reviews/reviewRating';
import ProductGallery from './productGallery';
import ProductSizes from './productSizes';
import ProductBadge from './productBadge';
import { addToCart } from '../../lib/cart';
import type { ProductFeature, LongDescription, ProductDelivery } from '../../lib/types';

interface ProductImage {
  src: string;
  alt?: string;
}

interface Props {
  productId?: string;
  title: string;
  brand?: string;
  model?: string;
  colors?: string[];
  images?: ProductImage[];
  thumbSrc?: string;
  thumbAlt?: string;
  shortDescription?: string;
  full_description?: string;
  description?: string;
  longDescription?: LongDescription;
  price: number;
  discountPrice?: number;
  currency?: string;
  highlights?: string[];
  features?: (string | ProductFeature)[];
  details?: string;
  specifications?: Record<string, string | number | boolean>;
  rating?: number;
  reviews?: number;
  sizes?: Map<string, number>;
  /** Price per size; when set, selected size overrides product price */
  sizePrices?: Record<string, number>;
  delivery?: ProductDelivery;
  stock?: boolean;
}

export default function ProductOverview({
  productId,
  title,
  brand,
  model,
  colors = [],
  images = [],
  thumbSrc,
  thumbAlt,
  shortDescription,
  full_description,
  description,
  longDescription,
  price,
  discountPrice,
  currency = '',
  highlights = [],
  features = [],
  details,
  specifications,
  rating = 0,
  reviews = 0,
  sizes = new Map(),
  sizePrices,
  delivery,
  stock = true,
}: Props) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);

  const desc = shortDescription ?? full_description ?? description ?? '';
  const hasDescription = desc || longDescription || highlights.length > 0 || details;
  const hasSizePrices = sizePrices && Object.keys(sizePrices).length > 0;
  const priceForSelectedSize = selectedSize && hasSizePrices && sizePrices[selectedSize] != null ? sizePrices[selectedSize] : null;
  const displayPrice = priceForSelectedSize != null ? priceForSelectedSize : (discountPrice != null && discountPrice < price ? discountPrice : price);
  const showStrike = priceForSelectedSize == null && discountPrice != null && discountPrice < price;
  const fromPrice = hasSizePrices && !selectedSize && Object.keys(sizePrices).length > 0 ? Math.min(...Object.values(sizePrices)) : null;

  const hasColors = colors.length > 0;
  const hasSizes = sizes.size > 0;
  const colorOk = !hasColors || (selectedColor != null && selectedColor.trim() !== '');
  const sizeOk = !hasSizes || (selectedSize != null && selectedSize.trim() !== '');
  const canAddToCart = Boolean(stock && productId && colorOk && sizeOk);

  return (
    <article className="product-overview">
      <div className="row align-items-start g-4 g-lg-5">
        <ProductGallery images={images} thumbSrc={thumbSrc} thumbAlt={thumbAlt} />
        <div className="col-12 col-lg-6">
          <div className="product-details sticky-top pt-lg-2" style={{ top: '1rem' }}>
            {brand && (
              <p className="text-uppercase text-body-secondary small mb-1 opacity-75" style={{ letterSpacing: '0.06em' }}>
                {brand}{model ? ` · ${model}` : ''}
              </p>
            )}
            {title && <h1 className="h3 fs-2 mb-3 fw-semibold">{title}</h1>}
            {desc && <p className="text-body mb-4 lead" style={{ fontSize: '1rem' }}>{desc}</p>}

            <form action="" method="post" className="product-form">
              <div className="d-flex align-items-baseline gap-2 mb-3 flex-wrap">
                {showStrike && (
                  <span className="text-decoration-line-through text-body-secondary">{currency}{price.toLocaleString()}</span>
                )}
                {fromPrice != null && !selectedSize && (
                  <span className="text-body-secondary small me-1">From</span>
                )}
                <span className="fs-3 fw-semibold">{currency}{displayPrice.toLocaleString()}</span>
              </div>

              <div className="mb-4">
                <span className={`badge rounded-pill ${stock ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                  {stock ? 'In stock — Ready to ship' : 'Out of stock'}
                </span>
              </div>

              {rating > 0 && (
                <div className="d-flex align-items-center gap-2 mb-4">
                  <ProductRating rating={rating} />
                  {reviews > 0 && <span className="text-body-secondary small">{reviews} reviews</span>}
                </div>
              )}

              <div className="mb-4">
                <span className="d-block small fw-medium text-body-secondary mb-2">
                  Colour {hasColors && <span className="text-danger">*</span>}
                </span>
                {hasColors ? (
                  <ProductBadge colors={colors} selectedColor={selectedColor} onSelectColor={setSelectedColor} />
                ) : (
                  <span className="text-body-secondary small">—</span>
                )}
              </div>

              <div className="mb-4">
                <span className="d-block small fw-medium text-body-secondary mb-2">
                  Size {hasSizes && <span className="text-danger">*</span>}
                </span>
                {hasSizes ? (
                  <ProductSizes sizes={sizes} selectedSize={selectedSize} onSelectSize={setSelectedSize} sizePrices={sizePrices} currency={currency} />
                ) : (
                  <span className="text-body-secondary small">—</span>
                )}
              </div>

              {(!colorOk && hasColors) || (!sizeOk && hasSizes) ? (
                <p className="small text-danger mb-3">Please select {!colorOk && hasColors ? 'a colour' : ''}{!colorOk && hasColors && !sizeOk && hasSizes ? ' and ' : ''}{!sizeOk && hasSizes ? 'a size' : ''}.</p>
              ) : null}

              <button
                className="btn btn-dark btn-lg w-100 rounded-3 px-4 mt-2"
                type="button"
                disabled={!canAddToCart}
                onClick={() => {
                  if (!productId || !canAddToCart) return;
                  addToCart(productId, 1, { color: selectedColor, size: selectedSize });
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('opal-cart-update'));
                    window.dispatchEvent(new CustomEvent('opal-show-toast', { detail: { message: 'Added to cart', productName: title } }));
                  }
                }}
              >
                Add to cart
              </button>
            </form>
          </div>
        </div>
      </div>

      {hasDescription && (
        <div className="product-description mt-5 pt-5 border-top">
          <div className="row">
            <div className="col-12 col-lg-8">
              <h2 className="h5 fw-semibold mb-4">Product details</h2>
              {desc && <p className="text-body">{desc}</p>}
              {longDescription?.intro && <p className="text-body">{longDescription.intro}</p>}
              {longDescription?.usage && <p className="text-body">{longDescription.usage}</p>}
              {longDescription?.compatibility && longDescription.compatibility.length > 0 && (
                <p className="text-body"><strong>Compatibility:</strong> {longDescription.compatibility.join(', ')}</p>
              )}
              {highlights.length > 0 && (
                <>
                  <h3 className="h6 fw-semibold mt-4 mb-2">Highlights</h3>
                  <ul className="text-body ps-3 mb-0">
                    {highlights.map((h, i) => <li key={i} className="mb-1">{h}</li>)}
                  </ul>
                </>
              )}
              {features.length > 0 && (
                <>
                  <h3 className="h6 fw-semibold mt-4 mb-2">Features</h3>
                  <ul className="list-unstyled text-body">
                    {features.map((f, i) => {
                      const item = typeof f === 'string' ? { title: f, description: '' } : f;
                      return (
                        <li key={i} className="mb-3">
                          <strong>{item.title}</strong>
                          {item.description && <p className="mb-0 small text-body-secondary">{item.description}</p>}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              {details && (
                <>
                  <h3 className="h6 fw-semibold mt-4 mb-2">Details</h3>
                  <p className="text-body">{details}</p>
                </>
              )}
              {specifications && Object.keys(specifications).length > 0 && (
                <>
                  <h3 className="h6 fw-semibold mt-4 mb-2">Specifications</h3>
                  <dl className="row small text-body mb-0">
                    {Object.entries(specifications).map(([k, v]) => (
                      <div key={k} className="col-sm-6 d-flex gap-2 mb-2">
                        <dt className="text-body-secondary flex-shrink-0" style={{ minWidth: 120 }}>{k.replace(/([A-Z])/g, ' $1').trim()}</dt>
                        <dd className="mb-0">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
              {delivery && (delivery.deliveryTime || (delivery.deliveryAreas && delivery.deliveryAreas.length > 0)) && (
                <>
                  <h3 className="h6 fw-semibold mt-4 mb-2">Delivery</h3>
                  {delivery.deliveryTime && <p className="mb-1 text-body">Estimated: {delivery.deliveryTime}</p>}
                  {delivery.deliveryAreas && delivery.deliveryAreas.length > 0 && (
                    <p className="mb-0 text-body-secondary small">Areas: {delivery.deliveryAreas.join(', ')}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
