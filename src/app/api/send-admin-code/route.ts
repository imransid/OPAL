import { doc, setDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

import { getServerDb } from '@/lib/firebase-server';

const ADMIN_CODES = 'adminLoginCodes';
const CODE_EXPIRY_MS = 10 * 60 * 1000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function docId(email: string): string {
  return email.trim().toLowerCase().replace(/\./g, '_');
}

async function parseBody(request: Request): Promise<{ email?: string }> {
  const contentType = (request.headers.get('content-type') ?? '').toLowerCase();
  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    const form = await request.formData();
    const email = form.get('email');
    return typeof email === 'string' ? { email } : {};
  }
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as { email?: string };
  } catch {
    const params = new URLSearchParams(text);
    const email = params.get('email');
    return email != null ? { email } : {};
  }
}

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await parseBody(request);
  } catch {
    return NextResponse.json({ error: 'Could not read request body' }, { status: 400 });
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const allowedEmail = (
    process.env.ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    process.env.PUBLIC_ADMIN_EMAIL ||
    ''
  )
    .trim()
    .toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }
  if (!allowedEmail || email !== allowedEmail) {
    return NextResponse.json({ error: 'This email is not registered for admin access' }, { status: 403 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'OPAL Admin <emailofimran1992@gmail.com>';

  if (!resendKey) {
    return NextResponse.json({ error: 'Email not configured (RESEND_API_KEY)' }, { status: 503 });
  }

  const code = generateCode();
  const expiresAt = Date.now() + CODE_EXPIRY_MS;

  const db = getServerDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    await setDoc(doc(db, ADMIN_CODES, docId(email)), { code, expiresAt });
  } catch (e) {
    console.error('Firestore setDoc:', e);
    return NextResponse.json({ error: 'Failed to save code' }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Your OPAL Admin login code',
    html: `
      <p>Your one-time admin login code is:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>
      <p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (error) {
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
