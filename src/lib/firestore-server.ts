/**
 * Server-side Firestore helpers for SSR (e.g. product meta for SEO).
 * Uses getServerDb from firebase-server.
 */
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getServerDb } from './firebase-server';
import type { Product } from './types';

const PRODUCTS = 'products';

export async function getProductServer(id: string): Promise<Product | null> {
  const db = getServerDb();
  if (!db || !id) return null;
  const ref = doc(db, PRODUCTS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
}

export async function getProductsServer(): Promise<Product[]> {
  const db = getServerDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, PRODUCTS), orderBy('title')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
}
