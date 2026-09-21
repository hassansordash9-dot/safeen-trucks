import Image from 'next/image';
import Link from 'next/link';
import { FavoriteButton } from './FavoriteButton';
import { CategoryIcon, TRUCK_BACKDROP } from './CategoryIcon';
import { Badge, VerifiedBadge } from './ui';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import { formatNumber, formatPrice, localisedName } from '@/lib/format';
import { primaryImage } from '@/lib/images';
import { routes } from '@/lib/routes';
import type { Locale } from '@/i18n/config';
import type { Truck } from '@/types';

export async function TruckCard({
  truck,
  locale,
  favorited = false,
  priority = false,
}: {
  truck: Truck;
  locale: Locale;
  favorited?: boolean;
  priority?: boolean;
}) {
  const t = createTranslator(await getDictionary(locale));
  const image = primaryImage(truck.images);

  return (
    <article className="card group relative overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-[var(--color-surface)]">
        {image ? (
          <Image
            src={image}
            alt={truck.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className={`grid h-full place-items-center ${TRUCK_BACKDROP}`}>
            <CategoryIcon
              slug={truck.truck_type?.slug}
              kind="truck"
              className="h-3/5 w-3/5"
            />
          </div>
        )}

        <div className="absolute start-2 top-2 flex flex-col items-start gap-1">
          {truck.featured && <Badge tone="accent">{t('listing.featured')}</Badge>}
          {truck.status === 'sold' && <Badge tone="dark">{t('status.sold')}</Badge>}
        </div>

        <FavoriteButton kind="truck" listingId={truck.id} initial={favorited} />
      </div>

      <div className="p-3">
        <h3 className="line-clamp-1 font-semibold text-[var(--color-text)]">
          <Link href={routes.truck(locale, truck.slug)} className="after:absolute after:inset-0">
            {truck.title}
          </Link>
        </h3>

        <p className="mt-1 line-clamp-1 text-sm text-[var(--color-muted)]">
          {truck.year}
          {truck.mileage_km !== null && truck.mileage_km !== undefined && (
            <> · {formatNumber(truck.mileage_km, locale)} {t('common.km')}</>
          )}
          {truck.location && <> · {localisedName(truck.location, locale)}</>}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-base font-bold text-[var(--color-text)]">
            {formatPrice(truck.price, truck.currency, locale)}
          </p>
          {truck.verified_listing && <VerifiedBadge label={t('listing.verified')} />}
        </div>
      </div>
    </article>
  );
}
