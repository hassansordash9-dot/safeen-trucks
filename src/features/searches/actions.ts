'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { ListingKind } from '@/types';

const querySchema = z.record(z.string().max(60), z.string().max(120));

export type SaveSearchResult = { ok: true } | { ok: false; reason: 'auth' | 'error' };

export async function saveSearch(
  kind: ListingKind,
  name: string,
  query: Record<string, string>,
): Promise<SaveSearchResult> {
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) return { ok: false, reason: 'error' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'auth' };

  const { error } = await supabase.from('saved_searches').insert({
    user_id: user.id,
    listing_kind: kind,
    name: name.slice(0, 120),
    query: parsed.data,
  });
  if (error) return { ok: false, reason: 'error' };

  revalidatePath('/[locale]/account/searches', 'page');
  return { ok: true };
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('saved_searches').delete().eq('id', id);
  revalidatePath('/[locale]/account/searches', 'page');
}
