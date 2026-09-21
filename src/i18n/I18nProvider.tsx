'use client';

import { createContext, useContext, useMemo } from 'react';
import { createTranslator, type Dict, type Translator } from './translate';
import { localeDir, type Locale } from './config';

type Ctx = { locale: Locale; dir: 'ltr' | 'rtl'; t: Translator };

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dict;
  children: React.ReactNode;
}) {
  const value = useMemo<Ctx>(
    () => ({ locale, dir: localeDir[locale], t: createTranslator(dict) }),
    [locale, dict],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export function useT(): Translator {
  return useI18n().t;
}
