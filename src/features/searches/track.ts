import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { ListingKind } from '@/types';

/**
 * Zero-result searches are the cheapest signal of unmet demand on the marketplace.
 * Best-effort only: a failure here must never break the search page.
 */
export async function recordSearchMiss(
  kind: ListingKind,
  query: string | null,
  filters: Record<string, unknown>,
  locale: string,
): Promise<void> {
  const meaningful = Object.entries(filters).filter(
    ([key, value]) =>
      !['sort', 'page'].includes(key) && value !== undefined && value !== null && value !== '',
  );
  if (!query && meaningful.length === 0) return;

  try {
    const supabase = await createClient();
    await supabase.from('search_misses').insert({
      listing_kind: kind,
      query,
      filters: Object.fromEntries(meaningful.map(([k, v]) => [k, String(v)])),
      locale,
    });
  } catch {
    // Analytics is not worth a failed page render.
  }
}
