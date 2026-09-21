'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { IconHeart } from './icons';
import { toggleFavorite } from '@/features/favorites/actions';
import { useI18n } from '@/i18n/I18nProvider';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { ListingKind } from '@/types';

export function FavoriteButton({
  kind,
  listingId,
  initial,
  variant = 'overlay',
}: {
  kind: ListingKind;
  listingId: string;
  initial: boolean;
  variant?: 'overlay' | 'inline';
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [favorited, setFavorited] = useState(initial);
  const [pending, startTransition] = useTransition();

  function onClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      const result = await toggleFavorite(kind, listingId);
      if (!result.ok) {
        setFavorited(!next);
        if (result.reason === 'auth') router.push(routes.login(locale, window.location.pathname));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={favorited}
      aria-label={t('nav.saved')}
      className={cn(
        'grid place-items-center transition-colors',
        variant === 'overlay'
          ? 'absolute end-2 top-2 h-9 w-9 rounded-full bg-[var(--color-card)]/90 text-[var(--color-text)] shadow-sm hover:bg-[var(--color-card)]'
          : 'btn btn-outline h-11 w-11 p-0',
        favorited && 'text-[var(--color-bad)]',
      )}
    >
      <IconHeart filled={favorited} className="h-5 w-5" />
    </button>
  );
}
