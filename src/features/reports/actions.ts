'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  kind: z.enum(['truck', 'part']),
  listingId: z.string().uuid(),
  reason: z.enum(['fake', 'scam', 'wrong_price', 'wrong_info', 'sold', 'duplicate', 'other']),
  details: z.string().trim().max(1000).optional(),
});

export type ReportResult = { ok: true } | { ok: false; reason: 'auth' | 'error' };

export async function submitReport(input: unknown): Promise<ReportResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: 'error' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'auth' };

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    listing_kind: parsed.data.kind,
    listing_id: parsed.data.listingId,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });

  return error ? { ok: false, reason: 'error' } : { ok: true };
}
