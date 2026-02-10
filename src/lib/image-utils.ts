/** Convert to usable image src. Handles https, gs://, and relative paths. */
export function toImageSrc(src: string): string {
  if (src == null || typeof src !== 'string') return '';
  const s = String(src).trim();
  if (!s) return '';
  if (/^https?:/i.test(s)) return s;
  if (/^\/\//.test(s)) return 'https:' + s;
  const gs = s.match(/^gs:\/\/([^/]+)\/(.+)$/);
  if (gs) {
    const enc = encodeURIComponent(gs[2]);
    return `https://firebasestorage.googleapis.com/v0/b/${gs[1]}/o/${enc}?alt=media`;
  }
  return s.startsWith('/') ? s : '/' + s;
}
