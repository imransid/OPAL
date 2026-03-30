import { doc, setDoc } from 'firebase/firestore';
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';

import { getServerDb } from '@/lib/firebase-server';

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

export async function GET() {
  const db = getServerDb();
  if (!db) {
    return NextResponse.json(
      {
        error: 'Firebase not configured',
        hint: 'Add Firebase config to .env (NEXT_PUBLIC_FIREBASE_* or PUBLIC_FIREBASE_*). Restart the dev server.',
      },
      { status: 503 }
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
    return NextResponse.json(
      { error: 'Failed to create admin user', detail: String(e) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Admin user created',
    user: {
      name: SEED_ADMIN.name,
      number: SEED_ADMIN.number,
      email: SEED_ADMIN.email,
      role: SEED_ADMIN.role,
    },
  });
}
