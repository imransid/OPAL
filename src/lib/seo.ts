/**
 * Central SEO configuration for OPAL e-commerce.
 * Used across Layout and pages for meta tags, Open Graph, and structured data.
 */

export const SEO = {
  siteName: 'OPAL',
  defaultTitle: 'OPAL — Modern E-commerce | Curated Products, Quality & Fast Delivery',
  defaultDescription:
    'Shop curated products at OPAL. Quality picks, secure checkout, fast delivery. Discover the best selection for every moment.',
  defaultImage: '/images/opal1.jpg',
  defaultImageAlt: 'OPAL — Curated products for every moment',
  twitterHandle: '@opal',
  locale: 'en_US',
  type: 'website' as const,
} as const;

/** Build full URL for a path (used for canonical, og:url) */
export function fullUrl(path: string, site?: string): string {
  const base = site || 'https://opal.example.com';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/$/, '')}${cleanPath}`;
}

