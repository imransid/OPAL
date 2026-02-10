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
import type { Product, Category, StoreSettings, Order, OrderItem } from './types';

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

export async function getProducts(): Promise<Product[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, PRODUCTS), orderBy('title')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
}

export async function getProduct(id: string): Promise<Product | null> {
  const db = getDb();
  if (!db) return null;
  const ref = doc(db, PRODUCTS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
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
