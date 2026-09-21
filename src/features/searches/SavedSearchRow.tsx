'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { deleteSavedSearch } from './actions';
import { routes } from '@/lib/routes';

export function SavedSearchRow({
  search,
}: {
  search: {
    id: string;
    listing_kind: 'truck' | 'part';
    name: string;
    query: Record<string, string>;
  };
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const base = search.listing_kind === 'truck' ? routes.trucks(locale) : routes.parts(locale);
  const query = new URLSearchParams(search.query).toString();

  return (
    <li className="card flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <Link
          href={`${base}${query ? `?${query}` : ''}`}
          className="font-semibold text-[var(--color-text)] hover:underline"
        >
          {search.name}
        </Link>
        <p className="truncate text-sm text-[var(--color-muted)]">
          {Object.entries(search.query)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' · ')}
        </p>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteSavedSearch(search.id);
            router.refresh();
          })
        }
        className="btn btn-ghost h-9 min-h-9 px-3 text-xs text-[var(--color-bad)]"
      >
        {t('common.delete')}
      </button>
    </li>
  );
}
