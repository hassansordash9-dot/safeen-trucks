import Link from 'next/link';
import { DealerForm } from '@/features/dealers/DealerForm';
import { StatTile } from '@/components/ui';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { requireUser } from '@/lib/auth';
import { getLocations } from '@/lib/reference';
import { getDealerForOwner } from '@/features/dealers/queries';
import { getVerificationStatus } from '@/features/dealers/actions';
import { getDealerTrucks } from '@/features/trucks/queries';
import { getDealerParts } from '@/features/parts/queries';
import { formatNumber } from '@/lib/format';
import { routes } from '@/lib/routes';

export default async function DealerDashboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale, routes.dealerDashboard(locale));
  const t = createTranslator(await getDictionary(locale));

  const [locations, dealer] = await Promise.all([getLocations(), getDealerForOwner(user.id)]);
  const [verification, trucks, parts] = await Promise.all([
    dealer ? getVerificationStatus(dealer.id) : Promise.resolve(null),
    dealer ? getDealerTrucks(dealer.id) : Promise.resolve([]),
    dealer ? getDealerParts(dealer.id) : Promise.resolve([]),
  ]);

  return (
    <div className="container-page max-w-2xl py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {dealer ? t('dealer.dashboard') : t('dealer.create')}
        </h1>
        {dealer && (
          <Link href={routes.dealer(locale, dealer.slug)} className="btn btn-outline">
            {t('common.viewAll')}
          </Link>
        )}
      </div>

      {dealer && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatTile label={t('dealer.trucks')} value={formatNumber(trucks.length, locale)} />
          <StatTile label={t('dealer.parts')} value={formatNumber(parts.length, locale)} />
        </div>
      )}

      <div className="mt-6">
        <DealerForm dealer={dealer} locations={locations} verification={verification} />
      </div>
    </div>
  );
}
