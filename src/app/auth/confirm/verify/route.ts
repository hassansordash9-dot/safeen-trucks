import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/env';
import { defaultLocale } from '@/i18n/config';

/** Redeems a confirmation token only after an intentional form submission. */
export async function POST(request: NextRequest) {
  const data = await request.formData();
  const tokenHash = String(data.get('token_hash') ?? '');
  const destination = new URL(`/${defaultLocale}/login`, request.url);
  const response = NextResponse.redirect(destination);

  if (!tokenHash) {
    destination.searchParams.set('error', 'auth');
    response.headers.set('Location', destination.toString());
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });

  if (error) {
    destination.searchParams.set('error', 'auth');
    response.headers.set('Location', destination.toString());
    return response;
  }

  destination.searchParams.set('confirmed', '1');
  response.headers.set('Location', destination.toString());
  return response;
}
