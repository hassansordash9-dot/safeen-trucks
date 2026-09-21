import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { ListingKind, Part, Truck } from '@/types';

/** Ids the current user has favourited, so lists can render the heart state in one query. */
export const getFavoriteIds = cache(async (kind: ListingKind): Promise<Set<string>> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', user.id)
    .eq('listing_kind', kind);

  return new Set((data ?? []).map((row: { listing_id: string }) => row.listing_id));
});

export async function getFavorites(): Promise<{ trucks: Truck[]; parts: Part[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { trucks: [], parts: [] };

  const { data } = await supabase
    .from('favorites')
    .select('listing_kind, listing_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const rows = (data ?? []) as Array<{ listing_kind: ListingKind; listing_id: string }>;
  const truckIds = rows.filter((r) => r.listing_kind === 'truck').map((r) => r.listing_id);
  const partIds = rows.filter((r) => r.listing_kind === 'part').map((r) => r.listing_id);

  const [trucks, parts] = await Promise.all([
    truckIds.length
      ? supabase
          .from('trucks')
          .select(
            'id, slug, title, year, mileage_km, price, currency, negotiable, status, featured, verified_listing, brand:truck_brands(id, slug, name, logo_url), location:locations(id, country_code, governorate, slug, name_en, name_ku, name_ar), images:truck_images(id, path, sort_order, is_primary)',
          )
          .in('id', truckIds)
      : Promise.resolve({ data: [] }),
    partIds.length
      ? supabase
          .from('parts')
          .select(
            'id, slug, title, price, currency, condition, status, featured, part_number, oem_number, category:part_categories(id, slug, name_en, name_ku, name_ar), location:locations(id, country_code, governorate, slug, name_en, name_ku, name_ar), images:part_images(id, path, sort_order, is_primary)',
          )
          .in('id', partIds)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    trucks: (trucks.data ?? []) as unknown as Truck[],
    parts: (parts.data ?? []) as unknown as Part[],
  };
}
