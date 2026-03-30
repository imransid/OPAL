import { toImageSrc } from '../../lib/image-utils';

interface Props {
  productId: string;
  thumb_src: string;
  thumb_alt: string;
  title: string;
  color: string;
  size: string;
  price: number;
  currency?: string;
  stock: boolean;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
}

export default function CartItem({
  productId,
  thumb_src,
  thumb_alt,
  title,
  color,
  size,
  price,
  currency = '',
  stock,
  quantity,
  onQuantityChange,
  onRemove,
}: Props) {
  const imgSrc = toImageSrc(thumb_src);
  const subtotal = price * quantity;

  return (
    <div className="d-block d-md-flex align-items-center py-3">
      {imgSrc && (
        <img
          className="rounded-3 me-0 me-md-4"
          src={imgSrc}
          alt={thumb_alt}
          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
        />
      )}
      <div className="flex-grow-1 mt-3 mt-md-0">
        <h6 className="text-lg mb-1">{title}</h6>
        <div className="d-flex gap-2 small text-body-secondary">
          {color && <span>{color}</span>}
          {size && <span>{size}</span>}
        </div>
        <p className="mb-0 mt-2 small">
          <strong>Availability:</strong>{' '}
          <span className={stock ? 'text-success' : 'text-secondary'}>
            {stock ? 'In stock' : 'Out of stock'}
          </span>
        </p>
      </div>
      <div className="mt-3 mt-md-0 d-flex align-items-center gap-2">
        <input
          type="number"
          min={1}
          max={99}
          className="form-control text-center"
          style={{ width: '60px' }}
          value={quantity}
          onChange={(e) => onQuantityChange(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)))}
          aria-label="Quantity"
        />
        <span className="fw-bold" style={{ minWidth: '80px' }}>
          {currency}{subtotal.toLocaleString()}
        </span>
        <button
          type="button"
          className="btn btn-link text-danger p-0"
          onClick={onRemove}
          aria-label="Remove"
        >
          <i className="fas fa-times" />
        </button>
      </div>
    </div>
  );
}
