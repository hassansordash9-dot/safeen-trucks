import { notFound } from 'next/navigation';
import { PartWizard } from '@/features/parts/PartWizard';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { requireUser } from '@/lib/auth';
import { getBrands, getLocations, getPartCategories } from '@/lib/reference';
import { getPartById } from '@/features/parts/queries';
import { getDealerForOwner } from '@/features/dealers/queries';
import { routes } from '@/lib/routes';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function SellPartPage({ params, searchParams }: Props) {
  const [{ locale }, { id }] = await Promise.all([params, searchParams]);
  const user = await requireUser(locale, routes.sellPart(locale));
  const t = createTranslator(await getDictionary(locale));

  const [categories, brands, locations, dealer] = await Promise.all([
    getPartCategories(),
    getBrands(),
    getLocations(),
    getDealerForOwner(user.id),
  ]);

  const part = id ? await getPartById(id) : null;
  if (id && (!part || part.seller_id !== user.id)) notFound();

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="mb-5 text-2xl font-bold text-[var(--color-text)]">
        {part ? t('common.edit') : t('sell.aPart')}
      </h1>
      <PartWizard
        userId={user.id}
        part={part}
        dealerId={dealer?.id ?? null}
        defaults={{
          phone: user.profile?.phone ?? '',
          whatsapp: user.profile?.whatsapp ?? '',
        }}
        categories={categories}
        brands={brands}
        locations={locations}
      />
    </div>
  );
}
