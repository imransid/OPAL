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
  position: string;
  productId?: string;
  stock?: boolean;
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
  position,
  productId,
  stock = true,
}: Props) {

  const classList = "card-body " + "text-" + position;
  const productUrl = productId ? `/product/?id=${productId}` : "#";
  const imgSrc = thumb_src ? toImageSrc(thumb_src) : '';

  return (
    <>
      <div className="card card-product border mb-5 shadow-xs border-radius-lg">
        <a href={productUrl}>
          <div className="position-relative overflow-hidden" style={{ height: 280 }}>
            {imgSrc && (
              <img
                className="w-100 h-100 p-4 rounded-top"
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
            <div className={`card-img-placeholder w-100 h-100 position-absolute top-0 start-0 d-flex align-items-center justify-content-center bg-light text-body-secondary rounded-top ${imgSrc ? 'd-none' : ''}`}>
              No image
            </div>
          </div>
          <div className={classList}>
            {(color) && 
              <h6 className="text-md mb-1 text-body">{color}</h6>
            }
            {(title) && 
              <h4 className="font-weight-bold">
                {title}
              </h4>
            }

            {(description) && 
              <p className="text-body">{description}</p>
            }
           
            {(colors) &&
              <ProductBadge colors={colors} />
            }
            
            {(price != null && price > 0) && (
              <h4 className="mb-0 text-lg mt-1">{currency}{price.toLocaleString()}</h4>
            )}
            <p className="mb-0 mt-2 small text-body-secondary">
              <span className={stock !== false ? 'text-success' : 'text-secondary'}>
                {stock !== false ? '● Available' : '○ Out of stock'}
              </span>
            </p>

            {!(description || colors || color) &&
              <a href="#" className="font-weight-normal text-body text-sm">Shop Now</a>
            }
          </div>
        </a>
      </div>
    </>
  );
};
