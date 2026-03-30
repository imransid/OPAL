import type { Metadata } from 'next';

import AdminGate from '@/components/admin/AdminGate';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Admin — OPAL',
  description: 'Admin panel',
  path: '/admin',
  noindex: true,
});

export default function AdminPage() {
  const adminEmail =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    process.env.PUBLIC_ADMIN_EMAIL ||
    'emailofimran1992@gmail.com';

  return <AdminGate adminEmail={adminEmail} />;
}
