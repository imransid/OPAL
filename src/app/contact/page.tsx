import type { Metadata } from 'next';

import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import ContactPageContent from '@/components/data/ContactPageContent';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Contact Us — OPAL | Get in Touch',
  description:
    "Have a question or need help? Contact OPAL. We're here for you. Send a message and we'll get back to you as soon as we can.",
  path: '/contact',
});

export default function ContactPage() {
  return (
    <main>
      <Navbar />
      <ContactPageContent />
      <Footer />
    </main>
  );
}
