import type { Metadata } from 'next';
import { DealerCard } from '@/components/DealerCard';
import { EmptyState } from '@/components/ui';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { listDealers } from '@/features/dealers/queries';
import { localeAlternates } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ location?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  return {
    title: t('dealer.title'),
    description: t('dealer.subtitle'),
    alternates: localeAlternates(locale, 'dealers'),
  };
}

export default async function DealersPage({ params, searchParams }: Props) {
  const [{ locale }, { location }] = await Promise.all([params, searchParams]);
  const t = createTranslator(await getDictionary(locale));
  const dealers = await listDealers(location);

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('dealer.title')}</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{t('dealer.subtitle')}</p>

      <div className="mt-6">
        {dealers.length === 0 ? (
          <EmptyState title={t('empty.dealersTitle')} body={t('empty.body')} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dealers.map((dealer) => (
              <DealerCard key={dealer.id} dealer={dealer} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
