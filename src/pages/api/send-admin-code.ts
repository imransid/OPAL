import type { APIRoute } from 'astro';
import { doc, setDoc } from 'firebase/firestore';
import { getServerDb } from '../../lib/firebase-server';
import { Resend } from 'resend';

const ADMIN_CODES = 'adminLoginCodes';
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 min

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Sanitize email for use as Firestore doc id (no dots in path)
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

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: string };
  try {
    body = await parseBody(request);
  } catch {
    return new Response(JSON.stringify({ error: 'Could not read request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const allowedEmail = (import.meta.env.ADMIN_EMAIL || import.meta.env.PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!allowedEmail || email !== allowedEmail) {
    return new Response(JSON.stringify({ error: 'This email is not registered for admin access' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resendKey = import.meta.env.RESEND_API_KEY;
  const fromEmail = import.meta.env.RESEND_FROM_EMAIL || 'OPAL Admin <emailofimran1992@gmail.com>';

  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'Email not configured (RESEND_API_KEY)' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const code = generateCode();
  const expiresAt = Date.now() + CODE_EXPIRY_MS;

  const db = getServerDb();
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await setDoc(doc(db, ADMIN_CODES, docId(email)), { code, expiresAt });
  } catch (e) {
    console.error('Firestore setDoc:', e);
    return new Response(JSON.stringify({ error: 'Failed to save code' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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
    return new Response(JSON.stringify({ error: error.message || 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
