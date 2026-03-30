import type { MetadataRoute } from 'next';

import { getProductsServer } from '@/lib/firestore-server';
import { productPath } from '@/lib/productPath';
import { getSiteUrl } from '@/lib/siteUrl';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/shop`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/orders/track`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/landing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProductsServer();
    productRoutes = products
      .filter((p) => p.id)
      .map((p) => ({
        url: `${base}${productPath(p.id)}`,
        lastModified: new Date(
          typeof p.updatedAt === 'number'
            ? p.updatedAt
            : typeof p.createdAt === 'number'
              ? p.createdAt
              : Date.now(),
        ),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch {
    /* Firestore may be unavailable at build time */
  }

  return [...staticRoutes, ...productRoutes];
}
