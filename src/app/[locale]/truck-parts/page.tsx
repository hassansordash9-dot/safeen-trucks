import type { Metadata } from 'next';
import Link from 'next/link';
import { PartCard } from '@/components/PartCard';
import { PartFilters } from '@/components/PartFilters';
import { FilterShell } from '@/components/FilterShell';
import { SortSelect } from '@/components/SortSelect';
import { EmptyState, Pagination } from '@/components/ui';
import { CategoryCard } from '@/components/CategoryCard';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getBrands, getLocations, getPartCategories } from '@/lib/reference';
import { searchParts } from '@/features/parts/queries';
import { parsePartFilters, partFiltersToParams } from '@/features/parts/filters';
import { getFavoriteIds } from '@/features/favorites/queries';
import { recordSearchMiss } from '@/features/searches/track';
import { localeAlternates } from '@/lib/seo';
import { formatNumber, localisedName } from '@/lib/format';
import { routes } from '@/lib/routes';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'filters.sortNewest' },
  { value: 'price_asc', labelKey: 'filters.sortPriceAsc' },
  { value: 'price_desc', labelKey: 'filters.sortPriceDesc' },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  return {
    title: t('nav.parts'),
    description: t('home.heroSubtitle'),
    alternates: localeAlternates(locale, 'truck-parts'),
  };
}

export default async function PartsPage({ params, searchParams }: Props) {
  const [{ locale }, rawParams] = await Promise.all([params, searchParams]);
  const t = createTranslator(await getDictionary(locale));
  const filters = parsePartFilters(rawParams);

  const [categories, brands, locations, result, favorites] = await Promise.all([
    getPartCategories(),
    getBrands(),
    getLocations(),
    searchParts(filters),
    getFavoriteIds('part'),
  ]);

  if (result.total === 0) await recordSearchMiss('part', filters.q ?? null, filters, locale);

  const queryParams = partFiltersToParams(filters);
  const activeCount = Object.keys(queryParams).filter((k) => k !== 'sort' && k !== 'page').length;
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="container-page py-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('nav.parts')}</h1>

      <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
        {categories.map((category) => (
          <li key={category.id}>
            <CategoryCard
              href={routes.partCategory(locale, category.slug)}
              label={localisedName(category, locale)}
              slug={category.slug}
              kind="part"
            />
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <FilterShell activeCount={activeCount}>
            <div className="card p-4">
              <PartFilters
                filters={filters}
                categories={categories}
                brands={brands}
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
            <SortSelect current={filters.sort} options={SORT_OPTIONS} />
          </div>

          {result.rows.length === 0 ? (
            <EmptyState
              title={t('empty.partsTitle')}
              body={t('empty.body')}
              actions={
                <>
                  <Link href={routes.parts(locale)} className="btn btn-outline">
                    {t('filters.clearAll')}
                  </Link>
                  <Link href={routes.requestPart(locale)} className="btn btn-accent">
                    {t('empty.postWantedPart')}
                  </Link>
                </>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {result.rows.map((part) => (
                <PartCard
                  key={part.id}
                  part={part}
                  locale={locale}
                  favorited={favorites.has(part.id)}
                />
              ))}
            </div>
          )}

          <Pagination
            page={result.page}
            totalPages={totalPages}
            basePath={routes.parts(locale)}
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
