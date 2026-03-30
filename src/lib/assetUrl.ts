/** Public asset path (Next.js serves `public/` at `/`). */
export function assetUrl(path: string): string {
  if (path.startsWith('http') || path.startsWith('//') || path.startsWith('data:')) return path;
  return path.startsWith('/') ? path : `/${path}`;
}
