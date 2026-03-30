import nodemailer from 'nodemailer';

export type OrderNotifyPayload = {
  orderNumber: string;
  contact: { email: string; phone: string };
  shipping: { address: string; city?: string; state?: string; postalCode?: string };
  items: Array<{
    title: string;
    quantity: number;
    price: number;
    subtotal: number;
    color?: string;
    size?: string;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  paymentMethod: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(currency: string, n: number): string {
  return `${currency}${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export async function sendOrderNotifyEmail(payload: OrderNotifyPayload): Promise<void> {
  const user = process.env.EMAIL_USER?.trim();
  const passRaw = process.env.EMAIL_PASS?.trim();
  const pass = passRaw ? passRaw.replace(/\s+/g, '') : '';
  const to =
    process.env.ORDER_NOTIFY_TO?.trim() ||
    process.env.PUBLIC_ADMIN_EMAIL?.trim() ||
    user;

  if (!user || !pass || !to) {
    throw new Error('Order email not configured (EMAIL_USER, EMAIL_PASS, and recipient)');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const lines = payload.items.map((it) => {
    const bits = [escapeHtml(it.title)];
    if (it.color) bits.push(`color: ${escapeHtml(it.color)}`);
    if (it.size) bits.push(`size: ${escapeHtml(it.size)}`);
    return `<li>${bits.join(' · ')} — qty ${it.quantity} × ${formatMoney(payload.currency, it.price)} = <strong>${formatMoney(payload.currency, it.subtotal)}</strong></li>`;
  });

  const ship = payload.shipping;
  const shipBlock = [
    escapeHtml(ship.address),
    [ship.city, ship.state, ship.postalCode].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .map((l) => `<div>${l}</div>`)
    .join('');

  const html = `
    <h2>New order: ${escapeHtml(payload.orderNumber)}</h2>
    <p><strong>Customer</strong><br/>
    Email: ${escapeHtml(payload.contact.email)}<br/>
    Phone: ${escapeHtml(payload.contact.phone)}</p>
    <p><strong>Shipping</strong>${shipBlock}</p>
    <p><strong>Payment</strong> ${escapeHtml(payload.paymentMethod === 'cod' ? 'Cash on delivery' : 'Card')}</p>
    <p><strong>Items</strong></p>
    <ul>${lines.join('')}</ul>
    <p>Subtotal: ${formatMoney(payload.currency, payload.subtotal)}<br/>
    Shipping: ${formatMoney(payload.currency, payload.shippingCost)}<br/>
    <strong>Total: ${formatMoney(payload.currency, payload.total)}</strong></p>
  `;

  await transporter.sendMail({
    from: `OPAL Store <${user}>`,
    to,
    subject: `New order ${payload.orderNumber}`,
    html,
    text: `New order ${payload.orderNumber}\nCustomer: ${payload.contact.email} / ${payload.contact.phone}\nTotal: ${formatMoney(payload.currency, payload.total)}`,
  });
}
