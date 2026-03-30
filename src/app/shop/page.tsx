import type { Metadata } from 'next';

import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import ShopFirebaseContent from '@/components/data/ShopFirebaseContent';
import { pageMetadata, SEO } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Shop — OPAL | Fashion, Tech & Gear',
  description:
    'Browse the full OPAL collection: fashion, tech, and accessories. Filter by category, sort by price or newest — secure checkout.',
  path: '/shop',
  image: SEO.defaultImage,
});

export default function ShopPage() {
  return (
    <main>
      <Navbar />
      <ShopFirebaseContent />
      <Footer />
    </main>
  );
}
