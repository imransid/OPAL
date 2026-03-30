import { fullUrl } from '@/lib/seo';
import type { Product } from '@/lib/types';

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function productDescription(product: Product, maxLen: number): string {
  const raw =
    product.shortDescription ||
    product.description ||
    `Buy ${product.title} at OPAL. Secure checkout and fast delivery.`;
  const plain = stripHtml(raw);
  return plain.slice(0, maxLen);
}

function absoluteImageUrls(product: Product, site: string): string[] {
  const out: string[] = [];
  const push = (src: string | undefined) => {
    if (!src?.trim()) return;
    const s = src.trim();
    out.push(s.startsWith('http') ? s : fullUrl(s.startsWith('/') ? s : `/${s}`, site));
  };
  push(product.thumb_src);
  for (const img of product.images ?? []) {
    push(img.src);
  }
  return [...new Set(out)];
}

export function buildProductPageJsonLd(opts: {
  product: Product;
  site: string;
  canonicalPath: string;
  categoryName?: string;
  categoryId?: string;
}): Record<string, unknown> {
  const { product, site, canonicalPath, categoryName, categoryId } = opts;
  const pageUrl = fullUrl(canonicalPath, site);
  const desc = productDescription(product, 5000);
  const images = absoluteImageUrls(product, site);
  const currency = product.currency ?? 'BDT';
  const price = product.discountPrice ?? product.price;

  const crumbs: Array<{ name: string; path: string }> = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
  ];
  if (categoryName && categoryId) {
    crumbs.push({
      name: categoryName,
      path: `/shop?category=${encodeURIComponent(categoryId)}`,
    });
  }
  crumbs.push({ name: product.title, path: canonicalPath });

  const breadcrumb: Record<string, unknown> = {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: fullUrl(c.path, site),
    })),
  };

  const offers: Record<string, unknown> = {
    '@type': 'Offer',
    url: pageUrl,
    priceCurrency: currency,
    price,
    availability:
      product.stock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
  };

  const productNode: Record<string, unknown> = {
    '@type': 'Product',
    '@id': `${pageUrl}#product`,
    name: product.title,
    description: desc,
    sku: product.id,
    url: pageUrl,
    ...(images.length ? { image: images.length === 1 ? images[0] : images } : {}),
    ...(product.brand && {
      brand: { '@type': 'Brand', name: product.brand },
    }),
    offers,
  };

  if (
    product.reviews != null &&
    product.reviews > 0 &&
    product.rating != null &&
    Number.isFinite(product.rating)
  ) {
    productNode.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [breadcrumb, productNode],
  };
}
