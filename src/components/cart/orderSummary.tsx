interface Props {
  subtotal: number;
  shipping: number;
  currency?: string;
  textColor?: string;
}

export default function OrderSummary({
  subtotal,
  shipping,
  currency = '৳',
  textColor = '',
}: Props) {
  const variant = textColor ? ` text-${textColor}` : '';
  const total = subtotal + shipping;
  const labelClass = textColor ? `text-${textColor}` : 'text-body';
  const valueClass = textColor ? `text-${textColor} fw-semibold` : 'fw-semibold';

  return (
    <>
      <ul className="list-unstyled mb-0">
        <li className="py-2 d-flex justify-content-between align-items-center">
          <span className={labelClass}>Subtotal</span>
          <span className={valueClass}>{currency}{subtotal.toLocaleString()}</span>
        </li>
        <li className="py-2 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-25">
          <span className={labelClass}>Shipping</span>
          <span className={valueClass}>{currency}{shipping.toLocaleString()}</span>
        </li>
        <li className="py-3 d-flex justify-content-between align-items-center">
          <span className={`${variant} fw-bold`}>Total</span>
          <span className={`${variant} fw-bold fs-5`}>{currency}{total.toLocaleString()}</span>
        </li>
      </ul>
    </>
  );
}