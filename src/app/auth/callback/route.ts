import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultLocale, isLocale } from '@/i18n/config';

/** Email-confirmation and magic-link landing point. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const localeParam = searchParams.get('locale');
  const locale = isLocale(localeParam ?? undefined) ? localeParam! : defaultLocale;
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const target = next?.startsWith('/') ? next : `/${locale}/account`;
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/login?error=auth`);
}
