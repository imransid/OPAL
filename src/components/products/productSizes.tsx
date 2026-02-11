import { useId } from 'react';

interface Props {
  sizes: Map<string, number>;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
  /** When set, show price next to each size (size-wise pricing) */
  sizePrices?: Record<string, number>;
  currency?: string;
}

export default function ProductSizes({
  sizes,
  selectedSize,
  onSelectSize,
  sizePrices,
  currency = '',
}: Props) {
  const sizeID = useId();
  const entries = Array.from(sizes.entries());
  const isSelectable = typeof onSelectSize === 'function';
  const hasSizePrices = sizePrices && Object.keys(sizePrices).length > 0;

  return (
    <div className="d-flex flex-wrap gap-2">
      {entries.map(([size, amount], i) => {
        const selected = selectedSize != null && selectedSize.trim() === size.trim();
        const outOfStock = amount === 0;
        const disabled = outOfStock && !isSelectable;
        const priceLabel = hasSizePrices && sizePrices[size] != null ? ` — ${currency}${sizePrices[size].toLocaleString()}` : '';
        return (
          <label
            key={size}
            className={`product-size-chip mb-0 ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            htmlFor={`input-${sizeID}-${i}`}
          >
            <input
              type="radio"
              name={`size-${sizeID}`}
              id={`input-${sizeID}-${i}`}
              checked={isSelectable ? selected : undefined}
              disabled={disabled}
              onChange={isSelectable ? () => onSelectSize?.(size) : undefined}
              className="visually-hidden"
            />
            <span>{size}{priceLabel}</span>
          </label>
        );
      })}
      <style>{`
        .product-size-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2.75rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--bs-border-color, #dee2e6);
          border-radius: 9999px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: border-color 0.2s, background-color 0.2s, color 0.2s;
        }
        .product-size-chip:hover:not(.disabled) {
          border-color: rgba(0,0,0,0.5);
          background-color: rgba(0,0,0,0.04);
        }
        .product-size-chip.selected {
          border-color: #212529;
          background-color: #212529;
          color: #fff;
        }
        .product-size-chip.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
