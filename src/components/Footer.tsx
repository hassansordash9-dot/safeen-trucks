import Link from 'next/link';
import { Logo } from './Logo';
import { routes } from '@/lib/routes';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';

export async function Footer({ locale }: { locale: Locale }) {
  const t = createTranslator(await getDictionary(locale));

  const columns = [
    {
      title: t('nav.trucks'),
      links: [
        { href: routes.trucks(locale), label: t('nav.trucks') },
        { href: routes.parts(locale), label: t('nav.parts') },
        { href: routes.dealers(locale), label: t('nav.dealers') },
        { href: routes.sell(locale), label: t('nav.sell') },
      ],
    },
    {
      title: t('footer.help'),
      links: [
        { href: `/${locale}/help`, label: t('footer.help') },
        { href: `/${locale}/contact`, label: t('footer.contact') },
        { href: routes.requestTruck(locale), label: t('request.truckTitle') },
        { href: routes.requestPart(locale), label: t('request.partTitle') },
      ],
    },
    {
      title: t('footer.about'),
      links: [
        { href: `/${locale}/about`, label: t('footer.about') },
        { href: `/${locale}/privacy`, label: t('footer.privacy') },
        { href: `/${locale}/terms`, label: t('footer.terms') },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t-2 border-[var(--color-gold)]/40 bg-[var(--color-black)] text-white">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo locale={locale} tone="light" />
          <p className="mt-3 max-w-xs text-sm text-white/70">{t('footer.tagline')}</p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-white/90 uppercase">
              {column.title}
            </h2>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 transition-colors hover:text-[var(--color-gold)]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-4 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {t('brand.name')}. {t('footer.rights')}
          </span>
          <span>{t('brand.slogan')}</span>
        </div>
      </div>
    </footer>
  );
}
