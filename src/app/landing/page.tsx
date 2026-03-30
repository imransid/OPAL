import type { Metadata } from 'next';

import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import CardCategory from '@/components/products/cardCategory';
import ProductFeature from '@/components/products/productFeature';
import PromoSectionLarge from '@/components/promo/promoSectionLarge';
import TestimonialsFade from '@/components/promo/testimonialsFade';
import { pageMetadata, SEO } from '@/lib/seo';

import data from '../../../public/data.json';

export const metadata: Metadata = pageMetadata({
  title: 'OPAL Collection — Curated Products | Shop Now',
  description:
    'Discover our latest collection at OPAL. Shop by category, explore featured products, and find quality items for every moment.',
  path: '/landing',
  image: SEO.defaultImage,
});

export default function LandingPage() {
  const products = data.products as Array<{
    full_description: string;
    images: { src: string; alt: string }[];
    featuresDetails: Record<string, string>;
  }>;
  const categories = data.categories as Array<{
    thumb_src: string;
    collection: string;
    title: string;
  }>;

  return (
    <main>
      <Navbar />
      <PromoSectionLarge
        title="Collection is here"
        full_description={products[0].full_description}
        pageHeaderBgImg="/images/bg2.jpg"
        pageHeaderMinVh="90vh"
        pageHeaderRadius="0"
      />
      <div className="container my-5">
        <div className="d-block text-center mb-5">
          <h3>Shop by category</h3>
          <a className="text-dark font-weight-bold" href="/shop">
            Browse all categories &#62;
          </a>
        </div>
        <div className="row mb-5">
          {categories.slice(0, 4).map((category, i) => (
            <div className="col-md-6 col-lg-3" key={i}>
              <CardCategory
                thumb_src={category.thumb_src}
                collection={category.collection}
                title={category.title}
              />
            </div>
          ))}
        </div>

        <PromoSectionLarge
          title="Basic Starter Pack"
          full_description={products[0].full_description}
          pageHeaderBgImg="/images/bg2.jpg"
          pageHeaderMinVh="50vh"
          pageHeaderRadius="1rem"
        />
        <div className="my-5">
          <ProductFeature
            title="Product Features"
            images={products[2].images}
            full_description="Society has put up so many boundaries, so many limitations on what's right and wrong that it's almost impossible"
            featuresDetails={products[0].featuresDetails}
          />
        </div>
        <div className="mt-5 mb-10">
          <TestimonialsFade
            pageHeaderBgImg="https://images.unsplash.com/photo-1519642918688-7e43b19245d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2676&q=80"
            pageHeaderMinVh="50vh"
          />
        </div>

        <Footer />
      </div>
    </main>
  );
}
