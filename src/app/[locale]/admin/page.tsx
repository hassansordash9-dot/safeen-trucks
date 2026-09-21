import { StatTile } from '@/components/ui';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getAdminOverview, getSearchMisses } from '@/features/admin/queries';
import { formatDate, formatNumber } from '@/lib/format';

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  const [overview, misses] = await Promise.all([getAdminOverview(), getSearchMisses()]);

  const tiles = [
    { label: t('admin.pendingReview'), value: overview.pending },
    { label: t('admin.openReports'), value: overview.reports },
    { label: t('admin.pendingVerifications'), value: overview.verifications },
    { label: t('admin.dealers'), value: overview.dealers },
    { label: t('admin.newUsers'), value: overview.users },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <StatTile key={tile.label} label={tile.label} value={formatNumber(tile.value, locale)} />
        ))}
      </div>

      {misses.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold text-[var(--color-text)]">
            {t('common.search')} — 0 {t('common.results')}
          </h2>
          <ul className="card divide-y divide-[var(--color-line)]">
            {misses.map((miss) => (
              <li key={miss.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span>
                  <span className="font-medium">{miss.query ?? '—'}</span>{' '}
                  <span className="text-[var(--color-muted)]">
                    {miss.filters
                      ? Object.entries(miss.filters)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(' · ')
                      : ''}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-[var(--color-muted)]">
                  {formatDate(miss.created_at, locale)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
