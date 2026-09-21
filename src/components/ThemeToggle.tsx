'use client';

import { useSyncExternalStore } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import {
  applyTheme,
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeTheme,
} from '@/lib/theme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  const { t } = useI18n();
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const isDark = theme === 'dark';
  const label = t(isDark ? 'theme.switchToLight' : 'theme.switchToDark');

  return (
    <button
      type="button"
      onClick={() => applyTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={cn('btn px-2.5', onDark ? 'btn-ghost-dark' : 'btn-ghost')}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M20 13.5A8.2 8.2 0 0 1 10.5 4a8.3 8.3 0 1 0 9.5 9.5Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4" />
    </svg>
  );
}
