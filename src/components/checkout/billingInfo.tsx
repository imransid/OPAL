interface Props {
  sameAsShipping?: boolean;
  onSameAsShippingChange?: (v: boolean) => void;
}

export default function BillingInfo({ sameAsShipping = true, onSameAsShippingChange }: Props) {
  return (
    <div className="form-check">
      <input
        className="form-check-input"
        type="checkbox"
        id="same-as-shipping"
        checked={sameAsShipping}
        onChange={(e) => onSameAsShippingChange?.(e.target.checked)}
      />
      <label className="form-check-label" htmlFor="same-as-shipping">
        Same as shipping address
      </label>
    </div>
  );
}
