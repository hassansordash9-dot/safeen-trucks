'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { saveSearch } from '@/features/searches/actions';
import { routes } from '@/lib/routes';
import type { ListingKind } from '@/types';

export function SaveSearchButton({
  kind,
  name,
  query,
}: {
  kind: ListingKind;
  name: string;
  query: Record<string, string>;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await saveSearch(kind, name, query);
      if (result.ok) setDone(true);
      else if (result.reason === 'auth') router.push(routes.login(locale, window.location.pathname));
    });
  }

  return (
    <button type="button" onClick={onClick} disabled={pending || done} className="btn btn-outline">
      {done ? t('account.searchSaved') : t('account.saveSearch')}
    </button>
  );
}
