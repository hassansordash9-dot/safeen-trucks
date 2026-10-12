import { createClient } from '@/lib/supabase/server';
import { ALLOWED_IMAGE_TYPES } from '@/lib/images';

export const dynamic = 'force-dynamic';

/** Use the visitor's session, never a service key or a cached signed URL. */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path');
  if (!path || path.length > 300 || path.includes('..') || !/^[a-zA-Z0-9_/-]+\.[a-zA-Z0-9]+$/.test(path)) {
    return new Response(null, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from('listings').download(path);
  if (error || !data || !ALLOWED_IMAGE_TYPES.includes(data.type)) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  }
  return new Response(data, {
    headers: {
      'Content-Type': data.type,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Cookie',
    },
  });
}
