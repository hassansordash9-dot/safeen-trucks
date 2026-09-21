'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';

export function SortSelect({
  current,
  options,
}: {
  current: string;
  options: Array<{ value: string; labelKey: string }>;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  function change(value: string) {
    const next = new URLSearchParams(window.location.search);
    next.delete('page');
    if (value === 'newest') next.delete('sort');
    else next.set('sort', value);
    const query = next.toString();
    router.push(`${pathname}${query ? `?${query}` : ''}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-[var(--color-muted)]">{t('filters.sort')}</span>
      <select
        className="field w-auto py-2"
        value={current}
        onChange={(event) => change(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}
