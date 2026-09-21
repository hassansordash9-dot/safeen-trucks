import { z } from 'zod';
import { clampInt } from '@/lib/utils';

export const TRUCK_SORTS = ['newest', 'price_asc', 'price_desc', 'mileage', 'year'] as const;
export type TruckSort = (typeof TRUCK_SORTS)[number];

const optionalInt = z.coerce.number().int().positive().optional().catch(undefined);

export const truckFilterSchema = z.object({
  q: z.string().trim().min(1).max(80).optional().catch(undefined),
  brand: z.string().trim().optional().catch(undefined),
  model: z.string().trim().optional().catch(undefined),
  type: z.string().trim().optional().catch(undefined),
  location: z.string().trim().optional().catch(undefined),
  yearFrom: optionalInt,
  yearTo: optionalInt,
  priceFrom: optionalInt,
  priceTo: optionalInt,
  mileageTo: optionalInt,
  hpFrom: optionalInt,
  condition: z.enum(['new', 'used']).optional().catch(undefined),
  transmission: z.enum(['manual', 'automatic', 'semi_automatic']).optional().catch(undefined),
  axle: z.string().trim().optional().catch(undefined),
  emission: z.string().trim().optional().catch(undefined),
  seller: z.enum(['dealer', 'private']).optional().catch(undefined),
  verified: z.literal('1').optional().catch(undefined),
  sort: z.enum(TRUCK_SORTS).default('newest').catch('newest'),
  page: z.coerce.number().int().min(1).max(500).default(1).catch(1),
});

export type TruckFilters = z.infer<typeof truckFilterSchema>;

export type RawSearchParams = Record<string, string | string[] | undefined>;

function flatten(params: RawSearchParams): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single !== undefined && single !== '') flat[key] = single;
  }
  return flat;
}

export function parseTruckFilters(params: RawSearchParams): TruckFilters {
  return truckFilterSchema.parse(flatten(params));
}

/** Filters as a query string so a search can be shared or saved. */
export function truckFiltersToParams(filters: Partial<TruckFilters>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    if (key === 'sort' && value === 'newest') continue;
    if (key === 'page' && value === 1) continue;
    out[key] = String(value);
  }
  return out;
}

export const PAGE_SIZE = 24;

export function pageOffset(page: number): [number, number] {
  const safe = clampInt(page, 1, 500, 1);
  const from = (safe - 1) * PAGE_SIZE;
  return [from, from + PAGE_SIZE - 1];
}
