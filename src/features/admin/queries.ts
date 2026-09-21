import { createClient } from '@/lib/supabase/server';
import type { ListingKind, ListingStatus, UserRole, UserStatus } from '@/types';

export type AdminListing = {
  id: string;
  kind: ListingKind;
  slug: string;
  title: string;
  price: number;
  currency: 'USD' | 'IQD';
  status: ListingStatus;
  featured: boolean;
  quality_score: number;
  created_at: string;
};

export async function getAdminOverview() {
  const supabase = await createClient();
  const count = (table: string, column: string, value: string) =>
    supabase.from(table).select('id', { count: 'exact', head: true }).eq(column, value);

  const [pendingTrucks, pendingParts, reports, verifications, users, dealers] = await Promise.all([
    count('trucks', 'status', 'pending'),
    count('parts', 'status', 'pending'),
    count('reports', 'status', 'open'),
    count('verifications', 'status', 'pending'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('dealers').select('id', { count: 'exact', head: true }),
  ]);

  return {
    pending: (pendingTrucks.count ?? 0) + (pendingParts.count ?? 0),
    reports: reports.count ?? 0,
    verifications: verifications.count ?? 0,
    users: users.count ?? 0,
    dealers: dealers.count ?? 0,
  };
}

export async function getAdminListings(status?: ListingStatus): Promise<AdminListing[]> {
  const supabase = await createClient();
  const columns = 'id, slug, title, price, currency, status, featured, quality_score, created_at';

  const build = (table: 'trucks' | 'parts') => {
    const query = supabase
      .from(table)
      .select(columns)
      .order('created_at', { ascending: false })
      .limit(50);
    return status ? query.eq('status', status) : query;
  };

  const [trucks, parts] = await Promise.all([build('trucks'), build('parts')]);

  const map = (rows: unknown, kind: ListingKind): AdminListing[] =>
    ((rows ?? []) as Omit<AdminListing, 'kind'>[]).map((row) => ({ ...row, kind }));

  return [...map(trucks.data, 'truck'), ...map(parts.data, 'part')].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
}

export async function getAdminUsers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (data ?? []) as Array<{
    id: string;
    full_name: string | null;
    phone: string | null;
    role: UserRole;
    status: UserStatus;
    created_at: string;
  }>;
}

export async function getAdminDealers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('dealers')
    .select('id, slug, business_name, verified, active, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (data ?? []) as Array<{
    id: string;
    slug: string;
    business_name: string;
    verified: boolean;
    active: boolean;
    created_at: string;
  }>;
}

export async function getAdminReports() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('reports')
    .select('id, listing_kind, listing_id, reason, details, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (data ?? []) as Array<{
    id: string;
    listing_kind: ListingKind;
    listing_id: string;
    reason: string;
    details: string | null;
    status: 'open' | 'resolved' | 'dismissed';
    created_at: string;
  }>;
}

export async function getAdminVerifications() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('verifications')
    .select('id, profile_id, dealer_id, level, status, notes, requested_at, dealer:dealers(business_name, slug)')
    .order('requested_at', { ascending: false })
    .limit(100);

  return (data ?? []) as unknown as Array<{
    id: string;
    profile_id: string;
    dealer_id: string | null;
    level: string;
    status: 'pending' | 'approved' | 'rejected';
    notes: string | null;
    requested_at: string;
    dealer: { business_name: string; slug: string } | null;
  }>;
}

export async function getSearchMisses() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('search_misses')
    .select('id, listing_kind, query, filters, created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  return (data ?? []) as Array<{
    id: number;
    listing_kind: ListingKind;
    query: string | null;
    filters: Record<string, string> | null;
    created_at: string;
  }>;
}
