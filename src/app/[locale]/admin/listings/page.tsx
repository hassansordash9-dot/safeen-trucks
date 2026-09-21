import Link from 'next/link';
import { ListingModeration } from '@/features/admin/AdminControls';
import { ListingStatusBadge } from '@/components/ui';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getAdminListings } from '@/features/admin/queries';
import { formatDate, formatPrice } from '@/lib/format';
import { routes } from '@/lib/routes';
import type { ListingStatus } from '@/types';

const STATUSES: Array<ListingStatus | 'all'> = [
  'pending',
  'published',
  'rejected',
  'paused',
  'draft',
  'sold',
  'all',
];

export default async function AdminListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const t = createTranslator(await getDictionary(locale));
  const active = (status as ListingStatus) ?? 'pending';
  const listings = await getAdminListings(status === 'all' ? undefined : active);

  return (
    <div>
      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((value) => (
          <Link
            key={value}
            href={`/${locale}/admin/listings?status=${value}`}
            className={`btn whitespace-nowrap ${
              (status ?? 'pending') === value ? 'btn-primary' : 'btn-outline'
            }`}
          >
            {value === 'all' ? t('common.all') : t(`status.${value}`)}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">{t('empty.noListings')}</p>
      ) : (
        <ul className="space-y-3">
          {listings.map((listing) => (
            <li key={`${listing.kind}-${listing.id}`} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <ListingStatusBadge
                  status={listing.status}
                  label={t(`status.${listing.status}`)}
                />
                <span className="text-xs text-[var(--color-muted)]">
                  {listing.kind === 'truck' ? t('nav.trucks') : t('nav.parts')} ·{' '}
                  {formatDate(listing.created_at, locale)} · {listing.quality_score}/100
                </span>
              </div>

              <h2 className="mt-1 font-semibold text-[var(--color-text)]">
                <Link
                  href={
                    listing.kind === 'truck'
                      ? routes.truck(locale, listing.slug)
                      : routes.part(locale, listing.slug)
                  }
                  className="hover:underline"
                >
                  {listing.title}
                </Link>
              </h2>
              <p className="text-sm font-bold">
                {formatPrice(listing.price, listing.currency, locale)}
              </p>

              <ListingModeration
                kind={listing.kind}
                id={listing.id}
                status={listing.status}
                featured={listing.featured}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
