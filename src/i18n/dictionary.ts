import 'server-only';
import type { Locale } from './config';

const loaders = {
  en: () => import('@/locales/en.json').then((m) => m.default),
  ku: () => import('@/locales/ku.json').then((m) => m.default),
  ar: () => import('@/locales/ar.json').then((m) => m.default),
} as const;

export type Dictionary = Awaited<ReturnType<(typeof loaders)['en']>>;

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}
