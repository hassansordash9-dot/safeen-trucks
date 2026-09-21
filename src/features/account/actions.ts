'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(25).optional(),
  whatsapp: z.string().trim().max(25).optional(),
  location_id: z.string().uuid().optional().or(z.literal('')),
});

export type ActionState = { ok: boolean; message?: string };

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: 'unauthorized' };

  const parsed = profileSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone') ?? '',
    whatsapp: formData.get('whatsapp') ?? '',
    location_id: formData.get('location_id') ?? '',
  });
  if (!parsed.success) return { ok: false, message: 'invalidInput' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      location_id: parsed.data.location_id || null,
    })
    .eq('id', user.id);

  if (error) return { ok: false, message: 'generic' };

  revalidatePath('/[locale]/account/profile', 'page');
  return { ok: true };
}
