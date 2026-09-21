import Link from 'next/link';
import { IconGear, IconTruck } from '@/components/icons';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getSessionUser } from '@/lib/auth';
import { routes } from '@/lib/routes';

export default async function SellPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  const user = await getSessionUser();

  const options = [
    {
      href: routes.sellTruck(locale),
      title: t('sell.aTruck'),
      body: t('sell.aTruckBody'),
      Icon: IconTruck,
    },
    {
      href: routes.sellPart(locale),
      title: t('sell.aPart'),
      body: t('sell.aPartBody'),
      Icon: IconGear,
    },
  ];

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('sell.chooseType')}</h1>

      {!user && (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          <Link
            href={routes.login(locale, routes.sell(locale))}
            className="font-semibold text-[var(--color-text)] hover:underline"
          >
            {t('sell.loginRequired')}
          </Link>
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {options.map(({ href, title, body, Icon }) => (
          <Link key={href} href={href} className="card p-5 hover:shadow-md">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-[var(--color-surface)] text-[var(--color-text)]">
              <Icon className="h-6 w-6" />
            </span>
            <h2 className="mt-3 font-bold text-[var(--color-text)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
