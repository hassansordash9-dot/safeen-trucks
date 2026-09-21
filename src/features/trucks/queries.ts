import { createClient } from '@/lib/supabase/server';
import { getBrands, getLocations, getModels, getTruckTypes } from '@/lib/reference';
import { PAGE_SIZE, pageOffset, type TruckFilters, type TruckSort } from './filters';
import type { Paginated, Truck } from '@/types';

const CARD_SELECT = `
  id, slug, title, year, mileage_km, price, currency, negotiable, status, featured,
  verified_listing, views_count, created_at, published_at, dealer_id,
  brand:truck_brands(id, slug, name, logo_url),
  truck_type:truck_types(id, slug, name_en, name_ku, name_ar),
  location:locations(id, country_code, governorate, slug, name_en, name_ku, name_ar),
  images:truck_images(id, path, sort_order, is_primary)
`;

const DETAIL_SELECT = `
  *,
  brand:truck_brands(id, slug, name, logo_url),
  model:truck_models(id, brand_id, slug, name),
  truck_type:truck_types(id, slug, name_en, name_ku, name_ar),
  location:locations(id, country_code, governorate, slug, name_en, name_ku, name_ar),
  images:truck_images(id, path, sort_order, is_primary),
  dealer:dealers(id, slug, business_name, logo_url, verified),
  seller:profiles!trucks_seller_id_fkey(id, full_name, created_at)
`;

function applySort<T extends { order: (col: string, opts?: object) => T }>(query: T, sort: TruckSort): T {
  switch (sort) {
    case 'price_asc':
      return query.order('price', { ascending: true });
    case 'price_desc':
      return query.order('price', { ascending: false });
    case 'mileage':
      return query.order('mileage_km', { ascending: true, nullsFirst: false });
    case 'year':
      return query.order('year', { ascending: false });
    default:
      return query.order('published_at', { ascending: false, nullsFirst: false });
  }
}

export async function searchTrucks(filters: TruckFilters): Promise<Paginated<Truck>> {
  const supabase = await createClient();
  const [brands, models, types, locations] = await Promise.all([
    getBrands(),
    getModels(),
    getTruckTypes(),
    getLocations(),
  ]);

  let query = supabase
    .from('trucks')
    .select(CARD_SELECT, { count: 'exact' })
    .eq('status', 'published');

  if (filters.q) query = query.ilike('title', `%${filters.q}%`);

  const brandId = brands.find((b) => b.slug === filters.brand)?.id;
  if (filters.brand) query = query.eq('brand_id', brandId ?? '00000000-0000-0000-0000-000000000000');

  const modelId = models.find((m) => m.slug === filters.model && m.brand_id === brandId)?.id;
  if (filters.model && modelId) query = query.eq('model_id', modelId);

  const typeId = types.find((t) => t.slug === filters.type)?.id;
  if (filters.type && typeId) query = query.eq('truck_type_id', typeId);

  const locationId = locations.find((l) => l.slug === filters.location)?.id;
  if (filters.location && locationId) query = query.eq('location_id', locationId);

  if (filters.yearFrom) query = query.gte('year', filters.yearFrom);
  if (filters.yearTo) query = query.lte('year', filters.yearTo);
  if (filters.priceFrom) query = query.gte('price', filters.priceFrom);
  if (filters.priceTo) query = query.lte('price', filters.priceTo);
  if (filters.mileageTo) query = query.lte('mileage_km', filters.mileageTo);
  if (filters.hpFrom) query = query.gte('horsepower', filters.hpFrom);
  if (filters.condition) query = query.eq('condition', filters.condition);
  if (filters.transmission) query = query.eq('transmission', filters.transmission);
  if (filters.axle) query = query.eq('axle_configuration', filters.axle);
  if (filters.emission) query = query.eq('emission_class', filters.emission);
  if (filters.seller === 'dealer') query = query.not('dealer_id', 'is', null);
  if (filters.seller === 'private') query = query.is('dealer_id', null);
  if (filters.verified) query = query.eq('verified_listing', true);

  const [from, to] = pageOffset(filters.page);
  query = applySort(query.order('featured', { ascending: false }), filters.sort).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    rows: (data ?? []) as unknown as Truck[],
    total: count ?? 0,
    page: filters.page,
    pageSize: PAGE_SIZE,
  };
}

export async function getTruckBySlug(slug: string): Promise<Truck | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('trucks').select(DETAIL_SELECT).eq('slug', slug).maybeSingle();
  return (data as unknown as Truck) ?? null;
}

export async function getTruckById(id: string): Promise<Truck | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('trucks').select(DETAIL_SELECT).eq('id', id).maybeSingle();
  return (data as unknown as Truck) ?? null;
}

export async function getHomeTrucks(): Promise<{ featured: Truck[]; latest: Truck[] }> {
  const supabase = await createClient();
  const [featured, latest] = await Promise.all([
    supabase
      .from('trucks')
      .select(CARD_SELECT)
      .eq('status', 'published')
      .eq('featured', true)
      .order('published_at', { ascending: false })
      .limit(8),
    supabase
      .from('trucks')
      .select(CARD_SELECT)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(8),
  ]);

  return {
    featured: (featured.data ?? []) as unknown as Truck[],
    latest: (latest.data ?? []) as unknown as Truck[],
  };
}

export async function getSimilarTrucks(truck: Truck, limit = 4): Promise<Truck[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('trucks')
    .select(CARD_SELECT)
    .eq('status', 'published')
    .eq('brand_id', truck.brand_id)
    .neq('id', truck.id)
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Truck[];
}

export async function getSellerTrucks(sellerId: string): Promise<Truck[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('trucks')
    .select(CARD_SELECT)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as Truck[];
}

export async function getDealerTrucks(dealerId: string, limit = 24): Promise<Truck[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('trucks')
    .select(CARD_SELECT)
    .eq('dealer_id', dealerId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Truck[];
}
