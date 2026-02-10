import { useState } from 'react';
import { toImageSrc } from '../../lib/image-utils';

interface ProductImage {
  src: string;
  alt?: string;
}

interface Props {
  images: ProductImage[];
  thumbSrc?: string;
  thumbAlt?: string;
}

export default function ProductGallery({ images = [], thumbSrc, thumbAlt }: Props) {
  let list = images.length > 0 ? images : (thumbSrc ? [{ src: thumbSrc, alt: thumbAlt ?? '' }] : []);
  if (thumbSrc && (list.length === 0 || list[0].src !== thumbSrc)) {
    list = [{ src: thumbSrc, alt: thumbAlt ?? '' }, ...list];
  }
  const mainSrc = list[0]?.src ?? thumbSrc ?? '';
  const mainAlt = list[0]?.alt ?? thumbAlt ?? '';

  const [mainIndex, setMainIndex] = useState(0);
  const displaySrc = list[mainIndex]?.src ?? mainSrc;
  const displayAlt = list[mainIndex]?.alt ?? mainAlt;
  const resolvedSrc = toImageSrc(displaySrc);

  const thumbnails = list.slice(0, 6);
  const hasMultiple = thumbnails.length > 1;

  if (!mainSrc) {
    return (
      <div className="col-12 col-lg-6">
        <div className="rounded-2 bg-light d-flex align-items-center justify-content-center text-body-secondary" style={{ minHeight: 280 }}>
          No image
        </div>
      </div>
    );
  }

  return (
    <div className="col-12 col-lg-6">
      <div className="d-flex flex-column flex-md-row gap-3">
        {hasMultiple && (
          <div className="d-flex flex-row flex-md-column gap-2 order-2 order-md-1">
            {thumbnails.map((img, i) => {
              const s = toImageSrc(img.src);
              if (!s) return null;
              return (
                <button
                  key={i}
                  type="button"
                  className={`border rounded-2 p-0 overflow-hidden bg-transparent ${mainIndex === i ? 'border-dark' : 'border-light'}`}
                  style={{ width: 56, height: 56, flexShrink: 0 }}
                  onClick={() => setMainIndex(i)}
                >
                  <img
                    src={s}
                    alt={img.alt ?? ''}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </button>
              );
            })}
          </div>
        )}
        <div className={`flex-grow-1 ${hasMultiple ? 'order-1 order-md-2' : ''}`} style={{ minHeight: 280 }}>
          {resolvedSrc ? (
            <img
              src={resolvedSrc}
              alt={displayAlt}
              className="rounded-2 w-100"
              style={{ objectFit: 'contain', maxHeight: 420, minHeight: 280 }}
              loading="eager"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}

        </div>
      </div>
    </div>
  );
}
