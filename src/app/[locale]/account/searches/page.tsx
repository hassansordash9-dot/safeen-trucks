import Link from 'next/link';
import { EmptyState } from '@/components/ui';
import { SavedSearchRow } from '@/features/searches/SavedSearchRow';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { requireUser } from '@/lib/auth';
import { getSavedSearches } from '@/features/account/queries';
import { routes } from '@/lib/routes';

export default async function SavedSearchesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale, routes.accountSearches(locale));
  const t = createTranslator(await getDictionary(locale));
  const searches = await getSavedSearches(user.id);

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {t('account.savedSearches')}
      </h1>

      {searches.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t('empty.noSavedSearches')}
            actions={
              <Link href={routes.trucks(locale)} className="btn btn-primary">
                {t('home.quickTrucks')}
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {searches.map((search) => (
            <SavedSearchRow key={search.id} search={search} />
          ))}
        </ul>
      )}
    </div>
  );
}
