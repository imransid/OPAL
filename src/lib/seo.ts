import type { Metadata } from 'next';
import { getSiteUrl } from './siteUrl';
import { publicUrl } from './publicUrl';

function metadataBaseUrl(site: string): URL {
  try {
    const u = new URL(site);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u;
  } catch {
    /* fall through */
  }
  try {
    const v = process.env.VERCEL_URL;
    if (v) return new URL(`https://${v.replace(/^https?:\/\//, '').replace(/\/$/, '')}`);
  } catch {
    /* fall through */
  }
  return new URL('http://localhost:3000');
}

/**
 * Central SEO configuration for OPAL e-commerce.
 */

export const SEO = {
  siteName: 'OPAL',
  defaultTitle: 'OPAL — Fashion × Tech | Curated Apparel & Premium Gear',
  defaultDescription:
    'Curated fashion and technology at OPAL. Editorial apparel, precision gear, secure checkout, and fast delivery.',
  defaultImage: '/images/opal1.jpg',
  defaultImageAlt: 'OPAL — Fashion and technology in one curated store',
  twitterHandle: '@opal',
  locale: 'en_US',
  type: 'website' as const,
} as const;

/** Build full URL for a path (canonical, og:url). */
export function fullUrl(path: string, site?: string): string {
  const base = (site || getSiteUrl()).replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/** Default Next.js metadata (merged in root layout). */
export function rootMetadata(): Metadata {
  const site = getSiteUrl();
  const ogImage = publicUrl(SEO.defaultImage);
  const googleVerify = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

  return {
    metadataBase: metadataBaseUrl(site),
    title: {
      default: SEO.defaultTitle,
      template: `%s — ${SEO.siteName}`,
    },
    description: SEO.defaultDescription,
    applicationName: SEO.siteName,
    authors: [{ name: SEO.siteName, url: site }],
    creator: SEO.siteName,
    publisher: SEO.siteName,
    formatDetection: { email: false, address: false, telephone: false },
    ...(googleVerify ? { verification: { google: googleVerify } } : {}),
    openGraph: {
      type: 'website',
      locale: SEO.locale,
      url: site,
      siteName: SEO.siteName,
      title: SEO.defaultTitle,
      description: SEO.defaultDescription,
      images: [{ url: ogImage, width: 1200, height: 630, alt: SEO.defaultImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      site: SEO.twitterHandle,
      title: SEO.defaultTitle,
      description: SEO.defaultDescription,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
    icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
  };
}

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  noindex?: boolean;
}): Metadata {
  const site = getSiteUrl();
  const url = fullUrl(opts.path, site);
  const imagePath = opts.image ?? SEO.defaultImage;
  const ogImage = imagePath.startsWith('http') ? imagePath : publicUrl(imagePath);
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      url,
      title: opts.title,
      description: opts.description,
      images: [{ url: ogImage, alt: opts.imageAlt ?? SEO.defaultImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: [ogImage],
    },
    robots: opts.noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

