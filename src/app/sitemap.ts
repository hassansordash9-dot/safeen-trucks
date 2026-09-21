import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { locales } from '@/i18n/config';
import { siteUrl } from '@/lib/seo';

const STATIC_PATHS = [
  '',
  '/trucks',
  '/truck-parts',
  '/dealers',
  '/sell',
  '/about',
  '/help',
  '/contact',
  '/privacy',
  '/terms',
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({ url: `${base}/${locale}${path}`, changeFrequency: 'daily', priority: 0.7 });
    }
  }

  try {
    const supabase = await createClient();
    const [brands, categories, trucks, parts, dealers] = await Promise.all([
      supabase.from('truck_brands').select('slug').eq('active', true),
      supabase.from('part_categories').select('slug'),
      supabase
        .from('trucks')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(2000),
      supabase
        .from('parts')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(2000),
      supabase.from('dealers').select('slug').eq('active', true),
    ]);

    for (const locale of locales) {
      for (const row of (brands.data ?? []) as Array<{ slug: string }>) {
        entries.push({ url: `${base}/${locale}/trucks/${row.slug}`, priority: 0.6 });
      }
      for (const row of (categories.data ?? []) as Array<{ slug: string }>) {
        entries.push({ url: `${base}/${locale}/truck-parts/${row.slug}`, priority: 0.6 });
      }
      for (const row of (trucks.data ?? []) as Array<{ slug: string; updated_at: string }>) {
        entries.push({
          url: `${base}/${locale}/trucks/${row.slug}`,
          lastModified: row.updated_at,
          priority: 0.8,
        });
      }
      for (const row of (parts.data ?? []) as Array<{ slug: string; updated_at: string }>) {
        entries.push({
          url: `${base}/${locale}/truck-parts/${row.slug}`,
          lastModified: row.updated_at,
          priority: 0.8,
        });
      }
      for (const row of (dealers.data ?? []) as Array<{ slug: string }>) {
        entries.push({ url: `${base}/${locale}/dealers/${row.slug}`, priority: 0.5 });
      }
    }
  } catch {
    // Without a database the static routes still make a valid sitemap.
  }

  return entries;
}
