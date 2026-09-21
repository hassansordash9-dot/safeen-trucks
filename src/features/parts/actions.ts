'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { scorePart } from '@/lib/quality';
import { listingSlug } from '@/lib/utils';
import { partInputSchema } from '@/features/trucks/schema';
import type { SaveResult } from '@/features/trucks/actions';
import type { ListingStatus } from '@/types';

export async function savePart(input: unknown): Promise<SaveResult> {
  const parsed = partInputSchema.safeParse(input);
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

  const quality = scorePart({
    price: data.price,
    part_number: data.partNumber,
    oem_number: data.oemNumber,
    part_type: data.partType ?? null,
    compatible_brand_id: data.compatibleBrandId ?? null,
    compatible_models: data.compatibleModels,
    description: data.description,
    whatsapp: data.whatsapp,
    location_id: data.locationId,
    imageCount: data.images.length,
  });

  const nextStatus = (current?: ListingStatus): ListingStatus => {
    if (!data.publish) return 'draft';
    return current === 'published' || current === 'sold' ? 'published' : 'pending';
  };
  const row = {
    seller_id: user.id,
    dealer_id: data.dealerId ?? null,
    category_id: data.categoryId,
    title: data.title,
    brand: data.brand,
    part_number: data.partNumber,
    oem_number: data.oemNumber,
    condition: data.condition,
    part_type: data.partType ?? null,
    compatible_brand_id: data.compatibleBrandId ?? null,
    compatible_models: data.compatibleModels,
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
      .from('parts')
      .select('id, seller_id, status')
      .eq('id', id)
      .maybeSingle();
    if (!existing) return { ok: false, reason: 'error' };
    const current = existing as { seller_id: string; status: ListingStatus };
    if (current.seller_id !== user.id) return { ok: false, reason: 'forbidden' };

    const { error } = await supabase
      .from('parts')
      .update({ ...row, status: nextStatus(current.status) })
      .eq('id', id);
    if (error) return { ok: false, reason: 'error', message: error.message };
  } else {
    const slug = listingSlug([data.title, data.partNumber]);
    const { data: inserted, error } = await supabase
      .from('parts')
      .insert({ ...row, slug, status: nextStatus() })
      .select('id')
      .single();
    if (error || !inserted) return { ok: false, reason: 'error', message: error?.message };
    id = (inserted as { id: string }).id;
  }

  await syncImages(id!, data.images);

  const { data: saved } = await supabase.from('parts').select('slug, status').eq('id', id!).single();

  revalidatePath('/[locale]/account/listings', 'page');
  return {
    ok: true,
    id: id!,
    slug: (saved as { slug: string }).slug,
    status: (saved as { status: ListingStatus }).status,
  };
}

async function syncImages(partId: string, images: Array<{ path: string; isPrimary: boolean }>) {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from('part_images')
    .select('id, path')
    .eq('part_id', partId);

  const existing = (current ?? []) as Array<{ id: string; path: string }>;
  const keepPaths = new Set(images.map((image) => image.path));
  const removed = existing.filter((image) => !keepPaths.has(image.path));

  if (removed.length) {
    await supabase
      .from('part_images')
      .delete()
      .in(
        'id',
        removed.map((image) => image.id),
      );
    await supabase.storage.from('listings').remove(removed.map((image) => image.path));
  }

  await supabase.from('part_images').update({ is_primary: false }).eq('part_id', partId);

  for (const [index, image] of images.entries()) {
    const known = existing.find((row) => row.path === image.path);
    if (known) {
      await supabase
        .from('part_images')
        .update({ sort_order: index, is_primary: image.isPrimary })
        .eq('id', known.id);
    } else {
      await supabase.from('part_images').insert({
        part_id: partId,
        path: image.path,
        sort_order: index,
        is_primary: image.isPrimary,
      });
    }
  }
}

export async function setPartStatus(id: string, status: ListingStatus): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  const allowed: ListingStatus[] = ['paused', 'published', 'sold', 'draft'];
  if (!allowed.includes(status)) return false;

  const supabase = await createClient();
  const { data: part } = await supabase
    .from('parts')
    .select('seller_id, status')
    .eq('id', id)
    .maybeSingle();
  if (!part || (part as { seller_id: string }).seller_id !== user.id) return false;
  if (status === 'published' && (part as { status: ListingStatus }).status !== 'paused') {
    return false;
  }

  const patch: Record<string, unknown> = { status };
  if (status === 'sold') patch.sold_at = new Date().toISOString();

  const { error } = await supabase.from('parts').update(patch).eq('id', id);
  revalidatePath('/[locale]/account/listings', 'page');
  return !error;
}

export async function deletePart(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: images } = await supabase.from('part_images').select('path').eq('part_id', id);
  const { data: deleted, error } = await supabase
    .from('parts')
    .delete()
    .eq('id', id)
    .select('id');
  if (error || !deleted?.length) return false;

  const paths = ((images ?? []) as Array<{ path: string }>).map((image) => image.path);
  if (paths.length) await supabase.storage.from('listings').remove(paths);

  revalidatePath('/[locale]/account/listings', 'page');
  return true;
}
