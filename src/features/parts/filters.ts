import { z } from 'zod';

export const PART_SORTS = ['newest', 'price_asc', 'price_desc'] as const;
export type PartSort = (typeof PART_SORTS)[number];

const optionalInt = z.coerce.number().int().positive().optional().catch(undefined);

export const partFilterSchema = z.object({
  q: z.string().trim().min(1).max(80).optional().catch(undefined),
  category: z.string().trim().optional().catch(undefined),
  compatibleBrand: z.string().trim().optional().catch(undefined),
  compatibleModel: z.string().trim().max(60).optional().catch(undefined),
  condition: z.enum(['new', 'used', 'rebuilt']).optional().catch(undefined),
  partType: z.enum(['original', 'aftermarket']).optional().catch(undefined),
  location: z.string().trim().optional().catch(undefined),
  priceFrom: optionalInt,
  priceTo: optionalInt,
  sort: z.enum(PART_SORTS).default('newest').catch('newest'),
  page: z.coerce.number().int().min(1).max(500).default(1).catch(1),
});

export type PartFilters = z.infer<typeof partFilterSchema>;

export function parsePartFilters(
  params: Record<string, string | string[] | undefined>,
): PartFilters {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single !== undefined && single !== '') flat[key] = single;
  }
  return partFilterSchema.parse(flat);
}

export function partFiltersToParams(filters: Partial<PartFilters>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    if (key === 'sort' && value === 'newest') continue;
    if (key === 'page' && value === 1) continue;
    out[key] = String(value);
  }
  return out;
}
