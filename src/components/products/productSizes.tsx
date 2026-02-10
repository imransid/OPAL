import { useId } from 'react';

interface Props {
  sizes: Map<string, number>;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
}

export default function ProductSizes({
  sizes,
  selectedSize,
  onSelectSize,
}: Props) {
  const sizeID = useId();
  const entries = Array.from(sizes.entries());
  const isSelectable = typeof onSelectSize === 'function';

  return (
    <>
      <div className="mt-2 d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Size</h6>
      </div>
      <div className="d-flex flex-wrap text-center my-3">
        {entries.map(([size, amount], i) => {
          const selected = selectedSize != null && selectedSize.trim() === size.trim();
          const outOfStock = amount === 0;
          const disabled = outOfStock && !isSelectable;
          return (
            <div key={size} className="mb-3 me-3">
              <div className="form-check">
                <input
                  className="form-check-input rounded-2"
                  type="radio"
                  name={`size-${sizeID}`}
                  id={`input-${sizeID}-${i}`}
                  checked={isSelectable ? selected : undefined}
                  disabled={disabled}
                  onChange={isSelectable ? () => onSelectSize?.(size) : undefined}
                />
                <label className="cursor-pointer" htmlFor={`input-${sizeID}-${i}`}>{size}</label>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
