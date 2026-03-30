import type { Metadata } from 'next';

import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import OrderTrackContent from '@/components/orders/OrderTrackContent';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Track Your Order — OPAL',
  description: 'Track your OPAL order status. Enter your order number to see shipping and delivery updates.',
  path: '/orders/track',
});

export default function TrackOrderPage() {
  return (
    <main>
      <Navbar />
      <OrderTrackContent />
      <Footer />
    </main>
  );
}
