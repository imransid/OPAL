import type { Product, ProductFeature, ProductImage, LongDescription, ProductDelivery } from './types';

/** JSON format from user (nested or flat e.g. Lazada-style) */
export interface ProductJsonInput {
  brand?: string;
  model?: string;
  title?: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: LongDescription | string;
  capacityMah?: number;
  wirelessCharging?: boolean;
  magnetic?: boolean;
  features?: Array<{ title: string; description: string } | string>;
  specifications?: Record<string, string | number | boolean>;
  /** Nested: pricing.price, pricing.currency, etc. */
  pricing?: {
    price?: number;
    currency?: string;
    discountPrice?: number;
    inStock?: boolean;
    sizePrices?: Record<string, number>;
  };
  /** Flat: top-level price, currency, discountPrice */
  price?: number;
  discountPrice?: number | null;
  currency?: string;
  /** "In stock" / "Out of stock" or true/false */
  availability?: string | boolean;
  /** Nested: images.cover, images.gallery */
  images?: {
    cover?: string;
    gallery?: string[];
  };
  /** Flat: single image URL */
  imageUrl?: string;
  /** Flat: array of image URLs */
  galleryUrls?: string[];
  /** Flat: category name or path (e.g. "Headphones & Earbuds > Headphones & Earbuds"); form still uses categoryId from dropdown */
  category?: string;
  colourSummary?: string;
  coloursAvailable?: string;
  sizeAvailable?: string;
  sizeWisePrice?: string;
  delivery?: ProductDelivery;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  resource?: string;
  /** Product brand origin (e.g. China, Japan, Malaysia) */
  brandOrigin?: string;
  /** Starred/featured product (boolean or "yes"/"true"/"star"/"featured") */
  star?: boolean | string;
  [key: string]: unknown;
}

function parseAvailability(availability: string | boolean | undefined): boolean {
  if (availability === undefined) return true;
  if (typeof availability === 'boolean') return availability;
  const v = String(availability).toLowerCase();
  if (v === 'in stock' || v === 'yes' || v === 'true' || v === '1') return true;
  if (v === 'out of stock' || v === 'no' || v === 'false' || v === '0') return false;
  return true;
}

function parseCommaList(s: string | undefined): string[] {
  if (!s || typeof s !== 'string') return [];
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

/** Parse "S:10, M:20" or "S, M, L" into sizes object */
function parseSizesStr(s: string | undefined): Record<string, number> {
  if (!s || typeof s !== 'string') return {};
  const out: Record<string, number> = {};
  parseCommaList(s).forEach((part) => {
    const colon = part.indexOf(':');
    if (colon > 0) {
      const k = part.slice(0, colon).trim();
      const v = parseInt(part.slice(colon + 1).trim(), 10);
      out[k] = Number.isNaN(v) ? 0 : v;
    } else {
      out[part] = 0;
    }
  });
  return out;
}

/** Parse "S:100, M:110" into sizePrices */
function parseSizePricesStr(s: string | undefined): Record<string, number> | undefined {
  if (!s || typeof s !== 'string') return undefined;
  const out: Record<string, number> = {};
  parseCommaList(s).forEach((part) => {
    const colon = part.indexOf(':');
    if (colon > 0) {
      const k = part.slice(0, colon).trim();
      const v = parseFloat(part.slice(colon + 1).trim());
      if (!Number.isNaN(v)) out[k] = v;
    }
  });
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Convert imported JSON to Product form data (supports nested and flat formats) */
export function jsonToProduct(json: ProductJsonInput): Partial<Omit<Product, 'id'>> {
  const p = json.pricing;
  const imgs = json.images;
  const specs = json.specifications ?? {};
  if (json.capacityMah != null) (specs as Record<string, number>)['capacityMah'] = json.capacityMah;
  if (json.wirelessCharging != null) (specs as Record<string, boolean>)['wirelessCharging'] = json.wirelessCharging;
  if (json.magnetic != null) (specs as Record<string, boolean>)['magnetic'] = json.magnetic;

  const galleryUrls = imgs?.gallery ?? json.galleryUrls ?? [];
  const gallery: ProductImage[] = galleryUrls.map((src) => ({ src, alt: '' }));
  const thumbSrc = imgs?.cover ?? json.imageUrl ?? '';

  let longDesc: LongDescription | undefined;
  if (json.longDescription) {
    if (typeof json.longDescription === 'string') {
      longDesc = { intro: json.longDescription };
    } else {
      longDesc = json.longDescription as LongDescription;
    }
  }

  const features: ProductFeature[] = (json.features ?? []).map((f) =>
    typeof f === 'string' ? { title: f, description: '' } : f
  );

  const price = typeof p?.price === 'number' ? p.price : (typeof json.price === 'number' ? json.price : 0);
  const discountPrice = p?.discountPrice ?? (typeof json.discountPrice === 'number' ? json.discountPrice : undefined);
  const currency = p?.currency ?? json.currency;
  const stock = p?.inStock ?? parseAvailability(json.availability);
  const sizePrices = p?.sizePrices ?? parseSizePricesStr(json.sizeWisePrice);
  const colors = parseCommaList(json.coloursAvailable);
  const sizes = parseSizesStr(json.sizeAvailable);

  return {
    title: json.title ?? '',
    description: json.shortDescription ?? '',
    shortDescription: json.shortDescription,
    longDescription: longDesc,
    brand: json.brand,
    brandOrigin: json.brandOrigin,
    model: json.model,
    slug: json.slug,
    star: typeof json.star === 'boolean' ? json.star : typeof json.star === 'string' ? ['yes', 'true', '1', 'star', 'featured'].includes(String(json.star).toLowerCase()) : undefined,
    price,
    discountPrice,
    currency,
    stock,
    sizePrices: sizePrices && Object.keys(sizePrices).length > 0 ? sizePrices : undefined,
    sizes: Object.keys(sizes).length > 0 ? sizes : undefined,
    color: json.colourSummary || undefined,
    colors: colors.length > 0 ? colors : undefined,
    thumb_src: thumbSrc,
    images: gallery.length > 0 ? gallery : undefined,
    features: features.length > 0 ? features : undefined,
    specifications: Object.keys(specs).length > 0 ? specs : undefined,
    delivery: json.delivery,
    status: json.status,
    resource: json.resource,
  };
}
