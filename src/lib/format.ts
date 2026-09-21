import type { Locale } from '@/i18n/config';
import type { CurrencyCode } from '@/types';

/** Latin digits everywhere: prices and mileages are read the same way across all three locales. */
const numberLocale: Record<Locale, string> = {
  en: 'en-US',
  ku: 'en-US',
  ar: 'ar-IQ-u-nu-latn',
};

export function formatPrice(
  amount: number | null | undefined,
  currency: CurrencyCode,
  locale: Locale,
): string {
  if (amount === null || amount === undefined) return '—';
  const formatted = new Intl.NumberFormat(numberLocale[locale], {
    maximumFractionDigits: 0,
  }).format(amount);
  return currency === 'USD' ? `$${formatted}` : `${formatted} IQD`;
}

export function formatNumber(value: number | null | undefined, locale: Locale): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat(numberLocale[locale], { maximumFractionDigits: 0 }).format(value);
}

export function formatDate(value: string | null | undefined, locale: Locale): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(numberLocale[locale], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function formatMonthYear(value: string | null | undefined, locale: Locale): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(numberLocale[locale], {
    year: 'numeric',
    month: 'long',
  }).format(new Date(value));
}

type Localised = { name_en: string; name_ku: string; name_ar: string };

export function localisedName(row: Localised | null | undefined, locale: Locale): string {
  if (!row) return '';
  return locale === 'ku' ? row.name_ku : locale === 'ar' ? row.name_ar : row.name_en;
}
