import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { I18nProvider } from '@/i18n/I18nProvider';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import { isLocale, localeDir, localeHtmlLang, locales, type Locale } from '@/i18n/config';
import { SetupNotice } from '@/components/SetupNotice';
import { isSupabaseConfigured } from '@/lib/env';
import { LOGO_PATH, siteUrl } from '@/lib/seo';
import { THEME_COOKIE, isTheme } from '@/lib/theme';
import '../globals.css';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#D8B44A' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0B0B' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator(await getDictionary(locale));

  const title = t('seo.title');
  const description = t('seo.description');

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s | ${t('brand.name')}` },
    description,
    applicationName: 'Safeen Trucks',
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
      apple: [{ url: LOGO_PATH }],
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [localeHtmlLang[l], `/${l}`])),
    },
    openGraph: {
      type: 'website',
      siteName: 'Safeen Trucks',
      title,
      description,
      url: `/${locale}`,
      locale: localeHtmlLang[locale],
      images: [{ url: LOGO_PATH, width: 1254, height: 1254, alt: 'Safeen Trucks' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [LOGO_PATH],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typed = locale as Locale;
  const dict = await getDictionary(typed);
  const t = createTranslator(dict);
  const configured = isSupabaseConfigured;

  // Rendered on the server, so the correct theme is in the HTML before first paint.
  const stored = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isTheme(stored) ? stored : undefined;

  return (
    <html lang={localeHtmlLang[typed]} dir={localeDir[typed]} data-theme={theme}>
      <body className="flex min-h-dvh flex-col bg-[var(--color-page)]">
        <I18nProvider locale={typed} dict={dict}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-[var(--color-card)] focus:px-3 focus:py-2 focus:shadow"
          >
            {t('nav.menu')}
          </a>
          {configured && <Header locale={typed} />}
          <main id="main" className="pb-mobile-nav flex-1">
            {configured ? children : <SetupNotice />}
          </main>
          {configured && <Footer locale={typed} />}
          {configured && (
            <MobileNav
              locale={typed}
              labels={{
                home: t('nav.home'),
                search: t('nav.search'),
                sell: t('nav.sell'),
                saved: t('nav.saved'),
                account: t('nav.account'),
              }}
            />
          )}
        </I18nProvider>
      </body>
    </html>
  );
}
