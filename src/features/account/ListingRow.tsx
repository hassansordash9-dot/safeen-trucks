'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { ListingStatusBadge } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';
import { formatPrice } from '@/lib/format';
import { imageUrl } from '@/lib/images';
import { routes } from '@/lib/routes';
import { deleteTruck, setTruckStatus } from '@/features/trucks/actions';
import { deletePart, setPartStatus } from '@/features/parts/actions';
import type { CurrencyCode, ListingKind, ListingStatus } from '@/types';

export type ListingRowData = {
  id: string;
  kind: ListingKind;
  slug: string;
  title: string;
  price: number;
  currency: CurrencyCode;
  status: ListingStatus;
  views: number;
  imagePath: string | null;
  rejectionReason: string | null;
};

export function ListingRow({ listing }: { listing: ListingRowData }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setStatus = listing.kind === 'truck' ? setTruckStatus : setPartStatus;
  const remove = listing.kind === 'truck' ? deleteTruck : deletePart;
  const image = imageUrl(listing.imagePath);
  const publicHref =
    listing.kind === 'truck' ? routes.truck(locale, listing.slug) : routes.part(locale, listing.slug);
  const editHref =
    listing.kind === 'truck' ? routes.editTruck(locale, listing.id) : routes.editPart(locale, listing.id);

  function run(action: () => Promise<boolean>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <li className="card flex gap-3 p-3">
      <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded bg-[var(--color-surface)]">
        {image && <Image src={image} alt="" fill sizes="96px" className="object-cover" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <ListingStatusBadge status={listing.status} label={t(`status.${listing.status}`)} />
          <span className="text-xs text-[var(--color-muted)]">
            {listing.views} {t('listing.views')}
          </span>
        </div>

        <h3 className="mt-1 line-clamp-1 font-semibold text-[var(--color-text)]">
          {listing.status === 'published' || listing.status === 'sold' ? (
            <Link href={publicHref} className="hover:underline">
              {listing.title}
            </Link>
          ) : (
            listing.title
          )}
        </h3>

        <p className="text-sm font-bold text-[var(--color-text)]">
          {formatPrice(listing.price, listing.currency, locale)}
        </p>

        {listing.status === 'rejected' && listing.rejectionReason && (
          <p className="mt-1 text-sm text-[var(--color-bad)]">{listing.rejectionReason}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          <Link href={editHref} className="btn btn-outline h-9 min-h-9 px-3 text-xs">
            {t('common.edit')}
          </Link>

          {listing.status === 'published' && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setStatus(listing.id, 'paused'))}
              className="btn btn-outline h-9 min-h-9 px-3 text-xs"
            >
              {t('account.pause')}
            </button>
          )}

          {listing.status === 'paused' && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setStatus(listing.id, 'published'))}
              className="btn btn-outline h-9 min-h-9 px-3 text-xs"
            >
              {t('account.resume')}
            </button>
          )}

          {(listing.status === 'published' || listing.status === 'paused') && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setStatus(listing.id, 'sold'))}
              className="btn btn-outline h-9 min-h-9 px-3 text-xs"
            >
              {t('account.markSold')}
            </button>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm(t('account.confirmDelete'))) run(() => remove(listing.id));
            }}
            className="btn h-9 min-h-9 px-3 text-xs text-[var(--color-bad)] hover:bg-[var(--color-bad-soft)]"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </li>
  );
}
