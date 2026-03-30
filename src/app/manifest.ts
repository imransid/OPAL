import type { MetadataRoute } from 'next';

import { SEO } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SEO.siteName,
    short_name: SEO.siteName,
    description: SEO.defaultDescription,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0b',
    theme_color: '#0a0a0b',
    lang: 'en',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
