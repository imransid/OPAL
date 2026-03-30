/**
 * Server-only Firebase init (for API routes + SSR).
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

function getEnv(key: string, ...fallbacks: string[]): string {
  const keys = [key, ...fallbacks];
  for (const k of keys) {
    const p = process.env[k];
    if (p != null && String(p).trim() !== '') return String(p).trim();
  }
  return '';
}

const firebaseConfig = () => ({
  apiKey: getEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv(
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'PUBLIC_FIREBASE_MESSAGING_SENDER_ID'
  ),
  appId: getEnv('NEXT_PUBLIC_FIREBASE_APP_ID', 'PUBLIC_FIREBASE_APP_ID'),
});

let _db: ReturnType<typeof getFirestore> | null = null;

function getOrCreateApp(): FirebaseApp | null {
  const config = firebaseConfig();
  if (!config.projectId || !config.apiKey) {
    return null;
  }
  try {
    if (getApps().length > 0) {
      return getApp();
    }
    return initializeApp(config);
  } catch (e) {
    try {
      return getApp();
    } catch {
      console.error('[opal] Firebase server init failed:', e);
      return null;
    }
  }
}

export function getServerDb() {
  const app = getOrCreateApp();
  if (!app) return null;
  try {
    if (!_db) {
      _db = getFirestore(app);
    }
    return _db;
  } catch (e) {
    console.error('[opal] getFirestore failed:', e);
    return null;
  }
}
