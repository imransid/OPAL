import type { APIRoute } from 'astro';

/**
 * Dynamic robots.txt that points crawlers to the sitemap.
 * Uses the site URL from Astro config for the sitemap reference.
 */
export const GET: APIRoute = ({ site }) => {
  const base = site?.href || 'https://opal.example.com';
  const sitemapIndex = new URL('sitemap-index.xml', base);
  const sitemapProducts = new URL('sitemap-products.xml', base);

  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${sitemapIndex.href}
Sitemap: ${sitemapProducts.href}
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
