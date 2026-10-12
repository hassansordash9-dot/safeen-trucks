'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser, canSell } from '@/lib/auth';
import { scoreTruck } from '@/lib/quality';
import { listingSlug } from '@/lib/utils';
import { statusAfterSave } from '@/lib/listing-status';
import { truckInputSchema } from './schema';
import type { ListingStatus } from '@/types';

export type SaveResult =
  | { ok: true; id: string; slug: string; status: ListingStatus }
  | { ok: false; reason: 'auth' | 'forbidden' | 'invalid' | 'error'; message?: string };

/** Admin publication happens after photos have been saved. */
export async function saveTruck(input: unknown): Promise<SaveResult> {
  const parsed = truckInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: 'invalid', message: parsed.error.message };

  const user = await getSessionUser();
  if (!user) return { ok: false, reason: 'auth' };
  if (!canSell(user.profile)) {
    return { ok: false, reason: 'forbidden' };
  }

  const data = parsed.data;
  const supabase = await createClient();

  if (data.dealerId) {
    const { data: dealer } = await supabase
      .from('dealers')
      .select('id')
      .eq('id', data.dealerId)
      .maybeSingle();
    if (!dealer) return { ok: false, reason: 'forbidden' };
  }

  const quality = scoreTruck({
    price: data.price,
    mileage_km: data.mileageKm ?? null,
    horsepower: data.horsepower ?? null,
    engine: data.engine,
    transmission: data.transmission ?? null,
    axle_configuration: data.axleConfiguration,
    description: data.description,
    whatsapp: data.whatsapp,
    location_id: data.locationId,
    imageCount: data.images.length,
  });

  const nextStatus = (current?: ListingStatus) => statusAfterSave(data.publish, current);
  const row = {
    seller_id: user.id,
    dealer_id: data.dealerId ?? null,
    brand_id: data.brandId,
    model_id: data.modelId ?? null,
    truck_type_id: data.truckTypeId ?? null,
    title: data.title,
    year: data.year,
    mileage_km: data.mileageKm ?? null,
    horsepower: data.horsepower ?? null,
    engine: data.engine,
    transmission: data.transmission ?? null,
    axle_configuration: data.axleConfiguration,
    emission_class: data.emissionClass,
    condition: data.condition,
    color: data.color,
    price: data.price,
    currency: data.currency,
    negotiable: data.negotiable,
    description: data.description,
    location_id: data.locationId,
    phone: data.phone,
    whatsapp: data.whatsapp,
    quality_score: quality.score,
  };

  let id = data.id;
  let finalStatus = nextStatus();

  if (id) {
    const { data: existing } = await supabase
      .from('trucks')
      .select('id, seller_id, status')
      .eq('id', id)
      .maybeSingle();
    if (!existing) return { ok: false, reason: 'error' };
    const current = existing as { seller_id: string; status: ListingStatus };
    finalStatus = nextStatus(current.status);


    const { error } = await supabase
      .from('trucks')
      .update({ ...row, seller_id: current.seller_id, status: data.publish ? current.status : finalStatus })
      .eq('id', id);
    if (error) return { ok: false, reason: 'error', message: error.message };
  } else {
    const slug = listingSlug([data.title, data.year]);
    const { data: inserted, error } = await supabase
      .from('trucks')
      .insert({ ...row, slug, status: 'draft' })
      .select('id')
      .single();
    if (error || !inserted) return { ok: false, reason: 'error', message: error?.message };
    id = (inserted as { id: string }).id;
  }

  if (!(await syncImages(id!, data.images))) return { ok: false, reason: 'error' };

  const { data: transitioned, error: publishError } = await supabase.from('trucks')
    .update({ status: finalStatus }).eq('id', id!).select('id').single();
  if (publishError || !transitioned) return { ok: false, reason: 'error', message: publishError?.message };

  const { data: saved } = await supabase
    .from('trucks')
    .select('slug, status')
    .eq('id', id!)
    .single();

  if (!saved) return { ok: false, reason: 'error' };
  revalidatePath('/[locale]/trucks', 'layout');
  revalidatePath('/[locale]/truck-parts', 'layout');
  revalidatePath('/[locale]', 'page');
  revalidatePath('/[locale]/account/listings', 'page');
  return {
    ok: true,
    id: id!,
    slug: (saved as { slug: string }).slug,
    status: (saved as { status: ListingStatus }).status,
  };
}

async function syncImages(listingId: string, images: Array<{ path: string; isPrimary: boolean }>): Promise<boolean> {
  const supabase = await createClient();
  const { data: current, error: readError } = await supabase
    .from('truck_images').select('id, path').eq('truck_id', listingId);
  if (readError) return false;
  const existing = (current ?? []) as Array<{ id: string; path: string }>;
  const keepPaths = new Set(images.map((image) => image.path));
  const removed = existing.filter((image) => !keepPaths.has(image.path));
  const { error: primaryError } = await supabase.from('truck_images')
    .update({ is_primary: false }).eq('truck_id', listingId);
  if (primaryError) return false;

  // Attach replacement photos before removing any existing ones.
  for (const [index, image] of images.entries()) {
    const known = existing.find((row) => row.path === image.path);
    const result = known
      ? await supabase.from('truck_images').update({ sort_order: index, is_primary: image.isPrimary }).eq('id', known.id)
      : await supabase.from('truck_images').insert({ truck_id: listingId, path: image.path, sort_order: index, is_primary: image.isPrimary });
    if (result.error) return false;
  }
  if (removed.length) {
    const { error } = await supabase.from('truck_images').delete().in('id', removed.map((image) => image.id));
    if (error) return false;
    await supabase.storage.from('listings').remove(removed.map((image) => image.path));
  }
  return true;
}

export async function setTruckStatus(id: string, status: ListingStatus): Promise<boolean> {
  const user = await getSessionUser();
  if (!user || !canSell(user.profile)) return false;

  const allowed: ListingStatus[] = ['paused', 'published', 'sold', 'draft'];
  if (!allowed.includes(status)) return false;

  const supabase = await createClient();
  const { data: truck } = await supabase
    .from('trucks')
    .select('seller_id, status')
    .eq('id', id)
    .maybeSingle();
  if (!truck) return false;


  const patch: Record<string, unknown> = { status };
  if (status === 'sold') patch.sold_at = new Date().toISOString();
  if (status === 'published') patch.sold_at = null;

  const { data: updated, error } = await supabase.from('trucks').update(patch).eq('id', id).select('id').single();
  revalidatePath('/[locale]/account/listings', 'page');
  return !error && !!updated;
}

export async function deleteTruck(id: string): Promise<boolean> {
  const user = await getSessionUser();
  if (!user || !canSell(user.profile)) return false;
  const supabase = await createClient();
  const { data: images } = await supabase.from('truck_images').select('path').eq('truck_id', id);
  const { data: deleted, error } = await supabase
    .from('trucks')
    .delete()
    .eq('id', id)
    .select('id');
  if (error || !deleted?.length) return false;

  const paths = ((images ?? []) as Array<{ path: string }>).map((image) => image.path);
  if (paths.length) await supabase.storage.from('listings').remove(paths);

  revalidatePath('/[locale]/account/listings', 'page');
  return true;
}
