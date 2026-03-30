import { getSiteUrl } from './siteUrl';

/** Absolute URL for public assets and OG images. */
export function publicUrl(path: string): string {
  const base = getSiteUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
