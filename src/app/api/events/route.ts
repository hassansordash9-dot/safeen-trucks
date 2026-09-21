import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  kind: z.enum(['truck', 'part']),
  listingId: z.string().uuid(),
  eventType: z.enum(['whatsapp', 'call', 'view']),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from('contact_events').insert({
    listing_kind: parsed.data.kind,
    listing_id: parsed.data.listingId,
    user_id: user?.id ?? null,
    event_type: parsed.data.eventType,
  });

  return NextResponse.json({ ok: true });
}
