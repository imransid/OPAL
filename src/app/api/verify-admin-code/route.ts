import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

import { getServerDb } from '@/lib/firebase-server';

const ADMIN_CODES = 'adminLoginCodes';

function docId(email: string): string {
  return email.trim().toLowerCase().replace(/\./g, '_');
}

async function parseBody(request: Request): Promise<{ email?: string; code?: string }> {
  const contentType = (request.headers.get('content-type') ?? '').toLowerCase();
  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    const form = await request.formData();
    return {
      email: (form.get('email') as string) ?? undefined,
      code: (form.get('code') as string) ?? undefined,
    };
  }
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as { email?: string; code?: string };
  } catch {
    const params = new URLSearchParams(text);
    return {
      email: params.get('email') ?? undefined,
      code: params.get('code') ?? undefined,
    };
  }
}

export async function POST(request: Request) {
  let body: { email?: string; code?: string };
  try {
    body = await parseBody(request);
  } catch {
    return NextResponse.json({ error: 'Could not read request body' }, { status: 400 });
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';

  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
  }

  const db = getServerDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const ref = doc(db, ADMIN_CODES, docId(email));
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return NextResponse.json({ error: 'Code expired or invalid' }, { status: 400 });
  }

  const data = snap.data();
  const storedCode = data?.code;
  const expiresAt = data?.expiresAt;

  if (Date.now() > (expiresAt || 0)) {
    await deleteDoc(ref);
    return NextResponse.json({ error: 'Code expired' }, { status: 400 });
  }

  if (storedCode !== code) {
    return NextResponse.json({ error: 'Incorrect code' }, { status: 400 });
  }

  await deleteDoc(ref);

  return NextResponse.json({ ok: true });
}
