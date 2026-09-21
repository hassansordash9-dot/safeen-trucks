import Link from 'next/link';
import { TruckCard } from '@/components/TruckCard';
import { EmptyState, Pagination, SectionHeader } from '@/components/ui';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { searchTrucks } from '@/features/trucks/queries';
import { parseTruckFilters, truckFiltersToParams } from '@/features/trucks/filters';
import { getFavoriteIds } from '@/features/favorites/queries';
import { getModels } from '@/lib/reference';
import { formatNumber } from '@/lib/format';
import { routes } from '@/lib/routes';
import type { TruckBrand } from '@/types';

/** SEO landing page for /trucks/<brand>, rendered by the shared [slug] route. */
export default async function BrandLanding({
  locale,
  brand,
  searchParams,
}: {
  locale: Locale;
  brand: TruckBrand;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const t = createTranslator(await getDictionary(locale));
  const filters = parseTruckFilters({ ...searchParams, brand: brand.slug });

  const [result, favorites, models] = await Promise.all([
    searchTrucks(filters),
    getFavoriteIds('truck'),
    getModels(brand.id),
  ]);

  const queryParams = truckFiltersToParams({ ...filters, brand: undefined });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="container-page py-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {brand.name} {t('nav.trucks')}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {formatNumber(result.total, locale)} {t('common.results')}
      </p>

      {models.length > 0 && (
        <ul className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {models.map((model) => (
            <li key={model.id}>
              <Link
                href={`${routes.trucks(locale)}?brand=${brand.slug}&model=${model.slug}`}
                className="btn btn-outline whitespace-nowrap"
              >
                {model.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        {result.rows.length === 0 ? (
          <EmptyState
            title={t('empty.trucksTitle')}
            body={t('empty.body')}
            actions={
              <>
                <Link href={routes.trucks(locale)} className="btn btn-outline">
                  {t('filters.clearAll')}
                </Link>
                <Link href={routes.requestTruck(locale)} className="btn btn-accent">
                  {t('empty.postWantedTruck')}
                </Link>
              </>
            }
          />
        ) : (
          <>
            <SectionHeader
              title={`${brand.name} — ${t('home.latestTrucks')}`}
              href={`${routes.trucks(locale)}?brand=${brand.slug}`}
              linkLabel={t('filters.title')}
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {result.rows.map((truck, index) => (
                <TruckCard
                  key={truck.id}
                  truck={truck}
                  locale={locale}
                  favorited={favorites.has(truck.id)}
                  priority={index < 4}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Pagination
        page={result.page}
        totalPages={totalPages}
        basePath={routes.truckBrand(locale, brand.slug)}
        params={queryParams}
        labels={{
          previous: t('common.back'),
          next: t('common.next'),
          page: t('common.page'),
          of: t('common.of'),
        }}
      />
    </div>
  );
}
