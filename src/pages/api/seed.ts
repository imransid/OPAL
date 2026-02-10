import type { APIRoute } from 'astro';
import { doc, setDoc } from 'firebase/firestore';
import { getServerDb } from '../../lib/firebase-server';
import { createHash } from 'node:crypto';

const USERS_COLLECTION = 'users';

const SEED_ADMIN = {
  name: 'Imran',
  number: '01620995203',
  email: 'emailofimran1992@gmail.com',
  password: 'I343406k',
  role: 'admin' as const,
};

function hashPassword(password: string): string {
  return createHash('sha256').update(password, 'utf8').digest('hex');
}

function emailToDocId(email: string): string {
  return email.trim().toLowerCase().replace(/\./g, '_');
}

export const GET: APIRoute = async () => {
  const db = getServerDb();
  if (!db) {
    return new Response(
      JSON.stringify({
        error: 'Firebase not configured',
        hint: 'Add your Firebase config to a .env file in the project root (see .env.example). Required: PUBLIC_FIREBASE_API_KEY, PUBLIC_FIREBASE_AUTH_DOMAIN, PUBLIC_FIREBASE_PROJECT_ID, PUBLIC_FIREBASE_STORAGE_BUCKET, PUBLIC_FIREBASE_MESSAGING_SENDER_ID, PUBLIC_FIREBASE_APP_ID. Then restart the dev server.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const userId = emailToDocId(SEED_ADMIN.email);
  const userRef = doc(db, USERS_COLLECTION, userId);

  try {
    await setDoc(userRef, {
      name: SEED_ADMIN.name,
      number: SEED_ADMIN.number,
      email: SEED_ADMIN.email.toLowerCase(),
      passwordHash: hashPassword(SEED_ADMIN.password),
      role: SEED_ADMIN.role,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Seed failed:', e);
    return new Response(
      JSON.stringify({ error: 'Failed to create admin user', detail: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: 'Admin user created',
      user: {
        name: SEED_ADMIN.name,
        number: SEED_ADMIN.number,
        email: SEED_ADMIN.email,
        role: SEED_ADMIN.role,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
