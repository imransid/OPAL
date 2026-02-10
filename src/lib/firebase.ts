import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

function getApp() {
  if (typeof window === 'undefined') return null;
  const apps = getApps();
  if (apps.length > 0) return apps[0];
  return initializeApp(firebaseConfig);
}

// Lazy init so it only runs in browser
let _db: ReturnType<typeof getFirestore> | null = null;

export function getDb() {
  if (typeof window === 'undefined') return null;
  if (!_db) {
    const app = getApp();
    if (!app || !import.meta.env.PUBLIC_FIREBASE_PROJECT_ID) return null;
    _db = getFirestore(app);
  }
  return _db;
}

export { getApp };
