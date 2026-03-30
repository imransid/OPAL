import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Client-side Firebase config. Each field MUST use literal `process.env.NEXT_PUBLIC_*`
 * so Next.js can inline values at build time. Dynamic `process.env[key]` is NOT inlined
 * and becomes undefined in the browser bundle.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

function getAppInstance() {
  if (typeof window === 'undefined') return null;
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[opal] Firebase client: missing NEXT_PUBLIC_FIREBASE_* in env. Add them to .env and restart `next dev`.'
      );
    }
    return null;
  }
  const apps = getApps();
  if (apps.length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

let _db: ReturnType<typeof getFirestore> | null = null;

export function getDb() {
  if (typeof window === 'undefined') return null;
  if (!_db) {
    const app = getAppInstance();
    if (!app) return null;
    _db = getFirestore(app);
  }
  return _db;
}

export { getAppInstance as getApp };
