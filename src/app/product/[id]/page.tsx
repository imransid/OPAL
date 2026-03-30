import type { Metadata } from 'next';

import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import ProductPageFirebase from '@/components/data/ProductPageFirebase';
import JsonLd from '@/components/seo/JsonLd';
import { buildProductPageJsonLd } from '@/lib/product-jsonld';
import { productPath } from '@/lib/productPath';
import { getCategoryServer, getProductServer } from '@/lib/firestore-server';
import { pageMetadata, SEO } from '@/lib/seo';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId || '').trim();
  const path = productPath(id);
  const product = id ? await getProductServer(id) : null;

  if (!product) {
    return pageMetadata({
      title: 'Product not found',
      description: 'This product is no longer available. Browse the OPAL shop for more.',
      path,
      noindex: true,
    });
  }

  const description = (
    product.shortDescription ||
    product.description ||
    `Buy ${product.title} at OPAL. Quality product, secure checkout, fast delivery.`
  )
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

  const image = product.thumb_src || product.images?.[0]?.src || SEO.defaultImage;
  const baseMeta = pageMetadata({
    title: `${product.title}${product.brand ? ` | ${product.brand}` : ''}`,
    description,
    path,
    image,
    imageAlt: product.thumb_alt ?? product.title,
  });

  return {
    ...baseMeta,
    openGraph: {
      ...baseMeta.openGraph,
      type: 'website',
    },
  };
}

export default async function ProductByIdPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId || '').trim();
  const product = id ? await getProductServer(id) : null;
  const site = getSiteUrl();
  const canonicalPath = productPath(id);

  const category =
    product?.categoryId ? await getCategoryServer(product.categoryId) : null;
  const categoryName = category?.title;

  const jsonLd =
    product && id
      ? buildProductPageJsonLd({
          product,
          site,
          canonicalPath,
          categoryName,
          categoryId: product.categoryId,
        })
      : null;

  return (
    <main>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <Navbar />
      <ProductPageFirebase productId={id} />
      <Footer />
    </main>
  );
}
