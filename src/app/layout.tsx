import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Syne } from 'next/font/google';
import Script from 'next/script';
import type { ReactNode } from 'react';

import JsonLd from '@/components/seo/JsonLd';
import { SEO, fullUrl, rootMetadata } from '@/lib/seo';
import { getSiteUrl } from '@/lib/siteUrl';
import Providers from './providers';
import './globals.scss';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = rootMetadata();

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const site = getSiteUrl();
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO.siteName,
    url: site,
    description: SEO.defaultDescription,
    logo: fullUrl('/favicon.svg', site),
  };

  return (
    <html lang="en" className={`${plusJakarta.variable} ${syne.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
      </head>
      <body>
        <JsonLd data={orgJsonLd} />
        <Providers>{children}</Providers>
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script src="/js/astro-ecommerce.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
