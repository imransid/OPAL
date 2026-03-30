/**
 * Single place for product-card price strings so BDT / ৳ / Tk stay consistent.
 */
export function formatCardPrice(currency: string | undefined, price: number): string {
  const formatted = price.toLocaleString(undefined);
  const raw = (currency ?? '').trim();
  if (!raw) return formatted;

  const upper = raw.toUpperCase().replace(/\s+/g, '');

  if (upper === 'BDT' || upper === 'TK' || upper === 'TAKA') {
    return `৳${formatted}`;
  }

  if (raw === '৳' || raw === 'Tk' || raw === 'tk') {
    return `৳${formatted}`;
  }

  // Already a symbol glued to number risk - if ends with typical symbol chars
  if (/^[€$£¥৳]/u.test(raw) || raw.length <= 2) {
    const sym = raw.replace(/\s/g, '');
    return `${sym}${formatted}`;
  }

  // Code suffix style: "USD 10" -> keep space for readability
  if (/^[A-Z]{2,3}$/i.test(raw)) {
    return `${raw.toUpperCase()} ${formatted}`;
  }

  return `${raw}${formatted}`;
}
