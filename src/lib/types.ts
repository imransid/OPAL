export interface ProductImage {
  src: string;
  alt?: string;
}

export interface ProductFeature {
  title: string;
  description: string;
}

export interface LongDescription {
  intro?: string;
  usage?: string;
  compatibility?: string[];
}

export interface ProductDelivery {
  deliveryTime?: string;
  deliveryAreas?: string[];
}

export interface ProductPricing {
  price: number;
  currency?: string;
  discountPrice?: number;
  inStock?: boolean;
}

export interface Product {
  id: string;
  title: string;
  categoryId?: string;
  description?: string;
  shortDescription?: string;
  full_description?: string;
  longDescription?: LongDescription;
  details?: string;
  price: number;
  discountPrice?: number;
  currency?: string;
  thumb_src: string;
  thumb_alt?: string;
  images?: ProductImage[];
  color?: string;
  colors?: string[];
  stock?: boolean;
  rating?: number;
  reviews?: number;
  size?: string;
  sizes?: Record<string, number>;
  highlights?: string[];
  features?: (string | ProductFeature)[];
  data?: Record<string, string | number | boolean>;
  specifications?: Record<string, string | number | boolean>;
  featuresDetails?: Record<string, string>;
  brand?: string;
  model?: string;
  slug?: string;
  /** Admin-only: not displayed on storefront */
  resource?: string;
  delivery?: ProductDelivery;
  status?: string;
}

export interface Category {
  id: string;
  title: string;
  collection: string;
  thumb_src: string;
  /** Parent category ID – when set, this is a sub-category */
  parentId?: string;
}

export interface StoreSettings {
  /** Default shipping cost when subtotal is below free shipping threshold */
  shippingCost?: number;
  /** Subtotal above which shipping is free (0 = always free) */
  freeShippingThreshold?: number;
  /** Default currency symbol (e.g. $, €) */
  currency?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  thumb_src?: string;
  color?: string;
  size?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  contact: { email: string; phone: string };
  shipping: { address: string; city: string; state: string; postalCode: string };
  paymentMethod: 'cod' | 'card';
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  status: OrderStatus;
  createdAt: ReturnType<typeof Date.now>;
}
