import Link from 'next/link';
import { Badge, EmptyState } from '@/components/ui';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { requireUser } from '@/lib/auth';
import { getMyRequests } from '@/features/account/queries';
import { formatDate, formatPrice } from '@/lib/format';
import { routes } from '@/lib/routes';

export default async function MyRequestsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const user = await requireUser(locale, routes.accountRequests(locale));
  const t = createTranslator(await getDictionary(locale));
  const { trucks, parts } = await getMyRequests(user.id);

  if (trucks.length === 0 && parts.length === 0) {
    return (
      <div className="container-page max-w-3xl py-8">
        <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">
          {t('account.myRequests')}
        </h1>
        <EmptyState
          title={t('empty.body')}
          actions={
            <>
              <Link href={routes.requestTruck(locale)} className="btn btn-primary">
                {t('request.truckTitle')}
              </Link>
              <Link href={routes.requestPart(locale)} className="btn btn-outline">
                {t('request.partTitle')}
              </Link>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">
        {t('account.myRequests')}
      </h1>

      <ul className="space-y-3">
        {trucks.map((request) => (
          <li key={request.id} className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <Badge>{t('request.truckTitle')}</Badge>
              <span className="text-xs text-[var(--color-muted)]">
                {formatDate(request.created_at, locale)}
              </span>
            </div>
            <p className="mt-2 font-semibold text-[var(--color-text)]">
              {request.model_text ?? t('request.truckTitle')}
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              {[request.year_from, request.year_to].filter(Boolean).join(' – ')}
              {request.max_price
                ? ` · ${formatPrice(request.max_price, request.currency, locale)}`
                : ''}
            </p>
            {request.notes && <p className="mt-1 text-sm">{request.notes}</p>}
          </li>
        ))}

        {parts.map((request) => (
          <li key={request.id} className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <Badge>{t('request.partTitle')}</Badge>
              <span className="text-xs text-[var(--color-muted)]">
                {formatDate(request.created_at, locale)}
              </span>
            </div>
            <p className="mt-2 font-semibold text-[var(--color-text)]">{request.description}</p>
            <p className="text-sm text-[var(--color-muted)]">
              {[request.model_text, request.year, request.part_number].filter(Boolean).join(' · ')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
