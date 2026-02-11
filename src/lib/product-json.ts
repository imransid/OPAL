import type { Product, ProductFeature, ProductImage, LongDescription, ProductDelivery } from './types';

/** JSON format from user (e.g. Baseus power bank) */
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
  pricing?: {
    price?: number;
    currency?: string;
    discountPrice?: number;
    inStock?: boolean;
    sizePrices?: Record<string, number>;
  };
  images?: {
    cover?: string;
    gallery?: string[];
  };
  delivery?: ProductDelivery;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  resource?: string;
  [key: string]: unknown;
}

/** Convert imported JSON to Product form data */
export function jsonToProduct(json: ProductJsonInput): Partial<Omit<Product, 'id'>> {
  const p = json.pricing;
  const imgs = json.images;
  const specs = json.specifications ?? {};
  if (json.capacityMah != null) (specs as Record<string, number>)['capacityMah'] = json.capacityMah;
  if (json.wirelessCharging != null) (specs as Record<string, boolean>)['wirelessCharging'] = json.wirelessCharging;
  if (json.magnetic != null) (specs as Record<string, boolean>)['magnetic'] = json.magnetic;

  const gallery: ProductImage[] = (imgs?.gallery ?? []).map((src) => ({ src, alt: '' }));

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

  return {
    title: json.title ?? '',
    description: json.shortDescription ?? '',
    shortDescription: json.shortDescription,
    longDescription: longDesc,
    brand: json.brand,
    model: json.model,
    slug: json.slug,
    price: typeof p?.price === 'number' ? p.price : 0,
    discountPrice: p?.discountPrice,
    currency: p?.currency,
    stock: p?.inStock ?? true,
    sizePrices: p?.sizePrices,
    thumb_src: imgs?.cover ?? '',
    images: gallery.length > 0 ? gallery : undefined,
    features: features.length > 0 ? features : undefined,
    specifications: Object.keys(specs).length > 0 ? specs : undefined,
    delivery: json.delivery,
    status: json.status,
    resource: json.resource,
  };
}
