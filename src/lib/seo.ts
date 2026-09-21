import { localeHtmlLang, locales, type Locale } from '@/i18n/config';

const trim = (value: string) => value.replace(/\/$/, '');

const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(url);

/**
 * Canonical origin for metadata, sitemap and robots.
 *
 * NEXT_PUBLIC_SITE_URL is inlined at build time, so a leftover localhost value
 * would otherwise brand every production canonical as localhost. In production
 * a local value is ignored in favour of whatever the host injects at runtime.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const production = process.env.NODE_ENV === 'production';

  if (configured && !(production && isLocal(configured))) return trim(configured);

  // Netlify injects URL for production and DEPLOY_PRIME_URL for branch/preview builds.
  if (process.env.URL) return trim(process.env.URL);
  if (process.env.DEPLOY_PRIME_URL) return trim(process.env.DEPLOY_PRIME_URL);
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return configured ? trim(configured) : 'http://localhost:3000';
}

/** Brand logo path, used by Organization structured data and social cards. */
export const LOGO_PATH = '/safeen-logo.jpg';

/** Canonical + hreflang block for a path that exists in all three locales. */
export function localeAlternates(locale: Locale, pathWithoutLocale: string) {
  const path = pathWithoutLocale.replace(/^\//, '');
  const build = (l: Locale) => `/${l}${path ? `/${path}` : ''}`;
  return {
    canonical: build(locale),
    languages: Object.fromEntries(locales.map((l) => [localeHtmlLang[l], build(l)])),
  };
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
