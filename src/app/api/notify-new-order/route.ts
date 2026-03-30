import { NextResponse } from 'next/server';

import { sendOrderNotifyEmail, type OrderNotifyPayload } from '@/lib/order-notify-email';

export const runtime = 'nodejs';

const MAX_ITEMS = 80;
const MAX_STR = 2000;

function clampStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function parsePayload(body: unknown): OrderNotifyPayload | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const orderNumber = clampStr(o.orderNumber, 64);
  if (!orderNumber) return null;

  const contact = o.contact;
  if (!contact || typeof contact !== 'object') return null;
  const c = contact as Record<string, unknown>;
  const email = clampStr(c.email, 320);
  const phone = clampStr(c.phone, 64);
  if (!email || !phone) return null;

  const shipping = o.shipping;
  if (!shipping || typeof shipping !== 'object') return null;
  const s = shipping as Record<string, unknown>;
  const address = clampStr(s.address, MAX_STR);
  if (!address) return null;

  const itemsRaw = o.items;
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0 || itemsRaw.length > MAX_ITEMS) return null;

  const items: OrderNotifyPayload['items'] = [];
  for (const row of itemsRaw) {
    if (!row || typeof row !== 'object') return null;
    const it = row as Record<string, unknown>;
    const title = clampStr(it.title, 500);
    const quantity = typeof it.quantity === 'number' && Number.isFinite(it.quantity) ? Math.max(1, Math.floor(it.quantity)) : 0;
    const price = typeof it.price === 'number' && Number.isFinite(it.price) ? it.price : NaN;
    const subtotal = typeof it.subtotal === 'number' && Number.isFinite(it.subtotal) ? it.subtotal : NaN;
    if (!title || quantity < 1 || Number.isNaN(price) || Number.isNaN(subtotal)) return null;
    items.push({
      title,
      quantity,
      price,
      subtotal,
      color: clampStr(it.color, 120) || undefined,
      size: clampStr(it.size, 120) || undefined,
    });
  }

  const subtotal = typeof o.subtotal === 'number' && Number.isFinite(o.subtotal) ? o.subtotal : NaN;
  const shippingCost = typeof o.shippingCost === 'number' && Number.isFinite(o.shippingCost) ? o.shippingCost : NaN;
  const total = typeof o.total === 'number' && Number.isFinite(o.total) ? o.total : NaN;
  const currency = clampStr(o.currency, 8) || '৳';
  const pm = clampStr(o.paymentMethod, 16);
  if (!pm || Number.isNaN(subtotal) || Number.isNaN(shippingCost) || Number.isNaN(total)) return null;

  return {
    orderNumber,
    contact: { email, phone },
    shipping: {
      address,
      city: clampStr(s.city, 200) || undefined,
      state: clampStr(s.state, 200) || undefined,
      postalCode: clampStr(s.postalCode, 64) || undefined,
    },
    items,
    subtotal,
    shippingCost,
    total,
    currency,
    paymentMethod: pm,
  };
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = parsePayload(json);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 });
  }

  try {
    await sendOrderNotifyEmail(payload);
  } catch (e) {
    console.error('[notify-new-order]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to send notification' },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
