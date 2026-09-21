import Image from 'next/image';
import Link from 'next/link';
import { VerifiedBadge } from './ui';
import { IconStore } from './icons';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import { localisedName } from '@/lib/format';
import { imageUrl } from '@/lib/images';
import { routes } from '@/lib/routes';
import type { Locale } from '@/i18n/config';
import type { Dealer } from '@/types';

export async function DealerCard({ dealer, locale }: { dealer: Dealer; locale: Locale }) {
  const t = createTranslator(await getDictionary(locale));
  const logo = imageUrl(dealer.logo_url);

  return (
    <article className="card relative flex items-center gap-3 p-3 transition-shadow hover:shadow-md">
      <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-[var(--color-surface)]">
        {logo ? (
          <Image src={logo} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          <IconStore className="h-6 w-6 text-[var(--color-muted)]" />
        )}
      </span>

      <div className="min-w-0">
        <h3 className="line-clamp-1 font-semibold text-[var(--color-text)]">
          <Link href={routes.dealer(locale, dealer.slug)} className="after:absolute after:inset-0">
            {dealer.business_name}
          </Link>
        </h3>
        <p className="line-clamp-1 text-sm text-[var(--color-muted)]">
          {localisedName(dealer.location, locale)}
        </p>
        {dealer.verified && (
          <span className="mt-1 inline-block">
            <VerifiedBadge label={t('dealer.verifiedDealer')} />
          </span>
        )}
      </div>
    </article>
  );
}
