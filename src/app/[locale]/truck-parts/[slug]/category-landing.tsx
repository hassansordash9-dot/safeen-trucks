import Link from 'next/link';
import { PartCard } from '@/components/PartCard';
import { EmptyState, Pagination } from '@/components/ui';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { searchParts } from '@/features/parts/queries';
import { parsePartFilters, partFiltersToParams } from '@/features/parts/filters';
import { getFavoriteIds } from '@/features/favorites/queries';
import { formatNumber, localisedName } from '@/lib/format';
import { routes } from '@/lib/routes';
import type { PartCategory } from '@/types';

/** SEO landing page for /truck-parts/<category>, rendered by the shared [slug] route. */
export default async function CategoryLanding({
  locale,
  category,
  searchParams,
}: {
  locale: Locale;
  category: PartCategory;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const t = createTranslator(await getDictionary(locale));
  const filters = parsePartFilters({ ...searchParams, category: category.slug });

  const [result, favorites] = await Promise.all([searchParts(filters), getFavoriteIds('part')]);
  const queryParams = partFiltersToParams({ ...filters, category: undefined });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="container-page py-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {localisedName(category, locale)}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {formatNumber(result.total, locale)} {t('common.results')}
      </p>

      <div className="mt-6">
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
      </div>

      <Pagination
        page={result.page}
        totalPages={totalPages}
        basePath={routes.partCategory(locale, category.slug)}
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
