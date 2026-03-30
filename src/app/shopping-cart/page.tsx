import type { Metadata } from 'next';

import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import CartFirebaseWrapper from '@/components/data/CartFirebaseWrapper';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Shopping Cart — OPAL',
  description: 'Review your cart and proceed to checkout. OPAL — curated products, secure checkout.',
  path: '/shopping-cart',
  noindex: true,
});

export default function ShoppingCartPage() {
  return (
    <main>
      <Navbar />
      <CartFirebaseWrapper />
      <Footer />
    </main>
  );
}
