import { useState, useRef, useCallback, useEffect } from 'react';
import { toImageSrc } from '../../lib/image-utils';

interface ProductImage {
  src: string;
  alt?: string;
}

/** Detect if URL is YouTube or Vimeo for embed */
function getEmbedVideoUrl(url: string): string | null {
  const u = url.trim();
  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  const vimeoMatch = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  return null;
}

/** True if URL is a direct video file */
function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url.trim());
}

interface Props {
  images: ProductImage[];
  thumbSrc?: string;
  thumbAlt?: string;
  /** Optional product video; shown with poster and play overlay */
  videoUrl?: string;
  /** Poster image for video; falls back to thumbSrc */
  videoPoster?: string;
}

const ZOOM_LEVEL = 2.2;
const LENS_SIZE = 120;

type GalleryItem = { type: 'video' } | { type: 'image'; src: string; alt: string };

export default function ProductGallery({ images = [], thumbSrc, thumbAlt, videoUrl, videoPoster }: Props) {
  let imageList = images.length > 0 ? images : (thumbSrc ? [{ src: thumbSrc, alt: thumbAlt ?? '' }] : []);
  if (thumbSrc && (imageList.length === 0 || imageList[0].src !== thumbSrc)) {
    imageList = [{ src: thumbSrc, alt: thumbAlt ?? '' }, ...imageList];
  }

  const hasVideoOnMount = Boolean(videoUrl?.trim());
  const isDirectOnMount = hasVideoOnMount && isDirectVideoUrl(videoUrl!);
  const [mainIndex, setMainIndex] = useState(() => (hasVideoOnMount ? 0 : 0));
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(() => isDirectOnMount);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoHasEntered, setVideoHasEntered] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoplayTriedRef = useRef(false);
  const [lens, setLens] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });
  const [imageTransition, setImageTransition] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasVideo = Boolean(videoUrl?.trim());
  const embedUrl = hasVideo ? getEmbedVideoUrl(videoUrl!) : null;
  const isDirectVideo = hasVideo && isDirectVideoUrl(videoUrl!);
  const mainSrc = imageList[0]?.src ?? thumbSrc ?? '';
  const mainAlt = imageList[0]?.alt ?? thumbAlt ?? '';
  const posterFallbackSrc = toImageSrc(thumbSrc || mainSrc);
  // Video thumbnail from Firebase DB: supports Firestore field videoPoster / video_poster / videoThumbnail, and gs:// or https URLs
  const videoPosterTrimmed = videoPoster != null && String(videoPoster).trim() ? String(videoPoster).trim() : '';
  const videoPosterResolved = videoPosterTrimmed ? toImageSrc(videoPosterTrimmed) : '';
  const posterSrc = posterError ? posterFallbackSrc : (videoPosterResolved || posterFallbackSrc);
  const posterSrcForImg = posterSrc && posterSrc.length > 0 ? posterSrc : posterFallbackSrc;

  const items: GalleryItem[] = hasVideo ? [{ type: 'video' }, ...imageList.map((img) => ({ type: 'image' as const, src: img.src, alt: img.alt ?? '' }))] : imageList.map((img) => ({ type: 'image' as const, src: img.src, alt: img.alt ?? '' }));
  const thumbnails = items.slice(0, 7);
  const hasMultiple = thumbnails.length > 1;

  const currentItem = items[mainIndex];
  const isVideoSelected = currentItem?.type === 'video';
  const displaySrc = currentItem?.type === 'image' ? currentItem.src : posterSrc;
  const displayAlt = currentItem?.type === 'image' ? currentItem.alt : thumbAlt ?? '';
  const resolvedSrc = toImageSrc(displaySrc);



  const stopVideo = useCallback(() => {
    setVideoPlaying(false);
    setVideoModalOpen(false);
    setVideoMuted(true);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

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
    if (!lightboxOpen && !videoModalOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
        stopVideo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [lightboxOpen, videoModalOpen, stopVideo]);

  useEffect(() => {
    if (!hasVideo || autoplayTriedRef.current) return;
    autoplayTriedRef.current = true;
    if (embedUrl) {
      setVideoModalOpen(true);
      return;
    }
    if (isDirectVideo) {
      const t = setTimeout(() => setVideoHasEntered(true), 50);
      return () => clearTimeout(t);
    }
  }, [hasVideo, embedUrl, isDirectVideo]);

  useEffect(() => {
    if (!videoPlaying || !isDirectVideo || !videoRef.current) return;
    const el = videoRef.current;
    const onCanPlay = () => { el.play().catch(() => { }); };
    const onPlaying = () => setVideoHasEntered(true);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('playing', onPlaying);
    el.play().catch(() => { });
    return () => {
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('playing', onPlaying);
    };
  }, [videoPlaying, isDirectVideo]);

  if (items.length === 0) {
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
          <div className="d-flex flex-row flex-md-column gap-2 order-2 order-md-1 flex-shrink-0 product-gallery-thumb-list">
            {thumbnails.map((item, i) => {
              const active = mainIndex === i;
              const isVideo = item.type === 'video';
              const thumbImgSrc = isVideo ? posterSrcForImg : toImageSrc((item as { type: 'image'; src: string; alt: string }).src);
              if (!thumbImgSrc && !isVideo) return null;
              return (
                <button
                  key={isVideo ? `video-${i}` : i}
                  type="button"
                  className={`border p-0 overflow-hidden bg-transparent product-gallery-thumb ${active ? 'border-dark border-2' : 'border-secondary border-opacity-50'}`}
                  style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 12 }}
                  onClick={() => setMainIndexWithTransition(i)}
                >
                  <span className="position-relative d-block w-100 h-100 bg-dark bg-opacity-10">
                    {thumbImgSrc ? (
                      <img
                        src={thumbImgSrc}
                        alt={isVideo ? 'Video' : (item as { type: 'image'; src: string; alt: string }).alt}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                        loading={isVideo ? 'eager' : 'lazy'}
                        decoding="async"
                        onError={isVideo ? () => setPosterError(true) : undefined}
                      />
                    ) : null}
                    {isVideo && (
                      <span className="position-absolute top-50 start-50 translate-middle product-gallery-thumb-play" aria-hidden>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><path d="M8 5v14l11-7z" /></svg>
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div
          className={`flex-grow-1 position-relative overflow-hidden rounded-3 bg-light product-gallery-hero ${hasMultiple ? 'order-1 order-md-2' : ''}`}
          style={{
            aspectRatio: '1',
            cursor: videoPlaying ? undefined : (isVideoSelected && hasVideo ? 'pointer' : resolvedSrc ? 'zoom-in' : undefined),
          }}
          ref={containerRef}
          onMouseMove={!isVideoSelected && !videoPlaying && resolvedSrc ? handleMouseMove : undefined}
          onMouseLeave={!isVideoSelected && !videoPlaying ? handleMouseLeave : undefined}
          onClick={() => {
            if (videoPlaying) return;
            if (isVideoSelected && hasVideo) {
              if (isDirectVideo) setVideoPlaying(true);
              else if (embedUrl) setVideoModalOpen(true);
            } else if (resolvedSrc) setLightboxOpen(true);
          }}
          role={(isVideoSelected && hasVideo) || resolvedSrc ? 'button' : undefined}
          tabIndex={(isVideoSelected && hasVideo) || resolvedSrc ? 0 : undefined}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            if (videoPlaying) return;
            if (isVideoSelected && hasVideo) {
              e.preventDefault();
              if (isDirectVideo) setVideoPlaying(true);
              else if (embedUrl) setVideoModalOpen(true);
            } else if (resolvedSrc) {
              e.preventDefault();
              setLightboxOpen(true);
            }
          }}
          aria-label={isVideoSelected && hasVideo ? 'Play product video' : resolvedSrc ? 'View full size image' : undefined}
        >
          <div
            className="position-relative w-100 h-100 d-flex align-items-center justify-content-center transition-transform duration-300 ease-out"
            style={{
              transform: !isVideoSelected && lens.show ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {/* Direct video playing inline */}
            {isVideoSelected && hasVideo && videoPlaying && isDirectVideo && (
              <div className="product-gallery-video-playing-wrap position-absolute top-0 start-0 w-100 h-100 rounded-3 overflow-hidden">
                <div className="product-gallery-aurora" aria-hidden />
                <div className="product-gallery-light-runner" aria-hidden />
                <div className="product-gallery-orb product-gallery-orb-1" aria-hidden />
                <div className="product-gallery-orb product-gallery-orb-2" aria-hidden />
                <div className="product-gallery-orb product-gallery-orb-3" aria-hidden />
                <div className="product-gallery-video-glow" aria-hidden />
                <video
                  ref={videoRef}
                  className={`w-100 h-100 product-gallery-video product-gallery-video-layer ${videoHasEntered ? 'product-gallery-video-enter' : ''}`}
                  style={{ objectFit: 'contain' }}
                  src={videoUrl}
                  poster={posterSrcForImg || undefined}
                  controls
                  autoPlay
                  playsInline
                  muted={videoMuted}
                  onEnded={stopVideo}
                />
                <div className="product-gallery-video-live-bar" aria-hidden>
                  <span className="product-gallery-video-live-dot" />
                  <span className="product-gallery-video-live-shine" />
                </div>
                {videoMuted && (
                  <button
                    type="button"
                    className="position-absolute bottom-0 start-0 m-2 btn btn-dark btn-sm rounded-pill shadow-sm product-gallery-unmute"
                    onClick={(e) => { e.stopPropagation(); setVideoMuted(false); }}
                    aria-label="Unmute"
                  >
                    Unmute
                  </button>
                )}
                <button
                  type="button"
                  className="position-absolute top-0 end-0 m-2 btn btn-dark btn-sm rounded-pill shadow-sm product-gallery-video-close"
                  onClick={(e) => { e.stopPropagation(); stopVideo(); }}
                  aria-label="Close video"
                >
                  Close video
                </button>
              </div>
            )}

            {/* Poster + play overlay when video slot selected but not playing */}
            {isVideoSelected && hasVideo && !videoPlaying && (
              <>
                {(posterSrcForImg || resolvedSrc) ? (
                  <img
                    src={posterSrcForImg || resolvedSrc}
                    alt={mainAlt}
                    className="w-100 h-100 product-gallery-main-img"
                    style={{ objectFit: 'contain' }}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onError={() => setPosterError(true)}
                  />
                ) : (
                  <div className="w-100 h-100 bg-dark bg-opacity-10 d-flex align-items-center justify-content-center" aria-hidden />
                )}
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center product-gallery-play-overlay product-gallery-play-pulse">
                  <span className="product-gallery-play-btn" aria-hidden>
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="32" cy="32" r="32" fill="rgba(0,0,0,0.5)" />
                      <path d="M26 20v24l18-12-18-12z" fill="#fff" />
                    </svg>
                  </span>
                </div>
              </>
            )}

            {/* Image when image slot selected */}
            {!isVideoSelected && resolvedSrc && (
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
            )}
          </div>
          {resolvedSrc && !isVideoSelected && (
            <span className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-60 rounded-pill small px-2 py-1">
              Click to zoom
            </span>
          )}
          {isVideoSelected && hasVideo && !videoPlaying && (
            <span className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-60 rounded-pill small px-2 py-1">
              Click to play
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

      {/* Video modal for YouTube / Vimeo */}
      {videoModalOpen && embedUrl && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center product-gallery-video-modal"
          style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setVideoModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Video"
        >
          <button
            type="button"
            className="position-absolute top-0 end-0 m-3 btn btn-light btn-sm rounded-circle shadow-sm d-flex align-items-center justify-content-center"
            style={{ zIndex: 1052, width: 44, height: 44 }}
            onClick={() => setVideoModalOpen(false)}
            aria-label="Close video"
          >
            ×
          </button>
          <div
            className="position-relative rounded-3 overflow-hidden shadow product-gallery-video-embed-wrap"
            style={{ width: '90vw', maxWidth: 900, aspectRatio: '16/9' }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={embedUrl}
              title="Product video"
              className="w-100 h-100 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <style>{`
        .product-gallery-hero { animation: product-gallery-hero-in 0.6s ease-out forwards; }
        @keyframes product-gallery-hero-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .product-gallery-video { opacity: 0; transition: opacity 0.4s ease-out; }
        .product-gallery-video-layer { position: relative; z-index: 2; }
        .product-gallery-video.product-gallery-video-enter { opacity: 1; animation: product-gallery-video-in 0.5s ease-out forwards; }
        @keyframes product-gallery-video-in {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .product-gallery-play-pulse .product-gallery-play-btn { animation: product-gallery-play-pulse 2.2s ease-in-out infinite; }
        @keyframes product-gallery-play-pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 6px 20px rgba(0,0,0,0.4)); }
        }
        .product-gallery-play-overlay:hover .product-gallery-play-pulse .product-gallery-play-btn { animation: none; transform: scale(1.1); }
        .product-gallery-thumb { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .product-gallery-thumb:hover { border-color: rgba(0,0,0,0.4) !important; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .product-gallery-thumb-play { filter: drop-shadow(0 1px 3px rgba(0,0,0,0.4)); }
        .product-gallery-main-img { transition: opacity 0.3s ease, transform 0.3s ease; }
        .product-gallery-play-overlay { background: rgba(0,0,0,0.15); transition: background 0.25s ease; }
        .product-gallery-play-overlay:hover { background: rgba(0,0,0,0.25); }
        .product-gallery-play-btn { display: inline-flex; transition: transform 0.25s ease, box-shadow 0.25s ease; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3)); }
        .product-gallery-play-overlay:hover .product-gallery-play-btn { transform: scale(1.08); }
        .product-gallery-video-close { z-index: 5; }
        .product-gallery-unmute { z-index: 5; }
        .product-gallery-video-modal .product-gallery-video-embed-wrap { background: #000; animation: product-gallery-hero-in 0.4s ease-out; }
        .product-gallery-video-playing-wrap { z-index: 2; animation: product-gallery-playing-in 0.5s ease-out, product-gallery-video-frame 3s ease-in-out 0.5s infinite; }
        @keyframes product-gallery-playing-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes product-gallery-video-frame { 0%, 100% { box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 0 20px rgba(0,0,0,0.04); } 50% { box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 0 28px rgba(0,0,0,0.08); } }
        .product-gallery-aurora { position: absolute; inset: -6px; border-radius: inherit; background: conic-gradient(from 0deg at 50% 50%, #6366f1 0deg, #8b5cf6 72deg, #a855f7 144deg, #06b6d4 216deg, #22d3ee 288deg, #6366f1 360deg); animation: product-gallery-aurora-spin 6s linear infinite; pointer-events: none; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; padding: 4px; opacity: 0.85; }
        @keyframes product-gallery-aurora-spin { to { transform: rotate(360deg); } }
        .product-gallery-light-runner { position: absolute; width: 48px; height: 48px; margin: -24px 0 0 -24px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.2) 50%, transparent 70%); box-shadow: 0 0 24px rgba(255,255,255,0.65), 0 0 48px rgba(255,255,255,0.3); pointer-events: none; animation: product-gallery-light-run 6s linear infinite; left: 3%; top: 3%; z-index: 1; }
        @keyframes product-gallery-light-run { 0% { left: 3%; top: 3%; transform: translate(0, 0); } 12.5% { left: 50%; top: 3%; transform: translate(-50%, 0); } 25% { left: 97%; top: 3%; transform: translate(-100%, 0); } 37.5% { left: 97%; top: 50%; transform: translate(-100%, -50%); } 50% { left: 97%; top: 97%; transform: translate(-100%, -100%); } 62.5% { left: 50%; top: 97%; transform: translate(-50%, -100%); } 75% { left: 3%; top: 97%; transform: translate(0, -100%); } 87.5% { left: 3%; top: 50%; transform: translate(0, -50%); } 100% { left: 3%; top: 3%; transform: translate(0, 0); } }
        .product-gallery-orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(28px); opacity: 0.25; }
        .product-gallery-orb-1 { width: 100px; height: 100px; background: radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%); top: 15%; left: 20%; animation: product-gallery-orb-float-1 8s ease-in-out infinite; }
        .product-gallery-orb-2 { width: 80px; height: 80px; background: radial-gradient(circle, rgba(236,72,153,0.45) 0%, transparent 70%); top: 60%; right: 15%; animation: product-gallery-orb-float-2 10s ease-in-out infinite 1s; }
        .product-gallery-orb-3 { width: 70px; height: 70px; background: radial-gradient(circle, rgba(34,211,238,0.5) 0%, transparent 70%); bottom: 20%; left: 25%; animation: product-gallery-orb-float-3 9s ease-in-out infinite 0.5s; }
        @keyframes product-gallery-orb-float-1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(12px, -15px) scale(1.05); } 66% { transform: translate(-8px, 10px) scale(0.95); } }
        @keyframes product-gallery-orb-float-2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-15px, -8px) scale(1.1); } }
        @keyframes product-gallery-orb-float-3 { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(10px, 12px); } 75% { transform: translate(-12px, -6px); } }
        .product-gallery-video-glow { position: absolute; inset: -24px; background: radial-gradient(ellipse 75% 55% at 50% 50%, rgba(0,0,0,0.1), transparent 65%); pointer-events: none; animation: product-gallery-glow-pulse 2.5s ease-in-out infinite; }
        @keyframes product-gallery-glow-pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.03); } }
        .product-gallery-video-live-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, rgba(0,0,0,0.2), transparent 30%, transparent 70%, rgba(0,0,0,0.1)); overflow: hidden; z-index: 3; }
        .product-gallery-video-live-dot { position: absolute; left: 14px; bottom: 50%; transform: translateY(50%); width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 10px #22c55e; animation: product-gallery-live-dot 1.2s ease-in-out infinite; }
        .product-gallery-video-live-shine { position: absolute; top: 0; left: -80%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); animation: product-gallery-live-shine 2.8s ease-in-out infinite; }
        @keyframes product-gallery-live-dot { 0%, 100% { opacity: 1; transform: translateY(50%) scale(1); box-shadow: 0 0 10px #22c55e; } 50% { opacity: 0.75; transform: translateY(50%) scale(1.25); box-shadow: 0 0 16px #22c55e, 0 0 24px rgba(34,197,94,0.4); } }
        @keyframes product-gallery-live-shine { 0% { left: -50%; } 100% { left: 120%; } }
      `}</style>
    </div>
  );
}
