import Link from 'next/link';
import { HeroSearch } from '@/components/HeroSearch';
import { TruckCard } from '@/components/TruckCard';
import { DealerCard } from '@/components/DealerCard';
import { SectionHeader } from '@/components/ui';
import { CategoryCard } from '@/components/CategoryCard';
import { IconGear, IconStore, IconTruck } from '@/components/icons';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import { locales, type Locale } from '@/i18n/config';
import { getBrands, getLocations, getModels, getPartCategories, getTruckTypes } from '@/lib/reference';
import { getHomeTrucks } from '@/features/trucks/queries';
import { getFeaturedDealers } from '@/features/dealers/queries';
import { getFavoriteIds } from '@/features/favorites/queries';
import { localisedName } from '@/lib/format';
import { routes } from '@/lib/routes';
import { LOGO_PATH, absoluteUrl, localeAlternates } from '@/lib/seo';

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  return {
    title: { absolute: t('seo.title') },
    description: t('seo.description'),
    alternates: localeAlternates(locale, ''),
  };
}

/** Organisation and site markup, so search engines attach the brand to this domain. */
function brandJsonLd(locale: Locale, name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${absoluteUrl('/')}#organization`,
        name: 'Safeen Trucks',
        alternateName: name,
        url: absoluteUrl(`/${locale}`),
        logo: absoluteUrl(LOGO_PATH),
        image: absoluteUrl(LOGO_PATH),
        description,
        areaServed: [
          { '@type': 'Country', name: 'Iraq' },
          { '@type': 'AdministrativeArea', name: 'Kurdistan Region' },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${absoluteUrl('/')}#website`,
        name: 'Safeen Trucks',
        url: absoluteUrl(`/${locale}`),
        inLanguage: [...locales],
        publisher: { '@id': `${absoluteUrl('/')}#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${absoluteUrl(`/${locale}/trucks`)}?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));

  const [brands, models, locations, types, categories, trucks, dealers, favorites] =
    await Promise.all([
      getBrands(),
      getModels(),
      getLocations(),
      getTruckTypes(),
      getPartCategories(),
      getHomeTrucks(),
      getFeaturedDealers(8),
      getFavoriteIds('truck'),
    ]);

  const quickLinks = [
    { href: routes.trucks(locale), label: t('home.quickTrucks'), Icon: IconTruck },
    { href: routes.parts(locale), label: t('home.quickParts'), Icon: IconGear },
    { href: routes.dealers(locale), label: t('home.quickDealers'), Icon: IconStore },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(brandJsonLd(locale, t('brand.name'), t('seo.description'))),
        }}
      />

      <section className="gold-rule bg-[var(--color-charcoal)] text-white">
        <div className="container-page py-10 sm:py-14">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-2 max-w-xl text-white/75">{t('home.heroSubtitle')}</p>

          <div className="mt-6 text-[var(--color-text)]">
            <HeroSearch brands={brands} models={models} locations={locations} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={routes.sell(locale)} className="btn btn-outline">
              {t('home.sellTruck')}
            </Link>
            <Link
              href={routes.requestTruck(locale)}
              className="btn text-white hover:bg-white/10"
            >
              {t('request.truckTitle')}
            </Link>
          </div>
        </div>
      </section>

      <div className="container-page space-y-12 py-10">
        <section className="grid gap-3 sm:grid-cols-3">
          {quickLinks.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="card flex items-center gap-3 p-4 hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-md bg-[var(--color-surface)] text-[var(--color-text)]">
                <Icon />
              </span>
              <span className="font-semibold text-[var(--color-text)]">{label}</span>
            </Link>
          ))}
        </section>

        <section>
          <SectionHeader title={t('home.browseByBrand')} href={routes.trucks(locale)} linkLabel={t('common.viewAll')} />
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {brands.slice(0, 12).map((brand) => (
              <li key={brand.id}>
                <Link
                  href={routes.truckBrand(locale, brand.slug)}
                  className="card flex h-16 items-center justify-center px-2 text-center text-sm font-semibold text-[var(--color-text)] hover:shadow-md"
                >
                  {brand.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {trucks.featured.length > 0 && (
          <section>
            <SectionHeader title={t('home.featuredTrucks')} href={routes.trucks(locale)} linkLabel={t('common.viewAll')} />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {trucks.featured.map((truck, index) => (
                <TruckCard
                  key={truck.id}
                  truck={truck}
                  locale={locale}
                  favorited={favorites.has(truck.id)}
                  priority={index < 2}
                />
              ))}
            </div>
          </section>
        )}

        {trucks.latest.length > 0 && (
          <section>
            <SectionHeader title={t('home.latestTrucks')} href={routes.trucks(locale)} linkLabel={t('common.viewAll')} />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {trucks.latest.map((truck) => (
                <TruckCard
                  key={truck.id}
                  truck={truck}
                  locale={locale}
                  favorited={favorites.has(truck.id)}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeader title={t('home.truckTypes')} />
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {types.map((type) => (
              <li key={type.id}>
                <CategoryCard
                  href={`${routes.trucks(locale)}?type=${type.slug}`}
                  label={localisedName(type, locale)}
                  slug={type.slug}
                  kind="truck"
                />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionHeader title={t('home.partCategories')} href={routes.parts(locale)} linkLabel={t('common.viewAll')} />
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {categories.map((category) => (
              <li key={category.id}>
                <CategoryCard
                  href={routes.partCategory(locale, category.slug)}
                  label={localisedName(category, locale)}
                  slug={category.slug}
                  kind="part"
                />
              </li>
            ))}
          </ul>
        </section>

        {dealers.length > 0 && (
          <section>
            <SectionHeader title={t('home.trustedDealers')} href={routes.dealers(locale)} linkLabel={t('common.viewAll')} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {dealers.map((dealer) => (
                <DealerCard key={dealer.id} dealer={dealer} locale={locale} />
              ))}
            </div>
          </section>
        )}

        <section className="card flex flex-col items-start gap-4 border-[var(--color-gold)]/30 bg-[var(--color-black)] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">{t('home.sellCtaTitle')}</h2>
            <p className="mt-1 text-white/75">{t('home.sellCtaBody')}</p>
          </div>
          <Link href={routes.sell(locale)} className="btn btn-accent shrink-0">
            {t('home.sellCtaButton')}
          </Link>
        </section>
      </div>
    </>
  );
}
