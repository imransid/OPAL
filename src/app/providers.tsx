'use client';

import type { ReactNode } from 'react';
import ToastContainer from '@/components/ui/ToastContainer';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
