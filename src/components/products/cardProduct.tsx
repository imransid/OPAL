import ProductBadge from './productBadge';
import { toImageSrc } from '../../lib/image-utils';

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
  const productUrl = productId ? `/product/?id=${productId}` : '#';
  const imgSrc = thumb_src ? toImageSrc(thumb_src) : '';

  return (
    <div className="card card-product h-100 border-0 rounded-3 overflow-hidden shadow-sm bg-white transition-all duration-200 hover-shadow">
      <a href={productUrl} className="text-decoration-none text-dark d-flex flex-column h-100">
        {/* Fixed aspect ratio image - same height on all cards */}
        <div
          className="position-relative overflow-hidden bg-light"
          style={{ aspectRatio: '1' }}
        >
          {imgSrc && (
            <img
              className="w-100 h-100"
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
            <span className="position-absolute bottom-0 end-0 m-2 rounded-circle bg-dark bg-opacity-75 d-flex align-items-center justify-content-center text-white" style={{ width: 40, height: 40 }} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </span>
          )}
          {star && (
            <span className="position-absolute top-0 start-0 m-2 text-warning" style={{ fontSize: '1.25rem' }} title="Featured" aria-label="Featured">
              ★
            </span>
          )}
        </div>
        <div className={classList} style={{ flex: '1 1 auto' }}>
          {color && <h6 className="text-uppercase small mb-1 text-body-secondary">{color}</h6>}
          {title && (
            <h3 className="h6 fw-semibold mb-1 text-dark lh-sm" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {title}
            </h3>
          )}
          {description && (
            <p className="small text-body-secondary mb-2 lh-sm" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: '0 1 auto' }}>
              {description}
            </p>
          )}
          {colors && colors.length > 0 && <div className="mb-2"><ProductBadge colors={colors} /></div>}
          {(size || (sizes && Object.keys(sizes).length > 0)) && (
            <p className="small text-body-secondary mb-2">
              Size available: {size ?? Object.keys(sizes!).join(', ')}
            </p>
          )}
          <div className="mt-auto pt-2">
            {price != null && price > 0 && (
              <p className="mb-1 fw-semibold fs-6">{currency}{price.toLocaleString()}</p>
            )}
            <p className="mb-0 small text-body-secondary">
              <span className={stock !== false ? 'text-success' : 'text-secondary'}>
                {stock !== false ? '● In stock' : '○ Out of stock'}
              </span>
            </p>
          </div>
        </div>
      </a>
    </div>
  );
}
