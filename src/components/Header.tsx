import Link from 'next/link';
import { Logo } from './Logo';
import { HeaderNav } from './HeaderNav';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { IconHeart, IconPlus, IconSearch } from './icons';
import { routes } from '@/lib/routes';
import { getSessionUser } from '@/lib/auth';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';

export async function Header({ locale }: { locale: Locale }) {
  const [dict, user] = await Promise.all([getDictionary(locale), getSessionUser()]);
  const t = createTranslator(dict);

  const links = [
    { href: routes.trucks(locale), label: t('nav.trucks') },
    { href: routes.parts(locale), label: t('nav.parts') },
    { href: routes.dealers(locale), label: t('nav.dealers') },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-gold)]/25 bg-[var(--color-black)]">
      <div className="container-page flex h-16 items-center gap-3">
        <Logo locale={locale} tone="light" />

        <HeaderNav links={links} label={t('nav.menu')} />

        <div className="ms-auto flex items-center gap-1">
          <Link
            href={routes.trucks(locale)}
            className="btn btn-ghost-dark px-2.5 md:hidden"
            aria-label={t('nav.search')}
          >
            <IconSearch />
          </Link>
          <Link
            href={routes.saved(locale)}
            className="btn btn-ghost-dark hidden px-2.5 md:inline-flex"
            aria-label={t('nav.saved')}
          >
            <IconHeart />
          </Link>
          <ThemeToggle onDark />
          <LanguageSwitcher locale={locale} onDark />
          <UserMenu
            locale={locale}
            onDark
            name={user?.profile?.full_name ?? user?.email ?? null}
            role={user?.profile?.role ?? null}
            labels={{
              account: t('nav.account'),
              login: t('nav.login'),
              logout: t('nav.logout'),
              register: t('nav.register'),
              dashboard: t('account.myListings'),
              saved: t('nav.saved'),
              admin: t('nav.admin'),
            }}
          />
          <Link href={routes.sell(locale)} className="btn btn-accent hidden md:inline-flex">
            <IconPlus className="h-4 w-4" />
            {t('nav.sell')}
          </Link>
        </div>
      </div>
    </header>
  );
}
