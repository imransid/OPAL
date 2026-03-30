import type { Metadata } from 'next';

import Footer from '@/components/footer';
import HomePageContent from '@/components/data/HomePageContent';
import Navbar from '@/components/navbar';
import { pageMetadata, SEO } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'OPAL — Fashion × Tech | Curated Apparel & Premium Gear',
  description:
    'Discover curated fashion and tech at OPAL. Editorial-quality apparel, precision devices, secure checkout, and fast delivery.',
  path: '/',
  image: SEO.defaultImage,
  imageAlt: 'OPAL — Fashion and technology curated in one store',
});

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HomePageContent />
      <Footer />
    </main>
  );
}
