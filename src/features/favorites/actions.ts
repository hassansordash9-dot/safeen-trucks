'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ListingKind } from '@/types';

export type FavoriteResult = { ok: true; favorited: boolean } | { ok: false; reason: 'auth' | 'error' };

export async function toggleFavorite(
  kind: ListingKind,
  listingId: string,
): Promise<FavoriteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'auth' };

  const { data: existing } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', user.id)
    .eq('listing_kind', kind)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_kind', kind)
      .eq('listing_id', listingId);
    if (error) return { ok: false, reason: 'error' };
    revalidatePath('/[locale]/saved', 'page');
    return { ok: true, favorited: false };
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, listing_kind: kind, listing_id: listingId });
  if (error) return { ok: false, reason: 'error' };

  await supabase
    .from('contact_events')
    .insert({ listing_kind: kind, listing_id: listingId, user_id: user.id, event_type: 'favorite' });

  revalidatePath('/[locale]/saved', 'page');
  return { ok: true, favorited: true };
}
