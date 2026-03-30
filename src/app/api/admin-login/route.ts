import { doc, getDoc } from 'firebase/firestore';
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';

import { getServerDb } from '@/lib/firebase-server';

const USERS_COLLECTION = 'users';

function hashPassword(password: string): string {
  return createHash('sha256').update(password, 'utf8').digest('hex');
}

function emailToDocId(email: string): string {
  return email.trim().toLowerCase().replace(/\./g, '_');
}

async function parseBody(request: Request): Promise<{ email?: string; password?: string }> {
  const contentType = (request.headers.get('content-type') ?? '').toLowerCase();

  if (contentType.includes('application/json')) {
    try {
      const text = await request.text();
      const json = JSON.parse(text) as Record<string, unknown>;
      return {
        email: typeof json?.email === 'string' ? json.email : undefined,
        password: typeof json?.password === 'string' ? json.password : undefined,
      };
    } catch {
      return {};
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const text = await request.text();
      const params = new URLSearchParams(text);
      return {
        email: params.get('email') ?? undefined,
        password: params.get('password') ?? undefined,
      };
    } catch {
      return {};
    }
  }

  if (contentType.includes('multipart/form-data')) {
    try {
      const form = await request.formData();
      const email = form.get('email');
      const password = form.get('password');
      return {
        email: typeof email === 'string' ? email : undefined,
        password: typeof password === 'string' ? password : undefined,
      };
    } catch {
      return {};
    }
  }

  try {
    const text = await request.text();
    if (text.trim().startsWith('{')) {
      const json = JSON.parse(text) as Record<string, unknown>;
      return {
        email: typeof json?.email === 'string' ? json.email : undefined,
        password: typeof json?.password === 'string' ? json.password : undefined,
      };
    }
    const params = new URLSearchParams(text);
    return {
      email: params.get('email') ?? undefined,
      password: params.get('password') ?? undefined,
    };
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await parseBody(request);
  } catch {
    return NextResponse.json({ error: 'Could not read request body' }, { status: 400 });
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const db = getServerDb();
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 });
  }

  const userRef = doc(db, USERS_COLLECTION, emailToDocId(email));
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const user = snap.data();
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const passwordHash = user.passwordHash;
  if (typeof passwordHash !== 'string' || hashPassword(password) !== passwordHash) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: { name: user.name, email: user.email, role: user.role },
  });
}
