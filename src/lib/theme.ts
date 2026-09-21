export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** Cookie so the server can render the right theme; mirrored to localStorage. */
export const THEME_COOKIE = 'safeen-theme';
export const THEME_STORAGE_KEY = 'safeen-theme';

export function isTheme(value: string | undefined | null): value is Theme {
  return value === 'light' || value === 'dark';
}

const listeners = new Set<() => void>();

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function paint(theme: Theme): void {
  const element = document.documentElement;
  element.dataset.theme = theme;
  element.style.colorScheme = theme;
}

export function applyTheme(theme: Theme): void {
  paint(theme);

  // The cookie is what the server reads on the next request, so there is no flash.
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode: the theme still applies for this session.
  }

  listeners.forEach((listener) => listener());
}

/**
 * Snapshot source for useSyncExternalStore. With no explicit choice the page
 * follows the OS through a CSS media query, so fall back to that here too.
 */
export function getThemeSnapshot(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (isTheme(chosen)) return chosen;
  return prefersDark() ? 'dark' : 'light';
}

export function getServerThemeSnapshot(): Theme {
  return 'light';
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);

  // Keep other tabs in step with the one that changed the setting.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    if (isTheme(event.newValue)) paint(event.newValue);
    listener();
  };
  window.addEventListener('storage', onStorage);

  // While no explicit choice exists, follow the OS switching light/dark.
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
    media.removeEventListener('change', listener);
  };
}
