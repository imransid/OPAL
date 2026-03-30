/**
 * Canonical site origin for metadata, JSON-LD, and sitemap (no trailing slash).
 * Host-only values (e.g. example.com) get https:// so new URL() / metadataBase never throw.
 */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || '').trim();
  if (raw) {
    let base = raw.replace(/\/$/, '');
    if (!/^https?:\/\//i.test(base)) {
      base = `https://${base}`;
    }
    return base;
  }
  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${host}`;
  }
  return 'http://localhost:3000';
}
