import { useId } from 'react';

type OpalLogoProps = {
  className?: string;
  variant?: 'full' | 'mark';
  'aria-label'?: string;
};

/**
 * OPAL mark — crystalline hex frame + circular negative space (monogram “O”).
 * Modern luxury: precise geometry, restrained iridescence, micro crown facet.
 */
function GemMark({
  className = '',
  ariaLabel = 'OPAL',
  decorative = false,
}: {
  className?: string;
  ariaLabel?: string;
  decorative?: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const id = {
    body: `opal-o-body-${uid}`,
    sheen: `opal-o-sheen-${uid}`,
    edge: `opal-o-edge-${uid}`,
    crown: `opal-o-crown-${uid}`,
    spark: `opal-o-spark-${uid}`,
  };

  /* Flat-top hex, circumradius 26, center (32,32). Circular void r=11.5 — classic “O” in a jewel setting. */
  const hexOuter =
    'M32 6 L54.516 19 L54.516 45 L32 58 L9.484 45 L9.484 19 Z';
  const ringHole =
    'M43.5 32 A11.5 11.5 0 1 1 20.5 32 A11.5 11.5 0 1 1 43.5 32';

  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : ariaLabel}
    >
      <defs>
        <linearGradient id={id.body} x1="10" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f7f2e8" />
          <stop offset="0.35" stopColor="#d4c4a8" />
          <stop offset="0.55" stopColor="#8e7cac" />
          <stop offset="0.78" stopColor="#3d3552" />
          <stop offset="1" stopColor="#121018" />
        </linearGradient>
        <linearGradient id={id.sheen} x1="18" y1="12" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#faf6ff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id.edge} x1="9" y1="18" x2="55" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ece5d8" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#9a8b78" stopOpacity="0.75" />
          <stop offset="1" stopColor="#2a2438" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={id.crown} x1="26" y1="4" x2="38" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fffefb" />
          <stop offset="0.5" stopColor="#e3d5b8" />
          <stop offset="1" stopColor="#b09a72" />
        </linearGradient>
        <radialGradient
          id={id.spark}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(26 20) rotate(48) scale(8 5)"
        >
          <stop stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Frame + O void */}
      <path
        d={`${hexOuter} ${ringHole}`}
        fill={`url(#${id.body})`}
        fillRule="evenodd"
        stroke={`url(#${id.edge})`}
        strokeWidth="0.65"
        strokeLinejoin="round"
      />

      {/* Iridescent sheen across upper facets */}
      <path d={`${hexOuter} ${ringHole}`} fill={`url(#${id.sheen})`} fillRule="evenodd" fillOpacity="0.5" />

      {/* Crown micro-facet — precision “clasp” */}
      <path d="M32 6 L27 14.5 h10 L32 6Z" fill={`url(#${id.crown})`} stroke="#8a7a62" strokeOpacity="0.25" strokeWidth="0.35" strokeLinejoin="miter" />

      {/* Specular pin */}
      <circle cx="26" cy="20" r="1.5" fill={`url(#${id.spark})`} />
    </svg>
  );
}

export default function OpalLogo({
  className = '',
  variant = 'full',
  'aria-label': ariaLabel = 'OPAL',
}: OpalLogoProps) {
  if (variant === 'mark') {
    return <GemMark className={className} ariaLabel={ariaLabel} />;
  }

  return (
    <span className={`opal-logo-lockup d-inline-flex align-items-center ${className}`.trim()}>
      <GemMark className="opal-logo-mark flex-shrink-0" decorative />
      <span className="opal-logo-text d-flex flex-column align-items-start justify-content-center">
        <span className="opal-logo-name">OPAL</span>
        <span className="opal-logo-sub">FASHION · TECH</span>
      </span>
    </span>
  );
}
