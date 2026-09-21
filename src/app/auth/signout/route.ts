import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultLocale, isLocale } from '@/i18n/config';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const form = await request.formData().catch(() => null);
  const raw = form?.get('locale');
  const locale = typeof raw === 'string' && isLocale(raw) ? raw : defaultLocale;

  return NextResponse.redirect(new URL(`/${locale}`, request.url), { status: 303 });
}
