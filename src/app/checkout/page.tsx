import type { Metadata } from 'next';

import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import CheckoutFirebaseWrapper from '@/components/data/CheckoutFirebaseWrapper';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Checkout — OPAL',
  description: 'Complete your order. Secure checkout at OPAL.',
  path: '/checkout',
  noindex: true,
});

export default function CheckoutPage() {
  return (
    <main>
      <Navbar />
      <CheckoutFirebaseWrapper />
      <Footer />
    </main>
  );
}
