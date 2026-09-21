import { createClient } from '@/lib/supabase/server';
import type { Dealer } from '@/types';

const DEALER_SELECT = `
  id, owner_id, slug, business_name, description, logo_url, cover_url, phone, whatsapp,
  website, location_id, verified, active, created_at,
  location:locations(id, country_code, governorate, slug, name_en, name_ku, name_ar)
`;

export async function getFeaturedDealers(limit = 8): Promise<Dealer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('dealers')
    .select(DEALER_SELECT)
    .eq('active', true)
    .eq('verified', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Dealer[];
}

export async function listDealers(locationSlug?: string): Promise<Dealer[]> {
  const supabase = await createClient();
  let query = supabase
    .from('dealers')
    .select(DEALER_SELECT)
    .eq('active', true)
    .order('verified', { ascending: false })
    .order('business_name');

  if (locationSlug) {
    const { data: location } = await supabase
      .from('locations')
      .select('id')
      .eq('slug', locationSlug)
      .maybeSingle();
    if (location) query = query.eq('location_id', (location as { id: string }).id);
  }

  const { data } = await query;
  return (data ?? []) as unknown as Dealer[];
}

export async function getDealerBySlug(slug: string): Promise<Dealer | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('dealers')
    .select(DEALER_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  return (data as unknown as Dealer) ?? null;
}

export async function getDealerForOwner(ownerId: string): Promise<Dealer | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('dealers')
    .select(DEALER_SELECT)
    .eq('owner_id', ownerId)
    .maybeSingle();
  return (data as unknown as Dealer) ?? null;
}
