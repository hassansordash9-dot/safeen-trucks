import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhotoGallery } from '@/components/PhotoGallery';
import { ContactButtons } from '@/components/ContactButtons';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ShareButton } from '@/components/ShareButton';
import { ReportDialog } from '@/components/ReportDialog';
import { TruckCard } from '@/components/TruckCard';
import { Badge, SectionHeader, SpecRow, VerifiedBadge } from '@/components/ui';
import { IconEye, IconStore } from '@/components/icons';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getSimilarTrucks, getTruckBySlug } from '@/features/trucks/queries';
import { getFavoriteIds } from '@/features/favorites/queries';
import { findBrandBySlug } from '@/lib/reference';
import { registerView } from '@/features/trucks/views';
import { formatMonthYear, formatNumber, formatPrice, localisedName } from '@/lib/format';
import { primaryImage } from '@/lib/images';
import { absoluteUrl, localeAlternates } from '@/lib/seo';
import { routes } from '@/lib/routes';
import BrandLanding from './brand-landing';

type Props = {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = createTranslator(await getDictionary(locale));

  const brand = await findBrandBySlug(slug);
  if (brand) {
    return {
      title: `${brand.name} ${t('nav.trucks')}`,
      description: `${brand.name} — ${t('home.heroSubtitle')}`,
      alternates: localeAlternates(locale, `trucks/${slug}`),
    };
  }

  const truck = await getTruckBySlug(slug);
  if (!truck || truck.status !== 'published') return { title: t('errors.notFound') };

  const image = primaryImage(truck.images);
  const description = truck.description?.slice(0, 160) ?? t('home.heroSubtitle');

  return {
    title: truck.title,
    description,
    alternates: localeAlternates(locale, `trucks/${slug}`),
    openGraph: {
      type: 'website',
      title: truck.title,
      description,
      url: absoluteUrl(routes.truck(locale, slug)),
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function TruckDetailPage({ params, searchParams }: Props) {
  const [{ locale, slug }, rawParams] = await Promise.all([params, searchParams]);

  const brand = await findBrandBySlug(slug);
  if (brand) return <BrandLanding locale={locale} brand={brand} searchParams={rawParams} />;

  const t = createTranslator(await getDictionary(locale));
  const truck = await getTruckBySlug(slug);
  if (!truck) notFound();

  const isPublic = truck.status === 'published' || truck.status === 'sold';
  if (!isPublic) notFound();

  const [similar, favorites] = await Promise.all([
    getSimilarTrucks(truck),
    getFavoriteIds('truck'),
  ]);
  await registerView('truck', truck.id);

  const specs = [
    { label: t('truck.brand'), value: truck.brand?.name },
    { label: t('truck.model'), value: truck.model?.name },
    { label: t('truck.year'), value: formatNumber(truck.year, locale) },
    {
      label: t('truck.mileage'),
      value:
        truck.mileage_km === null || truck.mileage_km === undefined
          ? null
          : `${formatNumber(truck.mileage_km, locale)} ${t('common.km')}`,
    },
    {
      label: t('truck.horsepower'),
      value: truck.horsepower ? `${formatNumber(truck.horsepower, locale)} ${t('common.hp')}` : null,
    },
    { label: t('truck.engine'), value: truck.engine },
    {
      label: t('truck.transmission'),
      value: truck.transmission ? t(`transmission.${truck.transmission}`) : null,
    },
    { label: t('truck.axle'), value: truck.axle_configuration },
    { label: t('truck.emission'), value: truck.emission_class },
    { label: t('truck.type'), value: localisedName(truck.truck_type, locale) },
    { label: t('truck.condition'), value: t(`condition.${truck.condition}`) },
    { label: t('truck.color'), value: truck.color },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: truck.title,
    description: truck.description ?? undefined,
    image: primaryImage(truck.images) ?? undefined,
    brand: truck.brand ? { '@type': 'Brand', name: truck.brand.name } : undefined,
    offers: {
      '@type': 'Offer',
      price: truck.price,
      priceCurrency: truck.currency,
      availability:
        truck.status === 'sold'
          ? 'https://schema.org/SoldOut'
          : 'https://schema.org/InStock',
      url: absoluteUrl(routes.truck(locale, truck.slug)),
    },
  };

  return (
    <div className="container-page py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-4 text-sm text-[var(--color-muted)]">
        <Link href={routes.trucks(locale)} className="hover:underline">
          {t('nav.trucks')}
        </Link>
        {truck.brand && (
          <>
            {' · '}
            <Link href={routes.truckBrand(locale, truck.brand.slug)} className="hover:underline">
              {truck.brand.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <PhotoGallery images={truck.images ?? []} title={truck.title} />

          <header>
            <div className="flex flex-wrap items-center gap-2">
              {truck.featured && <Badge tone="accent">{t('listing.featured')}</Badge>}
              {truck.verified_listing && <VerifiedBadge label={t('listing.verified')} />}
              {truck.status === 'sold' && <Badge tone="dark">{t('status.sold')}</Badge>}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">{truck.title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-[var(--color-muted)]">
              <span>{localisedName(truck.location, locale)}</span>
              <span>·</span>
              <span>
                {t('listing.postedOn')} {formatMonthYear(truck.published_at, locale)}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <IconEye className="h-4 w-4" />
                {formatNumber(truck.views_count, locale)}
              </span>
            </p>
          </header>

          <section className="card p-4">
            <h2 className="mb-2 text-base font-bold text-[var(--color-text)]">
              {t('listing.specs')}
            </h2>
            <dl className="sm:grid sm:grid-cols-2 sm:gap-x-8">
              {specs.map((spec) => (
                <SpecRow key={spec.label} label={spec.label} value={spec.value} />
              ))}
            </dl>
          </section>

          <section className="card p-4">
            <h2 className="mb-2 text-base font-bold text-[var(--color-text)]">
              {t('listing.description')}
            </h2>
            <p className="text-sm whitespace-pre-line text-[var(--color-text)]">
              {truck.description?.trim() || t('listing.noDescription')}
            </p>
          </section>

          <ReportDialog kind="truck" listingId={truck.id} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-4">
            <p className="text-2xl font-extrabold text-[var(--color-text)]">
              {formatPrice(truck.price, truck.currency, locale)}
            </p>
            {truck.negotiable && (
              <p className="mt-1 text-sm text-[var(--color-muted)]">{t('listing.negotiable')}</p>
            )}

            <div className="mt-3 flex gap-2">
              <FavoriteButton
                kind="truck"
                listingId={truck.id}
                initial={favorites.has(truck.id)}
                variant="inline"
              />
              <ShareButton title={truck.title} />
            </div>

            <div className="mt-4 hidden lg:block">
              <ContactButtons
                kind="truck"
                listingId={truck.id}
                title={truck.title}
                phone={truck.phone}
                whatsapp={truck.whatsapp}
              />
            </div>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-base font-bold text-[var(--color-text)]">
              {t('listing.seller')}
            </h2>
            {truck.dealer ? (
              <Link
                href={routes.dealer(locale, truck.dealer.slug)}
                className="flex items-center gap-3 hover:underline"
              >
                <span className="grid h-10 w-10 place-items-center rounded-md bg-[var(--color-surface)]">
                  <IconStore className="h-5 w-5 text-[var(--color-muted)]" />
                </span>
                <span>
                  <span className="block font-semibold text-[var(--color-text)]">
                    {truck.dealer.business_name}
                  </span>
                  {truck.dealer.verified && (
                    <VerifiedBadge label={t('dealer.verifiedDealer')} />
                  )}
                </span>
              </Link>
            ) : (
              <p className="font-semibold text-[var(--color-text)]">
                {truck.seller?.full_name ?? t('listing.seller')}
              </p>
            )}
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {t('listing.memberSince')} {formatMonthYear(truck.seller?.created_at, locale)}
            </p>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <SectionHeader title={t('listing.similar')} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {similar.map((item) => (
              <TruckCard
                key={item.id}
                truck={item}
                locale={locale}
                favorited={favorites.has(item.id)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-14 z-20 border-t border-[var(--color-line)] bg-[var(--color-card)] p-2 lg:hidden">
        <ContactButtons
          kind="truck"
          listingId={truck.id}
          title={truck.title}
          phone={truck.phone}
          whatsapp={truck.whatsapp}
          size="large"
        />
      </div>
    </div>
  );
}
