'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const truckRequestSchema = z.object({
  brandId: z.string().uuid().optional().or(z.literal('')),
  modelText: z.string().trim().max(60).optional(),
  yearFrom: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal('')),
  yearTo: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal('')),
  maxPrice: z.coerce.number().min(0).max(100_000_000).optional().or(z.literal('')),
  currency: z.enum(['USD', 'IQD']).default('USD'),
  axleConfiguration: z.string().trim().max(10).optional(),
  locationId: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional(),
  contactPhone: z.string().trim().min(7).max(25),
});

const partRequestSchema = z.object({
  brandId: z.string().uuid().optional().or(z.literal('')),
  modelText: z.string().trim().max(60).optional(),
  year: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal('')),
  description: z.string().trim().min(5).max(1000),
  partNumber: z.string().trim().max(60).optional(),
  imagePath: z.string().trim().max(300).optional(),
  locationId: z.string().uuid().optional().or(z.literal('')),
  contactPhone: z.string().trim().min(7).max(25),
});

export type RequestState = { ok: boolean; message?: string };

const clean = (value: unknown) => (value === '' || value === undefined ? null : value);

export async function submitTruckRequest(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const parsed = truckRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: 'invalidInput' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('truck_requests').insert({
    user_id: user?.id ?? null,
    brand_id: clean(parsed.data.brandId),
    model_text: clean(parsed.data.modelText),
    year_from: clean(parsed.data.yearFrom),
    year_to: clean(parsed.data.yearTo),
    max_price: clean(parsed.data.maxPrice),
    currency: parsed.data.currency,
    axle_configuration: clean(parsed.data.axleConfiguration),
    location_id: clean(parsed.data.locationId),
    notes: clean(parsed.data.notes),
    contact_phone: parsed.data.contactPhone,
  });

  return error ? { ok: false, message: 'generic' } : { ok: true };
}

export async function submitPartRequest(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const parsed = partRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: 'invalidInput' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('part_requests').insert({
    user_id: user?.id ?? null,
    brand_id: clean(parsed.data.brandId),
    model_text: clean(parsed.data.modelText),
    year: clean(parsed.data.year),
    description: parsed.data.description,
    part_number: clean(parsed.data.partNumber),
    image_path: clean(parsed.data.imagePath),
    location_id: clean(parsed.data.locationId),
    contact_phone: parsed.data.contactPhone,
  });

  return error ? { ok: false, message: 'generic' } : { ok: true };
}
