import type { APIRoute } from 'astro';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getServerDb } from '../../lib/firebase-server';

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

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: string; code?: string };
  try {
    body = await parseBody(request);
  } catch {
    return new Response(JSON.stringify({ error: 'Could not read request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';

  if (!email || !code) {
    return new Response(JSON.stringify({ error: 'Email and code required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getServerDb();
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ref = doc(db, ADMIN_CODES, docId(email));
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return new Response(JSON.stringify({ error: 'Code expired or invalid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = snap.data();
  const storedCode = data?.code;
  const expiresAt = data?.expiresAt;

  if (Date.now() > (expiresAt || 0)) {
    await deleteDoc(ref);
    return new Response(JSON.stringify({ error: 'Code expired' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (storedCode !== code) {
    return new Response(JSON.stringify({ error: 'Incorrect code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await deleteDoc(ref);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
