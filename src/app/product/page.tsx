import type { Metadata } from 'next';

import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import ProductPageFirebase from '@/components/data/ProductPageFirebase';
import JsonLd from '@/components/seo/JsonLd';
import { getProductServer } from '@/lib/firestore-server';
import { fullUrl, pageMetadata, SEO } from '@/lib/seo';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ id?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id = '' } = await searchParams;
  const product = id ? await getProductServer(id) : null;
  if (!product) {
    return pageMetadata({
      title: 'Product — OPAL',
      description: 'Shop quality products at OPAL.',
      path: '/product',
      noindex: true,
    });
  }
  const description = (
    product.shortDescription ||
    product.description ||
    `Buy ${product.title} at OPAL. Quality product, secure checkout, fast delivery.`
  ).slice(0, 160);
  const image = product.thumb_src || product.images?.[0]?.src || SEO.defaultImage;
  return pageMetadata({
    title: `${product.title}${product.brand ? ` | ${product.brand}` : ''}`,
    description,
    path: `/product?id=${encodeURIComponent(id)}`,
    image,
    imageAlt: product.thumb_alt ?? product.title,
  });
}

export default async function ProductPage({ searchParams }: Props) {
  const { id = '' } = await searchParams;
  const product = id ? await getProductServer(id) : null;
  const description = product
    ? (
        product.shortDescription ||
        product.description ||
        `Buy ${product.title} at OPAL. Quality product, secure checkout, fast delivery.`
      ).slice(0, 160)
    : 'Shop quality products at OPAL.';
  const image = product?.thumb_src || product?.images?.[0]?.src || '/images/opal1.jpg';
  const site = getSiteUrl();

  const productJsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description,
        image: image.startsWith('http') ? image : fullUrl(image, site),
        ...(product.price != null && {
          offers: {
            '@type': 'Offer',
            price: product.discountPrice ?? product.price,
            priceCurrency: product.currency ?? 'BDT',
            availability:
              product.stock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        }),
        ...(product.brand && { brand: { '@type': 'Brand', name: product.brand } }),
      }
    : null;

  return (
    <main>
      {productJsonLd ? <JsonLd data={productJsonLd} /> : null}
      <Navbar />
      <ProductPageFirebase productId={id} />
      <Footer />
    </main>
  );
}
