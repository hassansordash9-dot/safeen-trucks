'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { shortId, slugify } from '@/lib/utils';

const dealerSchema = z.object({
  business_name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(2000).optional(),
  phone: z.string().trim().max(25).optional(),
  whatsapp: z.string().trim().max(25).optional(),
  website: z.string().trim().url().max(200).optional().or(z.literal('')),
  location_id: z.string().uuid().optional().or(z.literal('')),
});

export type DealerState = { ok: boolean; message?: string };

export async function saveDealer(_prev: DealerState, formData: FormData): Promise<DealerState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: 'unauthorized' };

  const parsed = dealerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: 'invalidInput' };

  const supabase = await createClient();
  const row = {
    business_name: parsed.data.business_name,
    description: parsed.data.description || null,
    phone: parsed.data.phone || null,
    whatsapp: parsed.data.whatsapp || null,
    website: parsed.data.website || null,
    location_id: parsed.data.location_id || null,
  };

  const { data: existing } = await supabase
    .from('dealers')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('dealers')
      .update(row)
      .eq('id', (existing as { id: string }).id);
    if (error) return { ok: false, message: 'generic' };
  } else {
    const slug = `${slugify(parsed.data.business_name) || 'dealer'}-${shortId(4)}`;
    const { error } = await supabase
      .from('dealers')
      .insert({ ...row, owner_id: user.id, slug });
    if (error) return { ok: false, message: 'generic' };

    await supabase.from('profiles').update({ role: 'dealer' }).eq('id', user.id);
  }

  revalidatePath('/[locale]/account/dealer', 'page');
  return { ok: true };
}

export async function requestVerification(dealerId: string): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data: dealer } = await supabase
    .from('dealers')
    .select('id')
    .eq('id', dealerId)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!dealer) return false;

  const { data: pending } = await supabase
    .from('verifications')
    .select('id')
    .eq('dealer_id', dealerId)
    .eq('status', 'pending')
    .maybeSingle();
  if (pending) return true;

  const { error } = await supabase.from('verifications').insert({
    profile_id: user.id,
    dealer_id: dealerId,
    level: 'business',
  });

  revalidatePath('/[locale]/account/dealer', 'page');
  return !error;
}

export async function getVerificationStatus(dealerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('verifications')
    .select('status, requested_at, notes')
    .eq('dealer_id', dealerId)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { status: 'pending' | 'approved' | 'rejected'; notes: string | null } | null) ?? null;
}
