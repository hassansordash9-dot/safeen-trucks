import Link from 'next/link';
import { Badge } from '@/components/ui';
import { DealerControls } from '@/features/admin/AdminControls';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getAdminDealers } from '@/features/admin/queries';
import { formatDate } from '@/lib/format';
import { routes } from '@/lib/routes';

export default async function AdminDealersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  const dealers = await getAdminDealers();

  return (
    <ul className="space-y-3">
      {dealers.map((dealer) => (
        <li key={dealer.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <Link
              href={routes.dealer(locale, dealer.slug)}
              className="font-semibold text-[var(--color-text)] hover:underline"
            >
              {dealer.business_name}
            </Link>
            <p className="text-sm text-[var(--color-muted)]">
              {formatDate(dealer.created_at, locale)}
            </p>
            {dealer.verified && <Badge tone="ok">{t('listing.verified')}</Badge>}
          </div>
          <DealerControls dealerId={dealer.id} verified={dealer.verified} />
        </li>
      ))}
      {dealers.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">{t('empty.dealersTitle')}</p>
      )}
    </ul>
  );
}
