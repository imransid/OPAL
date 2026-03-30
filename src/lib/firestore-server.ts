/**
 * Server-side Firestore helpers for SSR (e.g. product meta for SEO).
 * Uses getServerDb from firebase-server.
 */
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getServerDb } from './firebase-server';
import type { Category, Product } from './types';

const PRODUCTS = 'products';
const CATEGORIES = 'categories';

export async function getProductServer(id: string): Promise<Product | null> {
  if (!id) return null;
  try {
    const db = getServerDb();
    if (!db) return null;
    const ref = doc(db, PRODUCTS, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Product;
  } catch (e) {
    console.error('[opal] getProductServer:', e);
    return null;
  }
}

export async function getCategoryServer(id: string): Promise<Category | null> {
  if (!id) return null;
  try {
    const db = getServerDb();
    if (!db) return null;
    const ref = doc(db, CATEGORIES, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Category;
  } catch (e) {
    console.error('[opal] getCategoryServer:', e);
    return null;
  }
}

export async function getProductsServer(): Promise<Product[]> {
  try {
    const db = getServerDb();
    if (!db) return [];
    try {
      const snap = await getDocs(query(collection(db, PRODUCTS), orderBy('title')));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
    } catch (e) {
      console.warn('[opal] getProductsServer: orderBy failed, fallback without order', e);
      const snap = await getDocs(collection(db, PRODUCTS));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
      return list.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' }));
    }
  } catch (e) {
    console.error('[opal] getProductsServer:', e);
    return [];
  }
}
