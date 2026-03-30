import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** Legacy `/product?id=` → `/product/:id` (308). Bare `/product` → `/shop`. */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  if (pathname !== '/product' && pathname !== '/product/') {
    return NextResponse.next();
  }
  const rawId = url.searchParams.get('id');
  const id = rawId?.trim();
  if (id) {
    url.pathname = `/product/${encodeURIComponent(id)}`;
    url.search = '';
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.redirect(new URL('/shop', request.url), 308);
}

export const config = {
  matcher: ['/product', '/product/'],
};
