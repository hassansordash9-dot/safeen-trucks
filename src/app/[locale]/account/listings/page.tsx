import Link from 'next/link';
import { EmptyState } from '@/components/ui';
import { ListingRow, type ListingRowData } from '@/features/account/ListingRow';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { requireUser } from '@/lib/auth';
import { getSellerTrucks } from '@/features/trucks/queries';
import { getSellerParts } from '@/features/parts/queries';
import { routes } from '@/lib/routes';

export default async function MyListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ locale }, { saved }] = await Promise.all([params, searchParams]);
  const user = await requireUser(locale, routes.accountListings(locale));
  const t = createTranslator(await getDictionary(locale));

  const [trucks, parts] = await Promise.all([getSellerTrucks(user.id), getSellerParts(user.id)]);

  const rows: ListingRowData[] = [
    ...trucks.map((truck) => ({
      id: truck.id,
      kind: 'truck' as const,
      slug: truck.slug,
      title: truck.title,
      price: truck.price,
      currency: truck.currency,
      status: truck.status,
      views: truck.views_count ?? 0,
      imagePath: truck.images?.find((i) => i.is_primary)?.path ?? truck.images?.[0]?.path ?? null,
      rejectionReason: truck.rejection_reason ?? null,
    })),
    ...parts.map((part) => ({
      id: part.id,
      kind: 'part' as const,
      slug: part.slug,
      title: part.title,
      price: part.price,
      currency: part.currency,
      status: part.status,
      views: part.views_count ?? 0,
      imagePath: part.images?.find((i) => i.is_primary)?.path ?? part.images?.[0]?.path ?? null,
      rejectionReason: part.rejection_reason ?? null,
    })),
  ];

  return (
    <div className="container-page max-w-4xl py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('account.myListings')}</h1>
        <Link href={routes.sell(locale)} className="btn btn-accent">
          {t('nav.sell')}
        </Link>
      </div>

      {saved && (
        <p role="status" className="mt-4 rounded-md bg-[var(--color-ok-soft)] p-3 text-sm text-[var(--color-ok)]">
          {saved === 'pending' ? t('sell.publishedPending') : t('sell.published')}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t('empty.noListings')}
            actions={
              <Link href={routes.sell(locale)} className="btn btn-primary">
                {t('home.sellCtaButton')}
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <ListingRow key={`${row.kind}-${row.id}`} listing={row} />
          ))}
        </ul>
      )}
    </div>
  );
}
