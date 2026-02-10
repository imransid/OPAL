import { toImageSrc } from '../../lib/image-utils';

interface Props {
  thumb_src: string;
  thumb_alt: string;
  title: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  subtotal: number;
  currency?: string;
}

export default function CheckoutSingleItem({
  thumb_src,
  thumb_alt,
  title,
  color,
  size,
  price,
  quantity,
  subtotal,
  currency = '৳',
}: Props) {
  const imgSrc = toImageSrc(thumb_src);

  return (
    <div className="d-flex gap-3 py-3 border-bottom border-white border-opacity-10">
      <div className="flex-shrink-0 rounded-2 overflow-hidden bg-white bg-opacity-10" style={{ width: 56, height: 56 }}>
        {imgSrc ? (
          <img className="w-100 h-100" style={{ objectFit: 'cover' }} src={imgSrc} alt={thumb_alt} />
        ) : (
          <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white text-opacity-50 small">—</div>
        )}
      </div>
      <div className="flex-grow-1 min-w-0">
        <p className="text-white mb-1 small" style={{ lineHeight: 1.4 }}>{title}</p>
        <p className="text-white text-opacity-75 mb-0 small">
          {quantity} × {currency}{price.toLocaleString()} = {currency}{subtotal.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
