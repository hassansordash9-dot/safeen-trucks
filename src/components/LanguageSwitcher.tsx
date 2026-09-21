'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { localeNames, locales, type Locale } from '@/i18n/config';
import { IconGlobe } from './icons';
import { cn } from '@/lib/utils';

/** Kept outside the component so the locale cookie write is not a render-time mutation. */
function rememberLocale(locale: Locale) {
  document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageSwitcher({ locale, onDark = false }: { locale: Locale; onDark?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    const rest = pathname.split('/').slice(2).join('/');
    const query = window.location.search;
    rememberLocale(next);
    setOpen(false);
    startTransition(() => router.push(`/${next}${rest ? `/${rest}` : ''}${query}`));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn('btn px-2.5', onDark ? 'btn-ghost-dark' : 'btn-ghost')}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={pending}
      >
        <IconGlobe className="h-5 w-5" />
        <span className="hidden text-sm sm:inline">{localeNames[locale]}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="card absolute end-0 z-40 mt-1 w-40 overflow-hidden py-1 shadow-lg"
          >
            {locales.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l === locale}
                  onClick={() => switchTo(l)}
                  className={cn(
                    'w-full px-3 py-2.5 text-start text-sm hover:bg-[var(--color-surface)]',
                    l === locale &&
                      'bg-[var(--color-gold-soft)] font-semibold text-[var(--color-text)]',
                  )}
                >
                  {localeNames[l]}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
