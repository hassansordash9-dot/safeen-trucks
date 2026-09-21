import Link from 'next/link';
import { TruckCard } from '@/components/TruckCard';
import { PartCard } from '@/components/PartCard';
import { EmptyState, SectionHeader } from '@/components/ui';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { requireUser } from '@/lib/auth';
import { getFavorites } from '@/features/favorites/queries';
import { routes } from '@/lib/routes';

export default async function SavedPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  await requireUser(locale, routes.saved(locale));
  const t = createTranslator(await getDictionary(locale));
  const { trucks, parts } = await getFavorites();

  const isEmpty = trucks.length === 0 && parts.length === 0;

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('account.favorites')}</h1>

      {isEmpty ? (
        <div className="mt-6">
          <EmptyState
            title={t('empty.noFavorites')}
            actions={
              <Link href={routes.trucks(locale)} className="btn btn-primary">
                {t('home.quickTrucks')}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-10">
          {trucks.length > 0 && (
            <section>
              <SectionHeader title={t('nav.trucks')} />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {trucks.map((truck) => (
                  <TruckCard key={truck.id} truck={truck} locale={locale} favorited />
                ))}
              </div>
            </section>
          )}

          {parts.length > 0 && (
            <section>
              <SectionHeader title={t('nav.parts')} />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {parts.map((part) => (
                  <PartCard key={part.id} part={part} locale={locale} favorited />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
