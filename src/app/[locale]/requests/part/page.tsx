import { PartRequestForm } from '@/features/requests/RequestForms';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getSessionUser } from '@/lib/auth';
import { getBrands, getLocations } from '@/lib/reference';

export default async function PartRequestPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  const [brands, locations, user] = await Promise.all([
    getBrands(),
    getLocations(),
    getSessionUser(),
  ]);

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('request.partTitle')}</h1>
      <p className="mt-1 mb-5 text-sm text-[var(--color-muted)]">{t('request.partBody')}</p>
      <PartRequestForm
        brands={brands}
        locations={locations}
        defaultPhone={user?.profile?.phone ?? ''}
      />
    </div>
  );
}
