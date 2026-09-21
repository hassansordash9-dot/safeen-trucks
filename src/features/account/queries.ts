import { createClient } from '@/lib/supabase/server';

export type SellerStats = {
  activeListings: number;
  soldListings: number;
  drafts: number;
  views: number;
  whatsappClicks: number;
  callClicks: number;
  favorites: number;
};

/** Counts across both listing kinds for the seller dashboard. */
export async function getSellerStats(sellerId: string): Promise<SellerStats> {
  const supabase = await createClient();

  const [trucks, parts] = await Promise.all([
    supabase.from('trucks').select('id, status, views_count').eq('seller_id', sellerId),
    supabase.from('parts').select('id, status, views_count').eq('seller_id', sellerId),
  ]);

  const rows = [
    ...((trucks.data ?? []) as Array<{ id: string; status: string; views_count: number }>),
    ...((parts.data ?? []) as Array<{ id: string; status: string; views_count: number }>),
  ];

  const ids = rows.map((row) => row.id);
  const empty = { activeListings: 0, soldListings: 0, drafts: 0, views: 0 };
  const totals = rows.reduce(
    (acc, row) => ({
      activeListings: acc.activeListings + (row.status === 'published' ? 1 : 0),
      soldListings: acc.soldListings + (row.status === 'sold' ? 1 : 0),
      drafts: acc.drafts + (row.status === 'draft' ? 1 : 0),
      views: acc.views + row.views_count,
    }),
    empty,
  );

  if (!ids.length) {
    return { ...totals, whatsappClicks: 0, callClicks: 0, favorites: 0 };
  }

  const { data: events } = await supabase
    .from('contact_events')
    .select('event_type')
    .in('listing_id', ids);

  const counts = ((events ?? []) as Array<{ event_type: string }>).reduce(
    (acc, event) => {
      if (event.event_type === 'whatsapp') acc.whatsappClicks += 1;
      if (event.event_type === 'call') acc.callClicks += 1;
      if (event.event_type === 'favorite') acc.favorites += 1;
      return acc;
    },
    { whatsappClicks: 0, callClicks: 0, favorites: 0 },
  );

  return { ...totals, ...counts };
}

export async function getMyRequests(userId: string) {
  const supabase = await createClient();
  const [trucks, parts] = await Promise.all([
    supabase
      .from('truck_requests')
      .select('id, model_text, year_from, year_to, max_price, currency, notes, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('part_requests')
      .select('id, description, model_text, year, part_number, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  return {
    trucks: (trucks.data ?? []) as Array<{
      id: string;
      model_text: string | null;
      year_from: number | null;
      year_to: number | null;
      max_price: number | null;
      currency: 'USD' | 'IQD';
      notes: string | null;
      status: string;
      created_at: string;
    }>,
    parts: (parts.data ?? []) as Array<{
      id: string;
      description: string;
      model_text: string | null;
      year: number | null;
      part_number: string | null;
      status: string;
      created_at: string;
    }>,
  };
}

export async function getSavedSearches(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('saved_searches')
    .select('id, listing_kind, name, query, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data ?? []) as Array<{
    id: string;
    listing_kind: 'truck' | 'part';
    name: string;
    query: Record<string, string>;
    created_at: string;
  }>;
}
