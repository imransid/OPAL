/** Canonical storefront path for a product (SEO-friendly, no query string). */
export function productPath(productId: string): string {
  if (!productId.trim()) return '/shop';
  return `/product/${encodeURIComponent(productId.trim())}`;
}
