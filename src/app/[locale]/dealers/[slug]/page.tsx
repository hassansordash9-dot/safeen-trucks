import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { TruckCard } from '@/components/TruckCard';
import { PartCard } from '@/components/PartCard';
import { ContactButtons } from '@/components/ContactButtons';
import { SectionHeader, VerifiedBadge } from '@/components/ui';
import { IconStore } from '@/components/icons';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getDealerBySlug } from '@/features/dealers/queries';
import { getDealerTrucks } from '@/features/trucks/queries';
import { getDealerParts } from '@/features/parts/queries';
import { getFavoriteIds } from '@/features/favorites/queries';
import { localisedName } from '@/lib/format';
import { imageUrl } from '@/lib/images';
import { localeAlternates } from '@/lib/seo';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const dealer = await getDealerBySlug(slug);
  if (!dealer) return {};
  return {
    title: dealer.business_name,
    description: dealer.description?.slice(0, 160) ?? undefined,
    alternates: localeAlternates(locale, `dealers/${slug}`),
  };
}

export default async function DealerPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = createTranslator(await getDictionary(locale));

  const dealer = await getDealerBySlug(slug);
  if (!dealer || !dealer.active) notFound();

  const [trucks, parts, truckFavorites, partFavorites] = await Promise.all([
    getDealerTrucks(dealer.id),
    getDealerParts(dealer.id),
    getFavoriteIds('truck'),
    getFavoriteIds('part'),
  ]);

  const logo = imageUrl(dealer.logo_url);
  const cover = imageUrl(dealer.cover_url);

  return (
    <div>
      <div className="relative h-36 bg-[var(--color-black)] sm:h-48">
        {cover && <Image src={cover} alt="" fill sizes="100vw" className="object-cover" priority />}
      </div>

      <div className="container-page">
        <header className="card -mt-10 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-[var(--color-surface)]">
            {logo ? (
              <Image src={logo} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <IconStore className="h-8 w-8 text-[var(--color-muted)]" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[var(--color-text)]">
              {dealer.business_name}
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              {localisedName(dealer.location, locale)}
            </p>
            {dealer.verified && (
              <span className="mt-1 inline-block">
                <VerifiedBadge label={t('dealer.verifiedDealer')} />
              </span>
            )}
          </div>

          {dealer.phone && (
            <div className="w-full sm:w-64">
              <ContactButtons
                kind="truck"
                listingId={dealer.id}
                title={dealer.business_name}
                phone={dealer.phone}
                whatsapp={dealer.whatsapp}
              />
            </div>
          )}
        </header>

        {dealer.description && (
          <section className="card mt-4 p-4">
            <h2 className="mb-2 font-bold text-[var(--color-text)]">{t('dealer.about')}</h2>
            <p className="text-sm whitespace-pre-line">{dealer.description}</p>
          </section>
        )}

        <div className="mt-8 space-y-10 pb-8">
          {trucks.length > 0 && (
            <section>
              <SectionHeader title={t('dealer.trucks')} />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {trucks.map((truck) => (
                  <TruckCard
                    key={truck.id}
                    truck={truck}
                    locale={locale}
                    favorited={truckFavorites.has(truck.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {parts.length > 0 && (
            <section>
              <SectionHeader title={t('dealer.parts')} />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {parts.map((part) => (
                  <PartCard
                    key={part.id}
                    part={part}
                    locale={locale}
                    favorited={partFavorites.has(part.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {trucks.length === 0 && parts.length === 0 && (
            <p className="text-sm text-[var(--color-muted)]">{t('empty.noListings')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
