import Link from 'next/link';
import { StatTile } from '@/components/ui';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { requireUser } from '@/lib/auth';
import { getSellerStats } from '@/features/account/queries';
import { getDealerForOwner } from '@/features/dealers/queries';
import { formatNumber } from '@/lib/format';
import { routes } from '@/lib/routes';

export default async function AccountPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const user = await requireUser(locale, `/${locale}/account`);
  const t = createTranslator(await getDictionary(locale));
  const [stats, dealer] = await Promise.all([
    getSellerStats(user.id),
    getDealerForOwner(user.id),
  ]);

  const tiles = [
    { label: t('account.activeListings'), value: stats.activeListings },
    { label: t('account.totalViews'), value: stats.views },
    { label: t('account.whatsappClicks'), value: stats.whatsappClicks },
    { label: t('account.callClicks'), value: stats.callClicks },
  ];

  const links = [
    { href: routes.accountListings(locale), label: t('account.myListings') },
    { href: routes.saved(locale), label: t('account.favorites') },
    { href: routes.accountSearches(locale), label: t('account.savedSearches') },
    { href: routes.accountRequests(locale), label: t('account.myRequests') },
    { href: routes.accountProfile(locale), label: t('account.profile') },
    {
      href: routes.dealerDashboard(locale),
      label: dealer ? t('dealer.dashboard') : t('account.becomeDealer'),
    },
  ];

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('account.title')}</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {user.profile?.full_name ?? user.email}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <StatTile key={tile.label} label={tile.label} value={formatNumber(tile.value, locale)} />
        ))}
      </div>

      <nav className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="card p-4 font-semibold hover:shadow-md">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
