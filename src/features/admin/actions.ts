'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import type { ListingKind, ListingStatus, UserStatus } from '@/types';

async function adminClient() {
  const user = await getSessionUser();
  if (user?.profile?.role !== 'admin') return null;
  return { supabase: await createClient(), adminId: user.id };
}

function refreshAdmin() {
  revalidatePath('/[locale]/admin', 'layout');
}

const moderationSchema = z.object({
  kind: z.enum(['truck', 'part']),
  id: z.string().uuid(),
  status: z.enum(['published', 'rejected', 'paused', 'pending', 'expired']),
  reason: z.string().trim().max(500).optional(),
});

export async function moderateListing(input: {
  kind: ListingKind;
  id: string;
  status: ListingStatus;
  reason?: string;
}): Promise<boolean> {
  const parsed = moderationSchema.safeParse(input);
  if (!parsed.success) return false;

  const context = await adminClient();
  if (!context) return false;

  const table = parsed.data.kind === 'truck' ? 'trucks' : 'parts';
  const patch: Record<string, unknown> = {
    status: parsed.data.status,
    reviewed_by: context.adminId,
    reviewed_at: new Date().toISOString(),
    rejection_reason: parsed.data.status === 'rejected' ? (parsed.data.reason ?? null) : null,
  };
  if (parsed.data.status === 'published') patch.published_at = new Date().toISOString();

  const { error } = await context.supabase.from(table).update(patch).eq('id', parsed.data.id);
  refreshAdmin();
  return !error;
}

export async function setListingFeatured(
  kind: ListingKind,
  id: string,
  featured: boolean,
): Promise<boolean> {
  const context = await adminClient();
  if (!context) return false;

  const { error } = await context.supabase
    .from(kind === 'truck' ? 'trucks' : 'parts')
    .update({ featured })
    .eq('id', id);
  refreshAdmin();
  return !error;
}

export async function deleteListingAsAdmin(kind: ListingKind, id: string): Promise<boolean> {
  const context = await adminClient();
  if (!context) return false;

  const { error } = await context.supabase
    .from(kind === 'truck' ? 'trucks' : 'parts')
    .delete()
    .eq('id', id);
  refreshAdmin();
  return !error;
}

export async function setUserStatus(
  userId: string,
  status: UserStatus,
  note?: string,
): Promise<boolean> {
  const context = await adminClient();
  if (!context) return false;
  if (userId === context.adminId) return false;

  const { error } = await context.supabase
    .from('profiles')
    .update({ status, admin_note: note ?? null })
    .eq('id', userId);
  refreshAdmin();
  return !error;
}

export async function setDealerVerified(dealerId: string, verified: boolean): Promise<boolean> {
  const context = await adminClient();
  if (!context) return false;

  const { error } = await context.supabase
    .from('dealers')
    .update({ verified })
    .eq('id', dealerId);
  refreshAdmin();
  return !error;
}

export async function reviewVerification(
  verificationId: string,
  status: 'approved' | 'rejected',
  notes?: string,
): Promise<boolean> {
  const context = await adminClient();
  if (!context) return false;

  const { data: verification, error } = await context.supabase
    .from('verifications')
    .update({
      status,
      notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: context.adminId,
    })
    .eq('id', verificationId)
    .select('dealer_id')
    .maybeSingle();

  if (error) return false;

  const dealerId = (verification as { dealer_id: string | null } | null)?.dealer_id;
  if (dealerId && status === 'approved') {
    await context.supabase.from('dealers').update({ verified: true }).eq('id', dealerId);
  }

  refreshAdmin();
  return true;
}

export async function resolveReport(
  reportId: string,
  status: 'resolved' | 'dismissed',
  resolution?: string,
): Promise<boolean> {
  const context = await adminClient();
  if (!context) return false;

  const { error } = await context.supabase
    .from('reports')
    .update({
      status,
      resolution: resolution ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: context.adminId,
    })
    .eq('id', reportId);
  refreshAdmin();
  return !error;
}
