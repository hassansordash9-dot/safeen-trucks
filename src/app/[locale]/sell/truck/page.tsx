import { notFound } from 'next/navigation';
import { TruckWizard } from '@/features/trucks/TruckWizard';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { requireUser } from '@/lib/auth';
import { getBrands, getLocations, getModels, getTruckTypes } from '@/lib/reference';
import { getTruckById } from '@/features/trucks/queries';
import { getDealerForOwner } from '@/features/dealers/queries';
import { routes } from '@/lib/routes';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function SellTruckPage({ params, searchParams }: Props) {
  const [{ locale }, { id }] = await Promise.all([params, searchParams]);
  const user = await requireUser(locale, routes.sellTruck(locale));
  const t = createTranslator(await getDictionary(locale));

  const [brands, models, types, locations, dealer] = await Promise.all([
    getBrands(),
    getModels(),
    getTruckTypes(),
    getLocations(),
    getDealerForOwner(user.id),
  ]);

  const truck = id ? await getTruckById(id) : null;
  if (id && (!truck || truck.seller_id !== user.id)) notFound();

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="mb-5 text-2xl font-bold text-[var(--color-text)]">
        {truck ? t('common.edit') : t('sell.aTruck')}
      </h1>
      <TruckWizard
        userId={user.id}
        truck={truck}
        dealerId={dealer?.id ?? null}
        defaults={{
          phone: user.profile?.phone ?? '',
          whatsapp: user.profile?.whatsapp ?? '',
        }}
        brands={brands}
        models={models}
        types={types}
        locations={locations}
      />
    </div>
  );
}
