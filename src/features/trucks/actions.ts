'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { scoreTruck } from '@/lib/quality';
import { listingSlug } from '@/lib/utils';
import { truckInputSchema } from './schema';
import type { ListingStatus } from '@/types';

export type SaveResult =
  | { ok: true; id: string; slug: string; status: ListingStatus }
  | { ok: false; reason: 'auth' | 'forbidden' | 'invalid' | 'error'; message?: string };

/** Listings go to moderation on publish; drafts stay private to the seller. */
export async function saveTruck(input: unknown): Promise<SaveResult> {
  const parsed = truckInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: 'invalid', message: parsed.error.message };

  const user = await getSessionUser();
  if (!user) return { ok: false, reason: 'auth' };
  if (!user.profile || (user.profile.status !== 'active' && user.profile.status !== 'warned')) {
    return { ok: false, reason: 'forbidden' };
  }

  const data = parsed.data;
  const supabase = await createClient();

  if (data.dealerId) {
    const { data: dealer } = await supabase
      .from('dealers')
      .select('id')
      .eq('id', data.dealerId)
      .eq('owner_id', user.id)
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

  const nextStatus = (current?: ListingStatus): ListingStatus => {
    if (!data.publish) return 'draft';
    // Editing something already live keeps it live; everything else waits for review.
    return current === 'published' || current === 'sold' ? 'published' : 'pending';
  };
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

  if (id) {
    const { data: existing } = await supabase
      .from('trucks')
      .select('id, seller_id, status')
      .eq('id', id)
      .maybeSingle();
    if (!existing) return { ok: false, reason: 'error' };
    const current = existing as { seller_id: string; status: ListingStatus };
    if (current.seller_id !== user.id) return { ok: false, reason: 'forbidden' };

    const { error } = await supabase
      .from('trucks')
      .update({ ...row, status: nextStatus(current.status) })
      .eq('id', id);
    if (error) return { ok: false, reason: 'error', message: error.message };
  } else {
    const slug = listingSlug([data.title, data.year]);
    const { data: inserted, error } = await supabase
      .from('trucks')
      .insert({ ...row, slug, status: nextStatus() })
      .select('id')
      .single();
    if (error || !inserted) return { ok: false, reason: 'error', message: error?.message };
    id = (inserted as { id: string }).id;
  }

  await syncImages(id!, data.images);

  const { data: saved } = await supabase
    .from('trucks')
    .select('slug, status')
    .eq('id', id!)
    .single();

  revalidatePath('/[locale]/account/listings', 'page');
  return {
    ok: true,
    id: id!,
    slug: (saved as { slug: string }).slug,
    status: (saved as { status: ListingStatus }).status,
  };
}

async function syncImages(truckId: string, images: Array<{ path: string; isPrimary: boolean }>) {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from('truck_images')
    .select('id, path')
    .eq('truck_id', truckId);

  const existing = (current ?? []) as Array<{ id: string; path: string }>;
  const keepPaths = new Set(images.map((image) => image.path));
  const removed = existing.filter((image) => !keepPaths.has(image.path));

  if (removed.length) {
    await supabase
      .from('truck_images')
      .delete()
      .in(
        'id',
        removed.map((image) => image.id),
      );
    await supabase.storage.from('listings').remove(removed.map((image) => image.path));
  }

  // Clear primaries first: the partial unique index allows only one per listing.
  await supabase.from('truck_images').update({ is_primary: false }).eq('truck_id', truckId);

  for (const [index, image] of images.entries()) {
    const known = existing.find((row) => row.path === image.path);
    if (known) {
      await supabase
        .from('truck_images')
        .update({ sort_order: index, is_primary: image.isPrimary })
        .eq('id', known.id);
    } else {
      await supabase.from('truck_images').insert({
        truck_id: truckId,
        path: image.path,
        sort_order: index,
        is_primary: image.isPrimary,
      });
    }
  }
}

export async function setTruckStatus(id: string, status: ListingStatus): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  const allowed: ListingStatus[] = ['paused', 'published', 'sold', 'draft'];
  if (!allowed.includes(status)) return false;

  const supabase = await createClient();
  const { data: truck } = await supabase
    .from('trucks')
    .select('seller_id, status')
    .eq('id', id)
    .maybeSingle();
  if (!truck || (truck as { seller_id: string }).seller_id !== user.id) return false;

  // A seller may resume or pause a live listing, but cannot self-approve a pending one.
  const currentStatus = (truck as { status: ListingStatus }).status;
  if (status === 'published' && currentStatus !== 'paused') return false;

  const patch: Record<string, unknown> = { status };
  if (status === 'sold') patch.sold_at = new Date().toISOString();

  const { error } = await supabase.from('trucks').update(patch).eq('id', id);
  revalidatePath('/[locale]/account/listings', 'page');
  return !error;
}

export async function deleteTruck(id: string): Promise<boolean> {
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
