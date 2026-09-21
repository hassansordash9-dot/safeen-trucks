import { createClient } from '@/lib/supabase/server';
import { getBrands, getLocations, getPartCategories } from '@/lib/reference';
import { PAGE_SIZE, pageOffset } from '@/features/trucks/filters';
import type { PartFilters } from './filters';
import type { Paginated, Part } from '@/types';

const CARD_SELECT = `
  id, slug, title, price, currency, condition, status, featured, part_number, oem_number,
  created_at, published_at,
  category:part_categories(id, slug, name_en, name_ku, name_ar),
  location:locations(id, country_code, governorate, slug, name_en, name_ku, name_ar),
  images:part_images(id, path, sort_order, is_primary)
`;

const DETAIL_SELECT = `
  *,
  category:part_categories(id, slug, name_en, name_ku, name_ar),
  compatible_brand:truck_brands(id, slug, name, logo_url),
  location:locations(id, country_code, governorate, slug, name_en, name_ku, name_ar),
  images:part_images(id, path, sort_order, is_primary),
  dealer:dealers(id, slug, business_name, logo_url, verified),
  seller:profiles!parts_seller_id_fkey(id, full_name, created_at)
`;

export async function searchParts(filters: PartFilters): Promise<Paginated<Part>> {
  const supabase = await createClient();
  const [categories, brands, locations] = await Promise.all([
    getPartCategories(),
    getBrands(),
    getLocations(),
  ]);

  let query = supabase
    .from('parts')
    .select(CARD_SELECT, { count: 'exact' })
    .eq('status', 'published');

  if (filters.q) {
    const term = filters.q.replace(/[%,()]/g, '');
    query = query.or(
      `title.ilike.%${term}%,part_number.ilike.%${term}%,oem_number.ilike.%${term}%`,
    );
  }

  const categoryId = categories.find((c) => c.slug === filters.category)?.id;
  if (filters.category) {
    query = query.eq('category_id', categoryId ?? '00000000-0000-0000-0000-000000000000');
  }

  const brandId = brands.find((b) => b.slug === filters.compatibleBrand)?.id;
  if (filters.compatibleBrand && brandId) query = query.eq('compatible_brand_id', brandId);
  if (filters.compatibleModel) {
    query = query.contains('compatible_models', [filters.compatibleModel]);
  }

  const locationId = locations.find((l) => l.slug === filters.location)?.id;
  if (filters.location && locationId) query = query.eq('location_id', locationId);

  if (filters.condition) query = query.eq('condition', filters.condition);
  if (filters.partType) query = query.eq('part_type', filters.partType);
  if (filters.priceFrom) query = query.gte('price', filters.priceFrom);
  if (filters.priceTo) query = query.lte('price', filters.priceTo);

  query = query.order('featured', { ascending: false });
  if (filters.sort === 'price_asc') query = query.order('price', { ascending: true });
  else if (filters.sort === 'price_desc') query = query.order('price', { ascending: false });
  else query = query.order('published_at', { ascending: false, nullsFirst: false });

  const [from, to] = pageOffset(filters.page);
  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []) as unknown as Part[],
    total: count ?? 0,
    page: filters.page,
    pageSize: PAGE_SIZE,
  };
}

export async function getPartBySlug(slug: string): Promise<Part | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('parts').select(DETAIL_SELECT).eq('slug', slug).maybeSingle();
  return (data as unknown as Part) ?? null;
}

export async function getPartById(id: string): Promise<Part | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('parts').select(DETAIL_SELECT).eq('id', id).maybeSingle();
  return (data as unknown as Part) ?? null;
}

export async function getSellerParts(sellerId: string): Promise<Part[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('parts')
    .select(CARD_SELECT)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as Part[];
}

export async function getDealerParts(dealerId: string, limit = 24): Promise<Part[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('parts')
    .select(CARD_SELECT)
    .eq('dealer_id', dealerId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Part[];
}

export async function getSimilarParts(part: Part, limit = 4): Promise<Part[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('parts')
    .select(CARD_SELECT)
    .eq('status', 'published')
    .eq('category_id', part.category_id)
    .neq('id', part.id)
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Part[];
}
