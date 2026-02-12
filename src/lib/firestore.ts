import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import type { Product, Category, StoreSettings, Order, OrderItem, BackupData } from './types';

const PRODUCTS = 'products';
const CATEGORIES = 'categories';
const STORE_SETTINGS = 'storeSettings';
const SETTINGS_DOC_ID = 'config';
const ORDERS = 'orders';

/** Firestore rejects undefined – omit those fields */
function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

// --- Products ---

function normalizeProduct(docData: Record<string, unknown>, id: string): Product {
  const data = { id, ...docData } as Product & { createdAt?: unknown; updatedAt?: unknown };
  const createdAt = data.createdAt;
  const updatedAt = data.updatedAt;
  if (createdAt != null && typeof createdAt === 'object' && 'toMillis' in createdAt && typeof (createdAt as { toMillis: () => number }).toMillis === 'function') {
    data.createdAt = (createdAt as { toMillis: () => number }).toMillis();
  }
  if (updatedAt != null && typeof updatedAt === 'object' && 'toMillis' in updatedAt && typeof (updatedAt as { toMillis: () => number }).toMillis === 'function') {
    data.updatedAt = (updatedAt as { toMillis: () => number }).toMillis();
  }
  // Normalize video thumbnail from Firebase DB (Firestore field can be any of these)
  const raw = data as Record<string, unknown>;
  const videoThumbnailRaw =
    raw.videoPoster ?? raw.video_poster ?? raw.videoThumbnail ?? raw.video_thumbnail;
  const videoThumbnailStr =
    videoThumbnailRaw != null && typeof videoThumbnailRaw === 'string'
      ? String(videoThumbnailRaw).trim()
      : '';
  if (videoThumbnailStr.length > 0) {
    data.videoPoster = videoThumbnailStr;
  } else {
    data.videoPoster = undefined;
  }
  // Normalize size/color from Firebase so UI can always show them
  if (!Array.isArray(data.colors)) data.colors = [];
  if (data.sizes != null && typeof data.sizes === 'object' && !Array.isArray(data.sizes)) {
    const raw = data.sizes as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
      const n = typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v, 10) : 0;
      if (!Number.isNaN(n)) out[k] = n;
    }
    data.sizes = out;
  } else {
    data.sizes = data.sizes ?? {};
  }
  return data as Product;
}

export async function getProducts(): Promise<Product[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, PRODUCTS), orderBy('title')));
  return snap.docs.map((d) => normalizeProduct(d.data() as Record<string, unknown>, d.id));
}

export async function getProduct(id: string): Promise<Product | null> {
  const db = getDb();
  if (!db) return null;
  const ref = doc(db, PRODUCTS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normalizeProduct(snap.data() as Record<string, unknown>, snap.id);
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const ref = await addDoc(collection(db, PRODUCTS), {
    ...omitUndefined(data as Record<string, unknown>),
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const ref = doc(db, PRODUCTS, id);
  await updateDoc(ref, { ...omitUndefined(data as Record<string, unknown>), updatedAt: Timestamp.now() });
}

export async function deleteProduct(id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, PRODUCTS, id));
}

// --- Categories ---

export async function getCategories(): Promise<Category[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, CATEGORIES), orderBy('title')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
}

export async function getCategory(id: string): Promise<Category | null> {
  const db = getDb();
  if (!db) return null;
  const ref = doc(db, CATEGORIES, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Category;
}

export async function createCategory(data: Omit<Category, 'id'>): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const ref = await addDoc(collection(db, CATEGORIES), {
    ...omitUndefined(data as Record<string, unknown>),
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const ref = doc(db, CATEGORIES, id);
  await updateDoc(ref, { ...omitUndefined(data as Record<string, unknown>), updatedAt: Timestamp.now() });
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, CATEGORIES, id));
}

// --- Store Settings ---

export async function getStoreSettings(): Promise<StoreSettings> {
  const db = getDb();
  if (!db) return {};
  const ref = doc(db, STORE_SETTINGS, SETTINGS_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};
  return snap.data() as StoreSettings;
}

export async function updateStoreSettings(data: Partial<StoreSettings>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const ref = doc(db, STORE_SETTINGS, SETTINGS_DOC_ID);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { ...omitUndefined(data as Record<string, unknown>), updatedAt: Timestamp.now() });
  } else {
    await setDoc(ref, { ...omitUndefined(data as Record<string, unknown>), createdAt: Timestamp.now() });
  }
}

// --- Orders ---

function generateOrderNumber(): string {
  return 'OPAL-' + Date.now().toString(36).toUpperCase().slice(-8);
}

export interface CreateOrderInput {
  items: OrderItem[];
  contact: { email: string; phone: string };
  shipping: { address: string; city: string; state: string; postalCode: string };
  paymentMethod: 'cod' | 'card';
  subtotal: number;
  shippingCost: number;
  currency: string;
}

export async function createOrder(data: CreateOrderInput): Promise<{ id: string; orderNumber: string }> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const orderNumber = generateOrderNumber();
  const total = data.subtotal + data.shippingCost;
  const items = data.items.map((item) => omitUndefined(item as Record<string, unknown>));
  const docData = omitUndefined({
    orderNumber,
    items,
    contact: {
      email: data.contact.email.trim().toLowerCase(),
      phone: data.contact.phone.trim(),
    },
    shipping: omitUndefined(data.shipping as Record<string, unknown>),
    paymentMethod: data.paymentMethod,
    subtotal: data.subtotal,
    shippingCost: data.shippingCost,
    total,
    currency: data.currency,
    status: 'pending',
    createdAt: Timestamp.now(),
  });
  const ref = await addDoc(collection(db, ORDERS), docData);
  return { id: ref.id, orderNumber };
}

export async function getOrder(id: string): Promise<Order | null> {
  const db = getDb();
  if (!db) return null;
  const ref = doc(db, ORDERS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    orderNumber: d.orderNumber ?? '',
    items: d.items ?? [],
    contact: d.contact ?? { email: '', phone: '' },
    shipping: d.shipping ?? { address: '', city: '', state: '', postalCode: '' },
    paymentMethod: d.paymentMethod ?? 'cod',
    subtotal: d.subtotal ?? 0,
    shippingCost: d.shippingCost ?? 0,
    total: d.total ?? 0,
    currency: d.currency ?? '৳',
    status: d.status ?? 'pending',
    createdAt: d.createdAt?.toMillis?.() ?? Date.now(),
  } as Order;
}

export async function getOrderByNumberAndEmail(orderNumber: string, email: string): Promise<Order | null> {
  const db = getDb();
  if (!db) return null;
  const { where, getDocs } = await import('firebase/firestore');
  const num = orderNumber.trim().toUpperCase();
  const em = email.trim().toLowerCase();
  const q = query(collection(db, ORDERS), where('orderNumber', '==', num));
  const snap = await getDocs(q);
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const orderEmail = (d.contact?.email ?? '').toLowerCase();
    if (orderEmail === em) {
      return {
        id: docSnap.id,
        orderNumber: d.orderNumber ?? '',
        items: d.items ?? [],
        contact: d.contact ?? { email: '', phone: '' },
        shipping: d.shipping ?? { address: '', city: '', state: '', postalCode: '' },
        paymentMethod: d.paymentMethod ?? 'cod',
        subtotal: d.subtotal ?? 0,
        shippingCost: d.shippingCost ?? 0,
        total: d.total ?? 0,
        currency: d.currency ?? '৳',
        status: d.status ?? 'pending',
        createdAt: d.createdAt?.toMillis?.() ?? Date.now(),
      } as Order;
    }
  }
  return null;
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const ref = doc(db, ORDERS, orderId);
  await updateDoc(ref, { status, updatedAt: Timestamp.now() });
}

export async function getAllOrders(): Promise<Order[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, ORDERS), orderBy('createdAt', 'desc')));
  return snap.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      id: docSnap.id,
      orderNumber: d.orderNumber ?? '',
      items: d.items ?? [],
      contact: d.contact ?? { email: '', phone: '' },
      shipping: d.shipping ?? { address: '', city: '', state: '', postalCode: '' },
      paymentMethod: d.paymentMethod ?? 'cod',
      subtotal: d.subtotal ?? 0,
      shippingCost: d.shippingCost ?? 0,
      total: d.total ?? 0,
      currency: d.currency ?? '৳',
      status: d.status ?? 'pending',
      createdAt: d.createdAt?.toMillis?.() ?? Date.now(),
    } as Order;
  });
}

export async function deleteOrder(orderId: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, ORDERS, orderId));
}

// --- Backup (Export / Restore) ---

export async function exportBackup(): Promise<BackupData> {
  const [products, categories, orders, storeSettings] = await Promise.all([
    getProducts(),
    getCategories(),
    getAllOrders(),
    getStoreSettings(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    products,
    categories,
    orders,
    storeSettings: storeSettings ?? {},
  };
}

/** Convert numeric ms to Firestore Timestamp for restore */
function toTimestamp(value: unknown): unknown {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return Timestamp.fromMillis(value);
  }
  if (value != null && typeof value === 'object' && 'seconds' in (value as object)) {
    const v = value as { seconds: number; nanoseconds?: number };
    return Timestamp.fromMillis(v.seconds * 1000 + ((v.nanoseconds ?? 0) / 1e6));
  }
  return value;
}

/** Write product with given id (for restore). Omits id from body; converts createdAt/updatedAt to Timestamp. */
export async function setProductWithId(id: string, data: Product): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const { id: _id, ...rest } = data;
  const payload: Record<string, unknown> = { ...omitUndefined(rest as Record<string, unknown>) };
  if (payload.createdAt != null) payload.createdAt = toTimestamp(payload.createdAt);
  if (payload.updatedAt != null) payload.updatedAt = toTimestamp(payload.updatedAt);
  await setDoc(doc(db, PRODUCTS, id), payload);
}

/** Write category with given id (for restore). */
export async function setCategoryWithId(id: string, data: Category): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const { id: _id, ...rest } = data;
  await setDoc(doc(db, CATEGORIES, id), omitUndefined(rest as Record<string, unknown>));
}

/** Write order with given id (for restore). Converts createdAt to Timestamp. */
export async function setOrderWithId(id: string, data: Order): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const { id: _id, ...rest } = data;
  const payload: Record<string, unknown> = { ...omitUndefined(rest as Record<string, unknown>) };
  if (payload.createdAt != null) payload.createdAt = toTimestamp(payload.createdAt);
  await setDoc(doc(db, ORDERS, id), payload);
}

/** Overwrite store settings from backup. */
export async function setStoreSettingsFromBackup(settings: StoreSettings): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const ref = doc(db, STORE_SETTINGS, SETTINGS_DOC_ID);
  await setDoc(ref, omitUndefined(settings as Record<string, unknown>));
}

/** Delete all documents in a collection (for full replace before restore). */
async function deleteAllInCollection(collectionName: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const snap = await getDocs(collection(db, collectionName));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

/** Restore full DB from backup. Replaces all products, categories, orders, and settings. */
export async function restoreBackup(backup: BackupData): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');

  await deleteAllInCollection(PRODUCTS);
  await deleteAllInCollection(CATEGORIES);
  await deleteAllInCollection(ORDERS);

  for (const cat of backup.categories ?? []) {
    if (cat?.id) await setCategoryWithId(cat.id, cat);
  }
  for (const product of backup.products ?? []) {
    if (product?.id) await setProductWithId(product.id, product);
  }
  for (const order of backup.orders ?? []) {
    if (order?.id) await setOrderWithId(order.id, order);
  }
  if (backup.storeSettings && typeof backup.storeSettings === 'object') {
    await setStoreSettingsFromBackup(backup.storeSettings);
  }
}
