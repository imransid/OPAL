import type { APIRoute } from 'astro';
import { getProductsServer } from '../lib/firestore-server';

const site =
  process.env.PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://opal.example.com');

/**
 * Dynamic sitemap for product pages so search engines can discover them.
 * In SSR, @astrojs/sitemap only includes static routes; product URLs (?id=) are not included.
 */
export const GET: APIRoute = async () => {
  const products = await getProductsServer();
  const base = site.replace(/\/$/, '');
  const urls = products
    .filter((p) => p.id)
    .map((p) => `  <url><loc>${base}/product?id=${encodeURIComponent(p.id)}</loc><changefreq>weekly</changefreq></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
