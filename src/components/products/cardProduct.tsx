import ProductBadge from './productBadge';
import { toImageSrc } from '../../lib/image-utils';
import { formatCardPrice } from '../../lib/formatPrice';

interface Props {
  thumb_src: string;
  thumb_alt: string;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  color?: string;
  colors?: string[];
  size?: string;
  sizes?: Record<string, number>;
  position: string;
  productId?: string;
  stock?: boolean;
  /** When set, show a play icon on the card image */
  videoUrl?: string;
  /** When true, show a star badge (featured product) */
  star?: boolean;
}

function formatSizesLine(size?: string, sizes?: Record<string, number>): string | null {
  if (size?.trim()) return size.trim();
  if (!sizes || Object.keys(sizes).length === 0) return null;
  const keys = Object.keys(sizes);
  if (keys.length <= 2) return keys.join(', ');
  return `${keys[0]}, +${keys.length - 1}`;
}

export default function CardProduct({
  thumb_src,
  thumb_alt,
  title,
  description,
  price,
  currency = '',
  color,
  colors,
  size,
  sizes,
  position,
  productId,
  stock = true,
  videoUrl,
  star,
}: Props) {
  const classList = 'card-body d-flex flex-column text-' + position;
  const productUrl = productId ? `/product?id=${productId}` : '#';
  const imgSrc = thumb_src ? toImageSrc(thumb_src) : '';
  const showColorLabel = Boolean(color?.trim() && !(colors && colors.length > 0));
  const sizesLine = formatSizesLine(size, sizes);
  const priceLabel = formatCardPrice(currency, price);

  return (
    <div className="card card-product opal-product-card opal-product-card--grid h-100 border-0 overflow-hidden bg-white">
      <a href={productUrl} className="opal-product-card-link text-decoration-none d-flex flex-column h-100" style={{ color: 'var(--opal-ink-soft)' }}>
        <div
          className="position-relative overflow-hidden opal-product-card-media-wrap"
          style={{ aspectRatio: '1', backgroundColor: '#eceae6' }}
        >
          {imgSrc && (
            <img
              className="w-100 h-100 opal-product-card-media"
              style={{ objectFit: 'cover', display: 'block' }}
              src={imgSrc}
              alt={thumb_alt}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const placeholder = (e.target as HTMLImageElement).parentElement?.querySelector('.card-img-placeholder');
                if (placeholder) (placeholder as HTMLElement).classList.remove('d-none');
              }}
            />
          )}
          <div
            className={`card-img-placeholder w-100 h-100 position-absolute top-0 start-0 d-flex align-items-center justify-content-center text-body-secondary ${imgSrc ? 'd-none' : ''}`}
            style={{ fontSize: '0.875rem' }}
          >
            No image
          </div>
          {videoUrl?.trim() && (
            <span
              className="opal-product-card-play position-absolute d-flex align-items-center justify-content-center text-white rounded-circle"
              aria-hidden
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
          )}
          {star && (
            <span className="opal-product-card-badge position-absolute" title="Featured" aria-label="Featured product">
              Featured
            </span>
          )}
        </div>
        <div className={`${classList} opal-card-body-premium opal-card-body--product`} style={{ flex: '1 1 auto' }}>
          {showColorLabel && <p className="opal-card-meta opal-card-meta--product mb-1 mb-md-2">{color}</p>}
          {title && (
            <h3 className="opal-card-title opal-card-title--product mb-1 mb-md-2">{title}</h3>
          )}
          {description && (
            <p className="opal-card-desc small mb-2 lh-base d-none d-md-block">
              {description}
            </p>
          )}
          {colors && colors.length > 0 && (
            <div className="opal-card-swatches mb-1 mb-md-2">
              <ProductBadge colors={colors} />
            </div>
          )}
          {sizesLine && (
            <p className="opal-card-meta opal-card-sizes mb-2 mb-md-2">
              Sizes <span className="opal-card-sizes-values">{sizesLine}</span>
            </p>
          )}
          <div className="opal-card-buy-row mt-auto pt-2 pt-md-3">
            {price != null && price > 0 && (
              <p className="mb-0 opal-card-price opal-card-price--product">{priceLabel}</p>
            )}
            {stock === false ? (
              <p className="mb-0 opal-card-meta opal-card-stock opal-card-stock--warn">Out of stock</p>
            ) : (
              <p className="mb-0 opal-card-meta opal-card-stock opal-card-stock--ok d-none d-md-block">Available to ship</p>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}
