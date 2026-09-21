import type { Metadata } from 'next';
import Link from 'next/link';
import { TruckCard } from '@/components/TruckCard';
import { TruckFilters } from '@/components/TruckFilters';
import { FilterShell } from '@/components/FilterShell';
import { SortSelect } from '@/components/SortSelect';
import { SaveSearchButton } from '@/components/SaveSearchButton';
import { EmptyState, Pagination } from '@/components/ui';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getBrands, getLocations, getModels, getTruckTypes } from '@/lib/reference';
import { searchTrucks } from '@/features/trucks/queries';
import { parseTruckFilters, truckFiltersToParams, TRUCK_SORTS } from '@/features/trucks/filters';
import { getFavoriteIds } from '@/features/favorites/queries';
import { recordSearchMiss } from '@/features/searches/track';
import { localeAlternates } from '@/lib/seo';
import { formatNumber } from '@/lib/format';
import { routes } from '@/lib/routes';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SORT_OPTIONS = [
  { value: TRUCK_SORTS[0], labelKey: 'filters.sortNewest' },
  { value: TRUCK_SORTS[1], labelKey: 'filters.sortPriceAsc' },
  { value: TRUCK_SORTS[2], labelKey: 'filters.sortPriceDesc' },
  { value: TRUCK_SORTS[3], labelKey: 'filters.sortMileage' },
  { value: TRUCK_SORTS[4], labelKey: 'filters.sortYear' },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  return {
    title: t('nav.trucks'),
    description: t('home.heroSubtitle'),
    alternates: localeAlternates(locale, 'trucks'),
  };
}

export default async function TrucksPage({ params, searchParams }: Props) {
  const [{ locale }, rawParams] = await Promise.all([params, searchParams]);
  const t = createTranslator(await getDictionary(locale));
  const filters = parseTruckFilters(rawParams);

  const [brands, models, types, locations, result, favorites] = await Promise.all([
    getBrands(),
    getModels(),
    getTruckTypes(),
    getLocations(),
    searchTrucks(filters),
    getFavoriteIds('truck'),
  ]);

  if (result.total === 0) await recordSearchMiss('truck', filters.q ?? null, filters, locale);

  const queryParams = truckFiltersToParams(filters);
  const activeCount = Object.keys(queryParams).filter((key) => key !== 'sort' && key !== 'page')
    .length;
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="container-page py-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('nav.trucks')}</h1>

      <div className="mt-5 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <FilterShell activeCount={activeCount}>
            <div className="card p-4">
              <TruckFilters
                filters={filters}
                brands={brands}
                models={models}
                types={types}
                locations={locations}
              />
            </div>
          </FilterShell>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-muted)]">
              {formatNumber(result.total, locale)} {t('common.results')}
            </p>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <SaveSearchButton
                  kind="truck"
                  name={buildSearchName(filters, brands)}
                  query={queryParams}
                />
              )}
              <SortSelect current={filters.sort} options={SORT_OPTIONS} />
            </div>
          </div>

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
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
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
          )}

          <Pagination
            page={result.page}
            totalPages={totalPages}
            basePath={routes.trucks(locale)}
            params={queryParams}
            labels={{
              previous: t('common.back'),
              next: t('common.next'),
              page: t('common.page'),
              of: t('common.of'),
            }}
          />
        </section>
      </div>
    </div>
  );
}

function buildSearchName(
  filters: ReturnType<typeof parseTruckFilters>,
  brands: Array<{ slug: string; name: string }>,
): string {
  const brand = brands.find((b) => b.slug === filters.brand)?.name;
  return [brand, filters.model, filters.q, filters.location].filter(Boolean).join(' · ') || 'Trucks';
}
