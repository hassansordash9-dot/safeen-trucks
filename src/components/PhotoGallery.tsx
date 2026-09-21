'use client';

import Image from 'next/image';
import { useState } from 'react';
import { IconChevron } from './icons';
import { useI18n } from '@/i18n/I18nProvider';
import { imageUrl } from '@/lib/images';
import { cn } from '@/lib/utils';
import type { ListingImage } from '@/types';

export function PhotoGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);

  const ordered = [...images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );

  if (ordered.length === 0) {
    return (
      <div className="card grid aspect-[4/3] place-items-center bg-[var(--color-surface)] text-sm text-[var(--color-muted)]">
        {t('listing.noPhotos')}
      </div>
    );
  }

  const current = ordered[Math.min(index, ordered.length - 1)];
  const move = (step: number) =>
    setIndex((value) => (value + step + ordered.length) % ordered.length);

  return (
    <div>
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-surface)]"
        role="group"
        aria-label={t('listing.photoOf', { n: index + 1, total: ordered.length })}
      >
        <Image
          src={imageUrl(current.path) ?? ''}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />

        {ordered.length > 1 && (
          <>
            <GalleryArrow side="start" onClick={() => move(-1)} label={t('common.back')} />
            <GalleryArrow side="end" onClick={() => move(1)} label={t('common.next')} />
            <span className="absolute bottom-2 end-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
              {index + 1} / {ordered.length}
            </span>
          </>
        )}
      </div>

      {ordered.length > 1 && (
        <ul className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {ordered.map((image, i) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index}
                className={cn(
                  'relative block h-16 w-20 shrink-0 overflow-hidden rounded border-2',
                  i === index ? 'border-[var(--color-black)]' : 'border-transparent',
                )}
              >
                <Image
                  src={imageUrl(image.path) ?? ''}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GalleryArrow({
  side,
  onClick,
  label,
}: {
  side: 'start' | 'end';
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[var(--color-card)]/90 text-[var(--color-text)] shadow-sm hover:bg-[var(--color-card)]',
        side === 'start' ? 'start-2' : 'end-2',
      )}
    >
      <IconChevron
        className={cn('h-5 w-5', side === 'start' ? 'rotate-180 rtl:rotate-0' : 'rtl:rotate-180')}
      />
    </button>
  );
}
