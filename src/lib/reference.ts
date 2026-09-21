import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { LocationRow, PartCategory, TruckBrand, TruckModel, TruckType } from '@/types';

/** Reference data changes rarely; cached per request so a page loads it once. */
export const getBrands = cache(async (): Promise<TruckBrand[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('truck_brands')
    .select('id, slug, name, logo_url')
    .eq('active', true)
    .order('sort_order');
  return data ?? [];
});

export const getModels = cache(async (brandId?: string): Promise<TruckModel[]> => {
  const supabase = await createClient();
  let query = supabase
    .from('truck_models')
    .select('id, brand_id, slug, name')
    .eq('active', true)
    .order('name');
  if (brandId) query = query.eq('brand_id', brandId);
  const { data } = await query;
  return data ?? [];
});

export const getTruckTypes = cache(async (): Promise<TruckType[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('truck_types')
    .select('id, slug, name_en, name_ku, name_ar')
    .order('sort_order');
  return data ?? [];
});

export const getPartCategories = cache(async (): Promise<PartCategory[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('part_categories')
    .select('id, slug, name_en, name_ku, name_ar')
    .order('sort_order');
  return data ?? [];
});

export const getLocations = cache(async (): Promise<LocationRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('locations')
    .select('id, country_code, governorate, slug, name_en, name_ku, name_ar')
    .order('sort_order');
  return data ?? [];
});

export async function findBrandBySlug(slug: string): Promise<TruckBrand | null> {
  const brands = await getBrands();
  return brands.find((b) => b.slug === slug) ?? null;
}

export async function findCategoryBySlug(slug: string): Promise<PartCategory | null> {
  const categories = await getPartCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}
