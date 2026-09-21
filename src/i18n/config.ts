export const locales = ['en', 'ku', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeDir: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ku: 'rtl',
  ar: 'rtl',
};

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ku: 'کوردی',
  ar: 'العربية',
};

export const localeHtmlLang: Record<Locale, string> = {
  en: 'en',
  ku: 'ckb',
  ar: 'ar',
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
