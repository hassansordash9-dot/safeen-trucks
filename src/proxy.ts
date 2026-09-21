import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales } from '@/i18n/config';
import { refreshSession } from '@/lib/supabase/middleware';

const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|webp|avif|ico|txt|xml|json|webmanifest)$/;

function pickLocale(request: NextRequest): string {
  const cookie = request.cookies.get('locale')?.value;
  if (cookie && (locales as readonly string[]).includes(cookie)) return cookie;

  const header = request.headers.get('accept-language')?.toLowerCase() ?? '';
  if (header.includes('ckb') || header.includes('ku')) return 'ku';
  if (header.includes('ar')) return 'ar';
  return defaultLocale;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api') || pathname.startsWith('/auth') || PUBLIC_FILE.test(pathname)) {
    return refreshSession(request, NextResponse.next({ request }));
  }

  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (!hasLocale) {
    const locale = pickLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  return refreshSession(request, NextResponse.next({ request }));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
