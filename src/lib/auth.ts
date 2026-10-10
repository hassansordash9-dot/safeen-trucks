import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';
import { canSell } from './permissions';
export { canSell } from './permissions';

export type SessionUser = { id: string; email: string | null; profile: Profile | null };

/** Cached per request so several components can ask without extra round-trips. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return { id: user.id, email: user.email ?? null, profile: (profile as Profile) ?? null };
});

export async function requireUser(locale: string, returnTo?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : '';
    redirect(`/${locale}/login${next}`);
  }
  return user;
}

export async function requireAdmin(locale: string): Promise<SessionUser> {
  const user = await requireUser(locale, `/${locale}/admin`);
  if (!canSell(user.profile)) redirect(`/${locale}`);
  return user;
}

