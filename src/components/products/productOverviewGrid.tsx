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
  delivery,
  stock = true,
}: Props) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);

  const desc = shortDescription ?? full_description ?? description ?? '';
  const hasDescription = desc || longDescription || highlights.length > 0 || details;
  const displayPrice = discountPrice != null && discountPrice < price ? discountPrice : price;
  const showStrike = discountPrice != null && discountPrice < price;

  const hasColors = colors.length > 0;
  const hasSizes = sizes.size > 0;
  const colorOk = !hasColors || (selectedColor != null && selectedColor.trim() !== '');
  const sizeOk = !hasSizes || (selectedSize != null && selectedSize.trim() !== '');
  const canAddToCart = Boolean(stock && productId && colorOk && sizeOk);

  return (
    <div className="card card-product card-plain">
      <div className="row">
        <ProductGallery images={images} thumbSrc={thumbSrc} thumbAlt={thumbAlt} />
        <div className="col-12 col-lg-6 ps-lg-5">
          {brand && <p className="text-body-secondary small mb-1">{brand}{model ? ` · ${model}` : ''}</p>}
          {title && <h2 className="mt-2 mb-3">{title}</h2>}
          {desc && <p className="mb-4">{desc}</p>}

          <form action="" method="post" className="product-form">
            <div className="d-flex align-items-baseline gap-2 mb-3 flex-wrap">
              {showStrike && (
                <span className="text-decoration-line-through text-body-secondary">{currency}{price.toLocaleString()}</span>
              )}
              <h3 className="font-weight-normal mb-0">{currency}{displayPrice.toLocaleString()}</h3>
            </div>
            <p className="mb-3">
              <strong>Availability:</strong>{' '}
              <span className={stock ? 'text-success' : 'text-secondary'}>
                {stock ? 'In stock — Ready to ship' : 'Out of stock — Currently unavailable'}
              </span>
            </p>

            {rating > 0 && (
              <div className="d-flex align-items-center mb-3">
                <ProductRating rating={rating} />
                {reviews > 0 && <span className="ms-2 text-body-secondary small">{reviews} reviews</span>}
              </div>
            )}

            <div className="mb-3">
              <h6 className="mb-2">Colour {hasColors && <span className="text-danger small">*</span>}</h6>
              {hasColors ? (
                <ProductBadge colors={colors} selectedColor={selectedColor} onSelectColor={setSelectedColor} />
              ) : (
                <span className="text-body-secondary small">—</span>
              )}
            </div>

            <div className="mb-3">
              <h6 className="mb-2">Size available {hasSizes && <span className="text-danger small">*</span>}</h6>
              {hasSizes ? (
                <ProductSizes sizes={sizes} selectedSize={selectedSize} onSelectSize={setSelectedSize} />
              ) : (
                <span className="text-body-secondary small">—</span>
              )}
            </div>
            {!colorOk && hasColors && <p className="small text-danger mb-2">Please select a colour.</p>}
            {!sizeOk && hasSizes && <p className="small text-danger mb-2">Please select a size.</p>}
            <button
              className="btn btn-dark btn-lg mt-3"
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

      {hasDescription && (
        <div className="row mt-5">
          <div className="col-12 col-lg-8">
            <h4 className="mb-3">Product Description</h4>
            {desc && <p>{desc}</p>}
            {longDescription?.intro && <p>{longDescription.intro}</p>}
            {longDescription?.usage && <p>{longDescription.usage}</p>}
            {longDescription?.compatibility && longDescription.compatibility.length > 0 && (
              <p><strong>Compatibility:</strong> {longDescription.compatibility.join(', ')}</p>
            )}
            {highlights.length > 0 && (
              <>
                <h6 className="mt-4">Highlights</h6>
                <ul className="text-sm">
                  {highlights.map((h, i) => <li key={i} className="mb-2">{h}</li>)}
                </ul>
              </>
            )}
            {features.length > 0 && (
              <>
                <h6 className="mt-4">Features</h6>
                <ul className="list-unstyled">
                  {features.map((f, i) => {
                    const item = typeof f === 'string' ? { title: f, description: '' } : f;
                    return (
                      <li key={i} className="mb-3">
                        <strong>{item.title}</strong>
                        {item.description && <p className="mb-0 text-body small">{item.description}</p>}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {details && (
              <>
                <h6 className="mt-4">Details</h6>
                <p>{details}</p>
              </>
            )}
            {specifications && Object.keys(specifications).length > 0 && (
              <>
                <h6 className="mt-4">Specifications</h6>
                <dl className="row small">
                  {Object.entries(specifications).map(([k, v]) => (
                    <div key={k} className="col-sm-6 d-flex gap-2 mb-2">
                      <dt className="text-body-secondary" style={{ minWidth: 120 }}>{k.replace(/([A-Z])/g, ' $1').trim()}</dt>
                      <dd className="mb-0">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
            {delivery && (delivery.deliveryTime || (delivery.deliveryAreas && delivery.deliveryAreas.length > 0)) && (
              <>
                <h6 className="mt-4">Delivery</h6>
                {delivery.deliveryTime && <p className="mb-1">Estimated: {delivery.deliveryTime}</p>}
                {delivery.deliveryAreas && delivery.deliveryAreas.length > 0 && (
                  <p className="mb-0 text-body-secondary small">Areas: {delivery.deliveryAreas.join(', ')}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
