import { useState, useRef, useCallback, useEffect } from 'react';
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

const ZOOM_LEVEL = 2.2;
const LENS_SIZE = 120;

export default function ProductGallery({ images = [], thumbSrc, thumbAlt }: Props) {
  let list = images.length > 0 ? images : (thumbSrc ? [{ src: thumbSrc, alt: thumbAlt ?? '' }] : []);
  if (thumbSrc && (list.length === 0 || list[0].src !== thumbSrc)) {
    list = [{ src: thumbSrc, alt: thumbAlt ?? '' }, ...list];
  }
  const mainSrc = list[0]?.src ?? thumbSrc ?? '';
  const mainAlt = list[0]?.alt ?? thumbAlt ?? '';

  const [mainIndex, setMainIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lens, setLens] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });
  const [imageTransition, setImageTransition] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displaySrc = list[mainIndex]?.src ?? mainSrc;
  const displayAlt = list[mainIndex]?.alt ?? mainAlt;
  const resolvedSrc = toImageSrc(displaySrc);

  const thumbnails = list.slice(0, 6);
  const hasMultiple = thumbnails.length > 1;

  const setMainIndexWithTransition = useCallback((i: number) => {
    if (i === mainIndex) return;
    setImageTransition(true);
    setMainIndex(i);
    setLens((l) => ({ ...l, show: false }));
    const t = setTimeout(() => setImageTransition(false), 320);
    return () => clearTimeout(t);
  }, [mainIndex]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || !resolvedSrc) return;
      const rect = containerRef.current.getBoundingClientRect();
      const half = LENS_SIZE / 2;
      const x = Math.max(half, Math.min(rect.width - half, e.clientX - rect.left));
      const y = Math.max(half, Math.min(rect.height - half, e.clientY - rect.top));
      const inBounds = rect.width > LENS_SIZE && rect.height > LENS_SIZE;
      setLens({ x, y, show: inBounds });
    },
    [resolvedSrc]
  );

  const handleMouseLeave = useCallback(() => {
    setLens((l) => ({ ...l, show: false }));
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [lightboxOpen]);

  if (!mainSrc) {
    return (
      <div className="col-12 col-lg-6">
        <div className="rounded-3 bg-light d-flex align-items-center justify-content-center text-body-secondary" style={{ aspectRatio: '1' }}>
          No image
        </div>
      </div>
    );
  }

  return (
    <div className="col-12 col-lg-6">
      <div className="d-flex flex-column flex-md-row gap-3">
        {hasMultiple && (
          <div className="d-flex flex-row flex-md-column gap-2 order-2 order-md-1 flex-shrink-0">
            {thumbnails.map((img, i) => {
              const s = toImageSrc(img.src);
              if (!s) return null;
              const active = mainIndex === i;
              return (
                <button
                  key={i}
                  type="button"
                  className={`border p-0 overflow-hidden bg-transparent product-gallery-thumb ${active ? 'border-dark border-2' : 'border-secondary border-opacity-50'}`}
                  style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 12 }}
                  onClick={() => setMainIndexWithTransition(i)}
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
        <div
          className={`flex-grow-1 position-relative overflow-hidden rounded-3 bg-light ${hasMultiple ? 'order-1 order-md-2' : ''}`}
          style={{
            aspectRatio: '1',
            cursor: resolvedSrc ? 'zoom-in' : undefined,
          }}
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => resolvedSrc && setLightboxOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && resolvedSrc) {
              e.preventDefault();
              setLightboxOpen(true);
            }
          }}
          aria-label="View full size image"
        >
          <div
            className="position-relative w-100 h-100 d-flex align-items-center justify-content-center transition-transform duration-300 ease-out"
            style={{
              transform: lens.show ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {resolvedSrc ? (
              <>
                <img
                  src={resolvedSrc}
                  alt={displayAlt}
                  className={`w-100 h-100 transition-opacity duration-300 product-gallery-main-img ${imageTransition ? 'opacity-0' : 'opacity-100'}`}
                  style={{
                    objectFit: 'contain',
                    transform: imageTransition ? 'scale(0.98)' : 'scale(1)',
                  }}
                  loading="eager"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                    if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                  }}
                />
                {lens.show && (
                  <div
                    className="position-absolute border border-2 border-white rounded-circle shadow pointer-events-none"
                    style={{
                      width: LENS_SIZE,
                      height: LENS_SIZE,
                      left: lens.x - LENS_SIZE / 2,
                      top: lens.y - LENS_SIZE / 2,
                      backgroundImage: `url(${resolvedSrc})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: `${(containerRef.current?.offsetWidth ?? 400) * ZOOM_LEVEL}px ${(containerRef.current?.offsetHeight ?? 320) * ZOOM_LEVEL}px`,
                      backgroundPosition: `${-lens.x * ZOOM_LEVEL + LENS_SIZE / 2}px ${-lens.y * ZOOM_LEVEL + LENS_SIZE / 2}px`,
                      zIndex: 10,
                    }}
                  />
                )}
              </>
            ) : null}
          </div>
          {resolvedSrc && (
            <span className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-60 rounded-pill small px-2 py-1">
              Click to zoom
            </span>
          )}
        </div>
      </div>

      {lightboxOpen && resolvedSrc && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom"
        >
          <button
            type="button"
            className="position-absolute top-0 end-0 m-3 btn btn-light btn-sm rounded-circle shadow-sm d-flex align-items-center justify-content-center"
            style={{ zIndex: 1052, width: 44, height: 44 }}
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
          <div
            className="position-relative rounded-3 overflow-hidden shadow"
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={resolvedSrc}
              alt={displayAlt}
              className="img-fluid"
              style={{ maxHeight: '90vh', objectFit: 'contain' }}
              draggable={false}
            />
          </div>
        </div>
      )}

      <style>{`
        .product-gallery-thumb { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .product-gallery-thumb:hover { border-color: rgba(0,0,0,0.4) !important; }
        .product-gallery-main-img { transition: opacity 0.3s ease, transform 0.3s ease; }
      `}</style>
    </div>
  );
}
