/**
 * Server-only Firebase init (for API routes). Uses env from import.meta.env or process.env.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

function getEnv(key: string): string {
  const v = import.meta.env[key];
  if (v != null && String(v).trim() !== '') return String(v).trim();
  const p = typeof process !== 'undefined' && process.env && process.env[key];
  if (p != null && String(p).trim() !== '') return String(p).trim();
  return '';
}

const firebaseConfig = () => ({
  apiKey: getEnv('PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnv('PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('PUBLIC_FIREBASE_APP_ID'),
});

let _db: ReturnType<typeof getFirestore> | null = null;

export function getServerDb() {
  const config = firebaseConfig();
  if (!config.projectId) return null;
  if (!_db) {
    const app = initializeApp(config);
    _db = getFirestore(app);
  }
  return _db;
}
