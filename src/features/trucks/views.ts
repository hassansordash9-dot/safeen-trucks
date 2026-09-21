import 'server-only';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ListingKind } from '@/types';

/** Counts a listing view without blocking the response. Best-effort. */
export async function registerView(kind: ListingKind, listingId: string): Promise<void> {
  after(async () => {
    try {
      const supabase = await createClient();
      await supabase.rpc('bump_views', { kind, listing: listingId });
      await supabase
        .from('contact_events')
        .insert({ listing_kind: kind, listing_id: listingId, event_type: 'view' });
    } catch {
      // View counting must never break a listing page.
    }
  });
}
