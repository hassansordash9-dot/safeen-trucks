import Image from 'next/image';
import Link from 'next/link';
import { FavoriteButton } from './FavoriteButton';
import { CATEGORY_BACKDROP, CategoryIcon } from './CategoryIcon';
import { Badge } from './ui';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import { formatPrice, localisedName } from '@/lib/format';
import { primaryImage } from '@/lib/images';
import { routes } from '@/lib/routes';
import type { Locale } from '@/i18n/config';
import type { Part } from '@/types';

export async function PartCard({
  part,
  locale,
  favorited = false,
}: {
  part: Part;
  locale: Locale;
  favorited?: boolean;
}) {
  const t = createTranslator(await getDictionary(locale));
  const image = primaryImage(part.images);

  return (
    <article className="card group relative overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-[var(--color-surface)]">
        {image ? (
          <Image
            src={image}
            alt={part.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className={`grid h-full place-items-center ${CATEGORY_BACKDROP}`}>
            <CategoryIcon
              slug={part.category?.slug}
              kind="part"
              className="h-3/5 w-3/5"
            />
          </div>
        )}

        <div className="absolute start-2 top-2 flex flex-col items-start gap-1">
          {part.featured && <Badge tone="accent">{t('listing.featured')}</Badge>}
          <Badge>{t(`condition.${part.condition}`)}</Badge>
        </div>

        <FavoriteButton kind="part" listingId={part.id} initial={favorited} />
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 min-h-11 font-semibold text-[var(--color-text)]">
          <Link href={routes.part(locale, part.slug)} className="after:absolute after:inset-0">
            {part.title}
          </Link>
        </h3>

        <p className="mt-1 line-clamp-1 text-sm text-[var(--color-muted)]">
          {part.part_number ?? part.oem_number ?? localisedName(part.category, locale)}
          {part.location && <> · {localisedName(part.location, locale)}</>}
        </p>

        <p className="mt-2 text-base font-bold text-[var(--color-text)]">
          {formatPrice(part.price, part.currency, locale)}
        </p>
      </div>
    </article>
  );
}
